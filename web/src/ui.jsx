import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { api } from './api.js'

const ICONES = {
  inicio: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  atividades: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9',
  provas: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6',
  aulas: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M9 7h6',
  calendario: 'M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM4 10h16M8 3v4M16 3v4',
  perfil: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  usuarios: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a7 7 0 0 1 4 6',
  sair: 'M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9',
  mais: 'M12 5v14M5 12h14',
  fechar: 'M6 6l12 12M18 6L6 18',
  relogio: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  local: 'M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  esq: 'M15 5l-7 7 7 7',
  dir: 'M9 5l7 7-7 7',
}
export const Icone = ({ nome }) => (
  <svg className="icone" viewBox="0 0 24 24" aria-hidden="true"><path d={ICONES[nome]} /></svg>
)

const Ctx = createContext(null)
export const useToast = () => useContext(Ctx).toast
export const useConfirmar = () => useContext(Ctx).confirmar

// Toasts (aria-live) + diálogo de confirmação promissificado: `if (await confirmar('...')) ...`
export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [conf, setConf] = useState(null)
  const id = useRef(0)
  const toast = useCallback((msg, acao) => {
    const k = ++id.current
    setToasts((t) => [...t, { k, msg, acao }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.k !== k)), acao ? 6000 : 3000)
  }, [])
  const confirmar = useCallback((texto, rotulo = 'Excluir') => new Promise((resolve) => setConf({ texto, rotulo, resolve })), [])
  const fechar = (v) => { conf.resolve(v); setConf(null) }
  return (
    <Ctx.Provider value={{ toast, confirmar }}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.k} className="toast">
            <span>{t.msg}</span>
            {t.acao && (
              <button onClick={() => { t.acao.fn(); setToasts((x) => x.filter((y) => y.k !== t.k)) }}>{t.acao.rotulo}</button>
            )}
          </div>
        ))}
      </div>
      {conf && (
        <Dialogo className="confirmar" onFechar={() => fechar(false)} rotulo="Confirmar">
          <h2>{conf.texto}</h2>
          <p className="sub">Essa ação não pode ser desfeita.</p>
          <div className="acoes">
            <button className="btn" onClick={() => fechar(false)}>Cancelar</button>
            <button className="btn btn-perigo-cheio" onClick={() => fechar(true)}>{conf.rotulo}</button>
          </div>
        </Dialogo>
      )}
    </Ctx.Provider>
  )
}

// <dialog> nativo: Esc fecha, clique no fundo fecha, foco no primeiro campo
function Dialogo({ className, onFechar, rotulo, children }) {
  const ref = useRef()
  useEffect(() => {
    const d = ref.current
    d.showModal()
    ;(d.querySelector('input:not([type=hidden]), select, textarea') || d.querySelector('.btn:not(.btn-icone)'))?.focus()
    return () => d.close()
  }, [])
  return (
    <dialog
      ref={ref}
      className={className}
      aria-label={rotulo}
      onCancel={(e) => { e.preventDefault(); onFechar() }}
      onMouseDown={(e) => e.target === ref.current && onFechar()}
    >
      {children}
    </dialog>
  )
}

// Drawer lateral (desktop) / bottom sheet (celular)
export function Painel({ titulo, onFechar, children }) {
  return (
    <Dialogo className="painel" onFechar={onFechar} rotulo={titulo}>
      <header>
        <h2>{titulo}</h2>
        <button className="btn btn-fantasma btn-icone" onClick={onFechar} aria-label="Fechar"><Icone nome="fechar" /></button>
      </header>
      <div className="corpo">{children}</div>
    </Dialogo>
  )
}

export function Vazio({ titulo, texto, acao, onAcao }) {
  return (
    <div className="vazio">
      <h3>{titulo}</h3>
      {texto && <p className="sub">{texto}</p>}
      {acao && <button className="btn btn-primario" onClick={onAcao}>{acao}</button>}
    </div>
  )
}

export const Campo = ({ rotulo, obrigatorio, className = '', children }) => (
  <label className={`campo ${className}`}>
    <span className="rotulo">{rotulo}{obrigatorio && <span className="obrig" aria-hidden="true"> *</span>}</span>
    {children}
  </label>
)

// Formulário de painel: erro do servidor no topo, Salvar com estado de carregamento
export function Formulario({ onSalvar, children, extra, dois, semAcoes }) {
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const enviar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    try { await onSalvar(Object.fromEntries(new FormData(e.target))) } catch (err) { setErro(err.message); setEnviando(false) }
  }
  return (
    <form onSubmit={enviar}>
      {erro && <p className="erro-msg" role="alert">{erro}</p>}
      <div className={`grade-form ${dois ? 'dois' : ''}`}>{children}</div>
      {!semAcoes && <p className="mudo" style={{ marginTop: 16 }}>* obrigatório</p>}
      <div className="acoes">
        {extra}
        <button className={`btn btn-primario ${enviando ? 'carregando' : ''}`} disabled={enviando}>Salvar</button>
      </div>
    </form>
  )
}

export function useAulas() {
  const [aulas, setAulas] = useState(null)
  useEffect(() => { api('GET', '/aulas').then(setAulas).catch(() => setAulas([])) }, [])
  return aulas
}

// <select> de aula; sem aulas, avisa e leva ao cadastro
export function SelectAula({ aulas, valor, ...p }) {
  if (aulas && !aulas.length)
    return <p className="aviso">Você ainda não tem aulas. <a href="#aulas/nova">Cadastre uma aula</a> primeiro.</p>
  return (
    <select name="aula_id" defaultValue={valor ?? ''} required {...p}>
      <option value="">Selecione a aula</option>
      {aulas?.map((a) => <option key={a.id} value={a.id}>{`${a.cod_disciplina} — ${a.nome_disciplina}`}</option>)}
    </select>
  )
}

export function useMobile() {
  const q = '(max-width: 767px)'
  const [m, setM] = useState(() => matchMedia(q).matches)
  useEffect(() => {
    const mq = matchMedia(q)
    const f = () => setM(mq.matches)
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [])
  return m
}
