import { useEffect, useState } from 'react'
import { api } from './api.js'
import Atividades from './Atividades.jsx'
import Aulas from './Aulas.jsx'
import Calendario from './Calendario.jsx'
import Inicio from './Inicio.jsx'
import Login from './Login.jsx'
import Perfil from './Perfil.jsx'
import Provas from './Provas.jsx'
import Usuarios from './Usuarios.jsx'
import { Icone, UIProvider } from './ui.jsx'

const PAGINAS = [
  ['inicio', 'Início'],
  ['aulas', 'Aulas'],
  ['atividades', 'Atividades'],
  ['provas', 'Provas'],
  ['calendario', 'Calendário'],
]
const rotaAtual = () => {
  const [pagina, sub] = location.hash.slice(1).split('/')
  return { pagina, sub }
}

export default function App() {
  const [user, setUser] = useState(null)
  const [pronto, setPronto] = useState(false)
  const [rota, setRota] = useState(rotaAtual)
  const [menu, setMenu] = useState(false)
  useEffect(() => {
    api('GET', '/auth/eu').then(setUser).catch(() => {}).finally(() => setPronto(true))
    const f = () => { setRota(rotaAtual()); setMenu(false) }
    addEventListener('hashchange', f)
    return () => removeEventListener('hashchange', f)
  }, [])
  const ir = (h) => { location.hash = h }
  if (!pronto) return null
  if (!user) return <Login onEntrar={(u) => { setUser(u); ir('inicio') }} />

  const admin = user.perfil === 'admin'
  const conteudo = {
    inicio: <Inicio user={user} ir={ir} />,
    aulas: <Aulas sub={rota.sub} ir={ir} />,
    atividades: <Atividades user={user} sub={rota.sub} ir={ir} />,
    provas: <Provas sub={rota.sub} ir={ir} />,
    calendario: <Calendario ir={ir} />,
    perfil: <Perfil user={user} onAtualizar={setUser} />,
    ...(admin && { usuarios: <Usuarios /> }),
  }
  const pagina = conteudo[rota.pagina] ? rota.pagina : 'inicio'
  const sair = () => api('POST', '/auth/logout').then(() => { setUser(null); ir('') })
  const link = (k, rotulo) => (
    <a key={k} href={`#${k}`} className={k === pagina ? 'ativo' : ''} aria-current={k === pagina ? 'page' : undefined}>
      <Icone nome={k} /><span>{rotulo}</span>
    </a>
  )
  const rodape = [['perfil', 'Perfil'], ...(admin ? [['usuarios', 'Usuários']] : [])]

  return (
    <UIProvider>
      <div className="app">
        <aside className="lateral">
          <div className="marca">Organizador<small>{user.nome}</small></div>
          <nav aria-label="Principal">{PAGINAS.map(([k, r]) => link(k, r))}</nav>
          <nav className="rodape" aria-label="Conta">
            {rodape.map(([k, r]) => link(k, r))}
            <button onClick={sair}><Icone nome="sair" /><span>Sair</span></button>
          </nav>
        </aside>
        <header className="topo">
          <strong>Organizador</strong>
          <button className="avatar" aria-label="Conta" aria-expanded={menu} onClick={() => setMenu(!menu)}>
            {user.nome.trim()[0]?.toUpperCase()}
          </button>
          {menu && (
            <div className="menu-conta">
              <p className="mudo">{user.nome}</p>
              {rodape.map(([k, r]) => <a key={k} href={`#${k}`}><Icone nome={k} />{r}</a>)}
              <button onClick={sair}><Icone nome="sair" />Sair</button>
            </div>
          )}
        </header>
        <main key={pagina}>{conteudo[pagina]}</main>
        <nav className="abas" aria-label="Principal">{PAGINAS.map(([k, r]) => link(k, r))}</nav>
      </div>
    </UIProvider>
  )
}
