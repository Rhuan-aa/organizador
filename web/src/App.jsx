import { useEffect, useState } from 'react'
import { api } from './api.js'
import Aulas from './Aulas.jsx'
import Provas from './Provas.jsx'
import Calendario from './Calendario.jsx'
import Atividades from './Atividades.jsx'
import Inicio from './Inicio.jsx'
import { Icone, UIProvider } from './ui.jsx'

const formDados = (e) => Object.fromEntries(new FormData(e.target))

function Erro({ msg }) {
  return msg ? <p className="erro" role="alert">{msg}</p> : null
}

function Login({ onEntrar }) {
  const [registro, setRegistro] = useState(false)
  const [erro, setErro] = useState('')
  const enviar = async (e) => {
    e.preventDefault()
    try {
      onEntrar(await api('POST', registro ? '/auth/registrar' : '/auth/login', formDados(e)))
    } catch (err) {
      setErro(err.message)
    }
  }
  return (
    <form className="card login" onSubmit={enviar}>
      <h1>Organizador Acadêmico</h1>
      {registro && <label>Nome<input name="nome" required /></label>}
      <label>E-mail<input name="email" type="email" required /></label>
      <label>Senha<input name="senha" type="password" required /></label>
      <Erro msg={erro} />
      <button>{registro ? 'Criar conta' : 'Entrar'}</button>
      <button type="button" className="link" onClick={() => setRegistro(!registro)}>
        {registro ? 'Já tenho conta' : 'Criar uma conta'}
      </button>
    </form>
  )
}

function Perfil({ user, onAtualizar }) {
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')
  const salvar = async (e) => {
    e.preventDefault()
    const d = formDados(e)
    try {
      onAtualizar(await api('PUT', '/usuarios/eu', { nome: d.nome, antecedencia_dias: Number(d.antecedencia_dias) }))
      setErro('')
      setMsg('Salvo!')
    } catch (err) {
      setMsg('')
      setErro(err.message)
    }
  }
  return (
    <form className="card" onSubmit={salvar}>
      <h2>Perfil</h2>
      <p>{user.email} ({user.perfil})</p>
      <label>Nome<input name="nome" defaultValue={user.nome} required /></label>
      <label>Avisar com antecedência de (dias)
        <input name="antecedencia_dias" type="number" min="0" defaultValue={user.antecedencia_dias} required />
      </label>
      <Erro msg={erro} />
      {msg && <p>{msg}</p>}
      <button>Salvar</button>
    </form>
  )
}

function Usuarios() {
  const [lista, setLista] = useState([])
  const [erro, setErro] = useState('')
  const carregar = () => api('GET', '/usuarios').then(setLista).catch((e) => setErro(e.message))
  useEffect(() => { carregar() }, [])
  const agir = (fn) => fn().then(carregar).catch((e) => setErro(e.message))
  return (
    <div className="card">
      <h2>Usuários</h2>
      <Erro msg={erro} />
      <table>
        <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th></th></tr></thead>
        <tbody>
          {lista.map((u) => (
            <tr key={u.id}>
              <td><input defaultValue={u.nome} onBlur={(e) => e.target.value !== u.nome && agir(() => api('PUT', `/usuarios/${u.id}`, { nome: e.target.value }))} /></td>
              <td>{u.email}</td>
              <td>
                <select value={u.perfil} onChange={(e) => agir(() => api('PUT', `/usuarios/${u.id}`, { perfil: e.target.value }))}>
                  <option value="aluno">aluno</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td><button onClick={() => confirm(`Excluir ${u.nome}?`) && agir(() => api('DELETE', `/usuarios/${u.id}`))}>Excluir</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

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
    calendario: <Calendario />,
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
