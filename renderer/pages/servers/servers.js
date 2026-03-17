;(function() {
  const serversList = document.getElementById('servers-list')

  const iconCopy = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`

  const iconDel = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`

  function getServers() {
    return JSON.parse(localStorage.getItem('servers') || '[]')
  }

  function deleteServer(index) {
    const list = getServers()
    list.splice(index, 1)
    localStorage.setItem('servers', JSON.stringify(list))
  }

  async function getCountry(ip) {
    try {
      const r = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode,country`)
      const d = await r.json()
      return d.country || 'Неизвестно'
    } catch {
      return 'Неизвестно'
    }
  }

  function confirmDelete(index) {
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-title">Удалить сервер?</div>
        <div class="modal-text">Это действие нельзя отменить</div>
        <div class="modal-actions">
          <button class="modal-btn cancel">Отмена</button>
          <button class="modal-btn confirm">Удалить</button>
        </div>
      </div>
    `
    document.body.appendChild(overlay)
    overlay.querySelector('.cancel').onclick = () => overlay.remove()
    overlay.querySelector('.confirm').onclick = () => {
      overlay.remove()
      deleteServer(index)
      renderServers()
    }
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove() }
  }

  async function renderServers() {
    const servers = getServers()
    serversList.innerHTML = ''

    if (!servers.length) {
      serversList.innerHTML = `
        <div class="empty-state">
          <div class="empty-title">Нет серверов</div>
          <div class="empty-sub">Добавьте первый сервер через Setup</div>
        </div>
      `
      return
    }

    for (let i = 0; i < servers.length; i++) {
      const s = servers[i]
      const el = document.createElement('div')
      el.className = 'server-card'

      const socks5 = `${s.user}:${s.pass}@${s.ip}:1080`

      el.innerHTML = `
        <div class="sc-header">
          <div class="sc-ip-row">
            <div class="sc-ip">${s.ip}</div>
            <div class="sc-badge loading" id="badge-${i}">
              <span class="sc-dot"></span> Проверка...
            </div>
          </div>
          <div class="sc-country" id="country-${i}">Определяем страну...</div>
        </div>

        <div class="sc-block">
          <div class="sc-label">SOCKS5</div>
          <div class="sc-value">${socks5}</div>
        </div>

        <div class="sc-block">
          <div class="sc-label">MTProto</div>
          <div class="sc-value small">${s.mtproto}</div>
        </div>

        <div class="sc-footer">
          <button class="sc-btn-socks" data-copy="${socks5}">${iconCopy} SOCKS5</button>
          <button class="sc-btn-mt" data-link="${s.mtproto}">${iconCopy} MTProto</button>
          <button class="sc-del">${iconDel}</button>
        </div>
      `

      serversList.appendChild(el)

      el.querySelector('.sc-del').onclick = () => confirmDelete(i)

      el.querySelector('.sc-btn-socks').onclick = (e) => {
        const btn = e.currentTarget
        navigator.clipboard.writeText(btn.dataset.copy)
        const orig = btn.innerHTML
        btn.innerHTML = `${iconCopy} Скопировано`
        setTimeout(() => btn.innerHTML = orig, 1500)
      }

      el.querySelector('.sc-btn-mt').onclick = (e) => {
        require('electron').shell.openExternal(e.currentTarget.dataset.link)
      }

      window.api.checkPort(s.ip, 1080).then(online => {
        const badge = document.getElementById(`badge-${i}`)
        if (!badge) return
        badge.className = 'sc-badge ' + (online ? 'online' : 'offline')
        badge.innerHTML = `<span class="sc-dot"></span> ${online ? 'Онлайн' : 'Оффлайн'}`
      })

      getCountry(s.ip).then(name => {
        const el = document.getElementById(`country-${i}`)
        if (el) el.textContent = name
      })
    }
  }

  renderServers()
})()
