const LANGS = ['en', 'es']

function detectInitialLang() {
  if (typeof window === 'undefined') return 'en'
  const params = new URLSearchParams(window.location.search)
  const qlang = params.get('l')
  if (qlang && LANGS.includes(qlang)) return qlang

  return navigator.language.startsWith('es') ? 'es' : 'en'
}

let lang = $state(detectInitialLang())

function setUrl(ln: string) {
  const url = new URL(window.location.href)
  url.searchParams.set('l', ln)
  window.history.replaceState({}, '', url)
}

export function enes(en: string, es: string) {
  return lang === 'es' ? es : en
}

export function setLang(newlang: string) {
  lang = newlang

  setUrl(newlang)
}

export function toggleLang() {
  console.log('Language toggled')
  setLang(lang === 'es' ? 'en' : 'es')
}

export function getLang() {
  return lang
}
