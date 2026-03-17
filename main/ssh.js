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

apt-get install -y dante-server docker.io fail2ban curl

echo "STEP: docker"

systemctl daemon-reexec
systemctl enable docker
systemctl restart docker

sleep 3

if ! systemctl is-active --quiet docker; then
  echo "FIX: reinstall docker"
  apt-get install -y --reinstall docker.io containerd
  systemctl daemon-reexec
  systemctl restart docker
  sleep 3
fi

if ! systemctl is-active --quiet docker; then
  echo "ERROR: docker failed"
else
  echo "OK: docker running"
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

systemctl enable danted
systemctl restart danted

echo "STEP: mtproto"

# убиваем всё что может мешать
docker rm -f mtproto 2>/dev/null || true

# освобождаем порт если вдруг занят
fuser -k 443/tcp 2>/dev/null || true

# правильный secret (32 hex символа)
SECRET=$(head -c 16 /dev/urandom | xxd -ps)

docker run -d -p 443:443 --name mtproto \\
  --restart always \\
  -e SECRET=$SECRET \\
  telegrammessenger/proxy

sleep 3

if ! docker ps | grep -q mtproto; then
  echo "ERROR: mtproto failed"
  docker logs mtproto || true
else
  echo "OK: mtproto running"
fi

LINK="tg://proxy?server=${ip}&port=443&secret=$SECRET"

echo "STEP: fail2ban"

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

cat > /etc/fail2ban/filter.d/danted.conf <<EOF
[Definition]
failregex = ^.{0,60}danted\\[\\d+\\]: info: block\\(1\\): tcp/accept .* <HOST>.*\$
ignoreregex =
EOF

systemctl enable fail2ban
systemctl restart fail2ban

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
