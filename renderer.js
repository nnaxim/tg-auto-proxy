const ipInput      = document.getElementById('ip')
const loginInput   = document.getElementById('login')
const passInput    = document.getElementById('pass')
const portInput    = document.getElementById('port')
const sshPortInput = document.getElementById('ssh-port')
const ipErr        = document.getElementById('ip-err')
const loginErr     = document.getElementById('login-err')
const passErr      = document.getElementById('pass-err')
const portErr      = document.getElementById('port-err')
const sshPortErr   = document.getElementById('ssh-port-err')
const logEl        = document.getElementById('log')
const progressEl   = document.getElementById('progress')
const statusText   = document.getElementById('status-text')
const dot          = document.getElementById('dot')
const btnSetup     = document.getElementById('btn-setup')
const btnReset     = document.getElementById('btn-reset')

function isValidIP(ip) {
  const parts = ip.split('.')
  if (parts.length !== 4) return false
  return parts.every(p => {
    const n = Number(p)
    return p !== '' && !isNaN(n) && n >= 0 && n <= 255
  })
}

function isValidPort(p) {
  const n = Number(p)
  return Number.isInteger(n) && n > 0 && n <= 65535
}

function clearErrors() {
  ipErr.textContent      = ''
  loginErr.textContent   = ''
  passErr.textContent    = ''
  portErr.textContent    = ''
  sshPortErr.textContent = ''
}

function setStatus(text, state) {
  statusText.textContent = text
  dot.className = 'dot ' + (state || '')
}

function appendLog(msg) {
  logEl.textContent += msg + '\n'
  logEl.parentElement.scrollTop = logEl.parentElement.scrollHeight
}

window.api.onLog(appendLog)

window.api.onProgress(val => {
  progressEl.value = val
})

window.api.onStatus(({ text, ok }) => {
  if (ok === true) {
    setStatus(text, 'ok')
    btnSetup.disabled = false
    btnSetup.classList.remove('loading')
  } else if (ok === false) {
    setStatus(text, 'error')
    btnSetup.disabled = false
    btnSetup.classList.remove('loading')
  } else {
    setStatus(text, 'pending')
  }
})

btnSetup.addEventListener('click', () => {
  clearErrors()
  logEl.textContent = ''
  progressEl.value  = 0
  setStatus('', '')

  const ip      = ipInput.value.trim()
  const login   = loginInput.value.trim()
  const pass    = passInput.value
  const port    = portInput.value.trim() || '1080'
  const sshPort = sshPortInput.value.trim() || '22'

  let valid = true

  if (!ip)                   { ipErr.textContent      = 'Введи IP адрес';        valid = false }
  else if (!isValidIP(ip))   { ipErr.textContent      = 'Неверный формат IP';    valid = false }
  if (!login)                { loginErr.textContent   = 'Введи логин';           valid = false }
  if (!pass)                 { passErr.textContent    = 'Введи пароль';          valid = false }
  if (!isValidPort(port))    { portErr.textContent    = 'Порт от 1 до 65535';    valid = false }
  if (!isValidPort(sshPort)) { sshPortErr.textContent = 'Порт от 1 до 65535';    valid = false }

  if (!valid) return

  btnSetup.disabled = true
  btnSetup.classList.add('loading')
  setStatus('Подключаюсь...', 'pending')

  window.api.setup({ ip, login, password: pass, port, sshPort })
})

btnReset.addEventListener('click', () => {
  ipInput.value      = ''
  loginInput.value   = ''
  passInput.value    = ''
  portInput.value    = '1080'
  sshPortInput.value = '22'
  logEl.textContent  = ''
  progressEl.value   = 0
  clearErrors()
  setStatus('', '')
  btnSetup.disabled = false
  btnSetup.classList.remove('loading')
  btnSetup.textContent = 'Настроить'
})
