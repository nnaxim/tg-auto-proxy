const { NodeSSH } = require('node-ssh')

let lastResult = {}

async function runSetup({ ip, login, password }, send) {
  const ssh = new NodeSSH()

  send('log', `Подключаюсь к ${ip}...`)

  try {
    await ssh.connect({
      host: ip,
      username: login,
      password,
    })
  } catch (e) {
    send('log', 'Ошибка подключения: ' + e.message)
    send('status', { text: 'Ошибка подключения', ok: false })
    return
  }

  send('log', 'Подключился')
  send('status', { text: 'Установка...', ok: null })

  const script = `
set -e

export DEBIAN_FRONTEND=noninteractive

echo "STEP: packages"
apt-get update -y

dpkg -s dante-server >/dev/null 2>&1 || apt-get install -y dante-server
dpkg -s docker.io >/dev/null 2>&1 || apt-get install -y docker.io
dpkg -s fail2ban >/dev/null 2>&1 || apt-get install -y fail2ban

echo "STEP: docker"

systemctl enable docker 2>/dev/null || true
systemctl start docker 2>/dev/null || true
sleep 2

if ! systemctl is-active --quiet docker; then
  echo "FIX: docker failed, retry"
  systemctl restart docker || true
  sleep 2
fi

echo "STEP: user"

if id "proxyuser" >/dev/null 2>&1; then
  PASS="EXISTS"
else
  PASS=$(openssl rand -hex 4)
  useradd -m proxyuser
  echo "proxyuser:$PASS" | chpasswd
fi

echo "STEP: network"
IFACE=$(ip route get 1 | awk '{print $5;exit}')

echo "STEP: danted"

cat > /etc/danted.conf <<EOF
logoutput: syslog
internal: 0.0.0.0 port = 1080
external: $IFACE
method: username
user.privileged: root
user.unprivileged: nobody
client pass { from: 0.0.0.0/0 to: 0.0.0.0/0 }
pass { from: 0.0.0.0/0 to: 0.0.0.0/0 }
EOF

systemctl restart danted
systemctl enable danted

echo "STEP: mtproto"

if docker ps -a | grep -q mtproto; then
  SECRET="EXISTS"
else
  SECRET=$(head -c 16 /dev/urandom | xxd -ps)

  docker rm -f mtproto 2>/dev/null || true

  docker run -d -p 443:443 --name mtproto \\
    -e SECRET=$SECRET telegrammessenger/proxy || true
fi

if [ "$SECRET" = "EXISTS" ]; then
  LINK="ALREADY_RUNNING"
else
  LINK="tg://proxy?server=${ip}&port=443&secret=$SECRET"
fi

echo "STEP: fail2ban"

if [ ! -f /etc/fail2ban/jail.local ]; then
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
banaction = iptables-multiport

[sshd]
enabled = true

[danted]
enabled = true
port = 1080
filter = danted
logpath = /var/log/syslog
maxretry = 5
EOF
fi

if [ ! -f /etc/fail2ban/filter.d/danted.conf ]; then
cat > /etc/fail2ban/filter.d/danted.conf <<EOF
[Definition]
failregex = ^.{0,60}danted\\[\\d+\\]: info: block\\(1\\): tcp/accept .* <HOST>.*\$
ignoreregex =
EOF
fi

systemctl restart fail2ban || true

echo "STEP: done"

echo "RESULT|$PASS|$LINK"
`

  let output = ''

  try {
    await ssh.execCommand(script, {
      onStdout: (chunk) => {
        const text = chunk.toString()
        output += text
        send('log', text.trim())
      },
      onStderr: (chunk) => {
        send('log', 'ERR: ' + chunk.toString())
      }
    })
  } catch (e) {
    send('log', 'Ошибка выполнения: ' + e.message)
    send('status', { text: 'Ошибка установки', ok: false })
    ssh.dispose()
    return
  }

  const line = output
  .split('\n')
  .find(l => l.startsWith('RESULT|'))

  if (!line) {
    send('log', 'RESULT не найден')
    send('status', { text: 'Ошибка установки', ok: false })
    ssh.dispose()
    return
  }

  const parts = line.split('|')

  lastResult = {
    user: 'proxyuser',
    pass: parts[1],
    link: parts[2],
  }

  ssh.dispose()

  send('status', { text: 'Готово', ok: true })
}

function getResult() {
  return lastResult
}

module.exports = { runSetup, getResult }
