export const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
export const SEMANA_LONGA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const utc = (s) => {
  const [a, m, d] = s.slice(0, 10).split('-').map(Number)
  return Date.UTC(a, m - 1, d)
}
// data local de hoje como 'YYYY-MM-DD' (sem armadilha de UTC)
export const hojeStr = () => new Date().toLocaleDateString('sv')

export const diasAte = (data) => Math.round((utc(data) - utc(hojeStr())) / 864e5)

export const fmtData = (data) => {
  const d = new Date(utc(data))
  return `${SEMANA[d.getUTCDay()]}, ${data.slice(8, 10)}/${data.slice(5, 7)}`
}

export const rotuloPrazo = (d) =>
  d === 0 ? 'hoje' : d === 1 ? 'amanhã' : d === -1 ? 'ontem' : d > 0 ? `em ${d} dias` : `há ${-d} dias`

// 'concluida' | 'atrasada' | 'logo' | '' conforme a antecedência do usuário (RF04)
export const estadoPrazo = (a, antecedencia) => {
  if (a.status === 'concluida') return 'concluida'
  const d = diasAte(a.data_entrega)
  return d < 0 ? 'atrasada' : d <= antecedencia ? 'logo' : ''
}

export const rotuloAula = (a) => `${a.cod_disciplina} — ${a.nome_disciplina}`

// tema: 'sistema' | 'claro' | 'escuro' (guardado em localStorage)
export const temaSalvo = () => {
  try { return localStorage.getItem('tema') || 'sistema' } catch { return 'sistema' }
}
export const aplicarTema = (t) => {
  const el = document.documentElement
  if (t === 'claro') el.dataset.theme = 'light'
  else if (t === 'escuro') el.dataset.theme = 'dark'
  else delete el.dataset.theme
  try { localStorage.setItem('tema', t) } catch { /* sem armazenamento */ }
}
