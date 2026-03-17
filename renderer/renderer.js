document.addEventListener('DOMContentLoaded', () => {
  const content = document.getElementById('content')

  function loadPage(page) {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', `./pages/${page}/${page}.html`, false)
    xhr.send()
    content.innerHTML = xhr.responseText

    const pageEl = content.querySelector('.page')
    if (pageEl) pageEl.classList.add('active')

    const oldScript = document.getElementById('page-script')
    if (oldScript) oldScript.remove()

    const script = document.createElement('script')
    script.src = `./pages/${page}/${page}.js`
    script.id = 'page-script'
    script.onload = () => console.log(`[router] ${page}.js загружен`)
    script.onerror = (e) => console.error(`[router] ошибка загрузки ${page}.js`, e)
    document.body.appendChild(script)
  }

  document.querySelectorAll('.nav').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.nav').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      loadPage(btn.dataset.page)
    }
  })

  loadPage('setup')
})
