const ipInput    = document.getElementById('ip')
const loginInput = document.getElementById('login')
const passInput  = document.getElementById('pass')

const logEl      = document.getElementById('log')
const statusText = document.getElementById('status-text')
const dot        = document.getElementById('dot')
const btnSetup   = document.getElementById('btn-setup')
const serversList = document.getElementById('servers-list')


document.querySelectorAll('.nav').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.nav').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
    document.getElementById(btn.dataset.page).classList.add('active')

    if (btn.dataset.page === 'servers') renderServers()
  }
})

function setStatus(text, state) {
  statusText.textContent = text
  dot.className = 'dot ' + (state || '')
}

function log(msg) {
  logEl.textContent += msg + '\n'
  logEl.scrollTop = logEl.scrollHeight
}

function getServers() {
  return JSON.parse(localStorage.getItem('servers') || '[]')
}

function saveServer(server) {
  const list = getServers()
  list.push(server)
  localStorage.setItem('servers', JSON.stringify(list))
}

function deleteServer(index) {
  const list = getServers()
  list.splice(index, 1)
  localStorage.setItem('servers', JSON.stringify(list))
}

function showCopied(btn) {
  const original = btn.innerHTML
  btn.innerHTML = 'Скопировано'
  btn.disabled = true

  setTimeout(() => {
    btn.innerHTML = original
    btn.disabled = false
  }, 1200)
}

function confirmDelete() {
  return confirm('Удалить сервер?')
}

async function checkOnline(ip) {
  try {
    const res = await fetch(`http://${ip}:1080`, { method: 'HEAD', mode: 'no-cors' })
    return true
  } catch {
    return false
  }
}

function renderServers() {
  const servers = getServers()
  serversList.innerHTML = ''

  if (!servers.length) {
    serversList.innerHTML = '<div class="empty">Нет серверов</div>'
    return
  }

  servers.forEach((s, i) => {
    const el = document.createElement('div')
    el.className = 'server-card'

    el.innerHTML = `
      <div class="server-top">
        <div class="ip">${s.ip}</div>
        <div class="status loading">Проверка...</div>
      </div>

      <div class="block">
        <div class="label">SOCKS5</div>
        <div class="value">${s.user}:${s.pass}</div>
      </div>

      <div class="block">
        <div class="label">MTProto</div>
        <div class="value small">${s.mtproto}</div>
      </div>

      <div class="actions">
        <button class="copy-socks">SOCKS</button>
        <button class="copy-mtproto">MTProto</button>
        <button class="delete danger">Удалить</button>
      </div>
    `

    serversList.appendChild(el)

    const btnSocks = el.querySelector('.copy-socks')
    const btnMt    = el.querySelector('.copy-mtproto')
    const btnDel   = el.querySelector('.delete')
    const statusEl = el.querySelector('.status')

    btnSocks.onclick = () => {
      navigator.clipboard.writeText(`socks5://${s.user}:${s.pass}@${s.ip}:1080`)
      showCopied(btnSocks)
    }

    btnMt.onclick = () => {
      navigator.clipboard.writeText(s.mtproto)
      showCopied(btnMt)
    }

    btnDel.onclick = () => {
      if (!confirmDelete()) return
      deleteServer(i)
      renderServers()
    }

    checkOnline(s.ip).then(online => {
      statusEl.textContent = online ? 'Онлайн' : 'Оффлайн'
      statusEl.className = 'status ' + (online ? 'online' : 'offline')
    })
  })
}

window.api.onLog(log)

window.api.onStatus(async ({ text, ok }) => {
  if (ok === true) {
    setStatus(text, 'ok')
    btnSetup.disabled = false

    const res = await window.api.getResult()

    if (!res || !res.pass) {
      log('нет данных от сервера')
      return
    }

    saveServer({
      ip: ipInput.value.trim(),
      user: res.user || 'proxyuser',
      pass: res.pass || 'unknown',
      mtproto: res.link || '',
    })

  } else if (ok === false) {
    setStatus(text, 'error')
    btnSetup.disabled = false
  } else {
    setStatus(text, 'pending')
  }
})

btnSetup.onclick = () => {
  logEl.textContent = ''

  const ip    = ipInput.value.trim()
  const login = loginInput.value.trim()
  const pass  = passInput.value

  if (!ip || !login || !pass) return

  btnSetup.disabled = true
  setStatus('Подключаюсь...', 'pending')

  window.api.setup({ ip, login, password: pass })
}
