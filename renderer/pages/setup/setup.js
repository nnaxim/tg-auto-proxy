;(function() {
  const ipInput = document.getElementById('ip')
  const loginInput = document.getElementById('login')
  const passInput = document.getElementById('pass')
  const logEl = document.getElementById('log')
  const statusText = document.getElementById('status-text')
  const dot = document.getElementById('dot')
  const btnSetup = document.getElementById('btn-setup')
  const divider = document.getElementById('divider')
  const statusRow = document.getElementById('status-row')

  const state = window.__setupState

  function showStatusArea() {
    divider.style.display = 'block'
    statusRow.style.display = 'flex'
    logEl.style.display = 'block'
  }

  function setStatus(text, st) {
    statusText.textContent = text
    dot.className = 'dot ' + (st || '')
  }

  function log(msg) {
    logEl.textContent += msg + '\n'
    logEl.scrollTop = logEl.scrollHeight
  }

  // Восстанавливаем поля
  if (state.ip)    ipInput.value    = state.ip
  if (state.login) loginInput.value = state.login
  if (state.pass)  passInput.value  = state.pass

  // Восстанавливаем логи и статус
  if (state.logs || state.running) {
    showStatusArea()
    logEl.textContent = state.logs
    logEl.scrollTop = logEl.scrollHeight
    setStatus(state.statusText, state.statusState)
    if (state.running) btnSetup.disabled = true
  }

  // Сохраняем поля при вводе
  ipInput.oninput    = () => state.ip    = ipInput.value
  loginInput.oninput = () => state.login = loginInput.value
  passInput.oninput  = () => state.pass  = passInput.value

  window.api.onLog(log)

  window.api.onStatus(async ({ text, ok }) => {
    if (ok === true) {
      setStatus(text, 'ok')
      state.statusText = text
      state.statusState = 'ok'
      state.running = false
      btnSetup.disabled = false

      const res = await window.api.getResult()
      const list = JSON.parse(localStorage.getItem('servers') || '[]')
      const idx = list.findIndex(s => s.ip === ipInput.value.trim())
      const entry = {
        ip: ipInput.value.trim(),
        user: res.user,
        pass: res.pass,
        mtproto: res.link,
      }

      if (idx !== -1) {
        list[idx] = entry
      } else {
        list.push(entry)
      }

      localStorage.setItem('servers', JSON.stringify(list))

    } else if (ok === false) {
      setStatus(text, 'error')
      state.statusText = text
      state.statusState = 'error'
      state.running = false
      btnSetup.disabled = false
    } else {
      setStatus(text, 'pending')
      state.statusText = text
      state.statusState = 'pending'
    }
  })

  btnSetup.onclick = () => {
    logEl.textContent = ''
    state.logs = ''
    state.running = true
    state.statusText = 'Подключаюсь...'
    state.statusState = 'pending'

    showStatusArea()
    btnSetup.disabled = true
    setStatus('Подключаюсь...', 'pending')

    window.api.setup({
      ip: ipInput.value,
      login: loginInput.value,
      password: passInput.value
    })
  }
})()
