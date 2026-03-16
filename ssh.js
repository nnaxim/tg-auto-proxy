const { NodeSSH } = require('node-ssh')

const STEPS = [
  {
    name: 'Обновляю пакеты...',
    cmd: 'apt-get update -y 2>&1 | tail -3',
    progress: 0.25,
  },
  {
    name: 'Устанавливаю Dante SOCKS5...',
    cmd: 'apt-get install -y dante-server 2>&1 | tail -3',
    progress: 0.5,
  },
  {
    name: 'Настраиваю конфиг...',
    cmd: (port) => `cat > /etc/danted.conf << 'EOF'
logoutput: stderr
internal: 0.0.0.0 port = ${port}
external: $(ip route get 1 | awk '{print $7;exit}')
clientmethod: none
socksmethod: none
client pass { from: 0.0.0.0/0 to: 0.0.0.0/0 }
socks pass { from: 0.0.0.0/0 to: 0.0.0.0/0 }
EOF`,
    progress: 0.65,
  },
  {
    name: 'Запускаю сервис...',
    cmd: 'systemctl enable danted && systemctl restart danted',
    progress: 0.8,
  },
  {
    name: 'Открываю порт...',
    cmd: (port) =>
      `ufw allow ${port}/tcp 2>/dev/null || iptables -A INPUT -p tcp --dport ${port} -j ACCEPT 2>/dev/null; true`,
    progress: 0.9,
  },
  {
    name: 'Проверяю статус...',
    cmd: 'systemctl is-active danted',
    progress: 1.0,
  },
]

function friendlyError(msg) {
  if (msg.includes('connection refused'))
    return 'соединение отклонено - проверь IP или сервер выключен'
  if (msg.includes('timeout') || msg.includes('i/o timeout'))
    return 'сервер не ответил - проверь IP адрес'
  if (msg.includes('unable to authenticate') || msg.includes('no supported methods'))
    return 'неверный логин или пароль'
  if (msg.includes('no route to host'))
    return 'не удалось найти сервер - проверь IP адрес'
  if (msg.includes('network is unreachable'))
    return 'нет интернета - проверь подключение'
  return 'не удалось подключиться - проверь данные'
}

async function runSetup({ ip, login, password, port, sshPort }, send) {
  const ssh = new NodeSSH()

  send('log', `Подключаюсь к ${ip}...`)

  try {
    await ssh.connect({
      host: ip,
      username: login,
      password,
      port: parseInt(sshPort) || 22,
      readyTimeout: 15000,
    })
  } catch (e) {
    send('log', 'Ошибка: ' + friendlyError(e.message))
    send('status', { text: 'Ошибка подключения', ok: false })
    send('progress', 0)
    return
  }

  send('log', 'Подключился.')
  send('progress', 0.1)
  send('status', { text: 'Настраиваю...', ok: null })

  for (const step of STEPS) {
    send('log', step.name)
    const cmd = typeof step.cmd === 'function' ? step.cmd(port) : step.cmd
    try {
      const result = await ssh.execCommand(cmd)
      if (result.code !== 0 && result.stderr) {
        send('log', 'Ошибка: ' + result.stderr)
        send('status', { text: 'Ошибка установки', ok: false })
        ssh.dispose()
        return
      }
    } catch (e) {
      send('log', 'Ошибка: ' + e.message)
      send('status', { text: 'Ошибка установки', ok: false })
      ssh.dispose()
      return
    }
    send('log', 'OK')
    send('progress', step.progress)
    await new Promise((r) => setTimeout(r, 300))
  }

  ssh.dispose()
  send('status', { text: 'Готово', ok: true })
  send('log', '')
  send('log', 'Настрой Telegram:')
  send('log', 'Settings → Advanced → Proxy → SOCKS5')
  send('log', `Host: ${ip}    Port: ${port}`)
}

module.exports = { runSetup }
