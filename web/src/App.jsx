import { useEffect, useState } from 'react'
import { api } from './api.js'

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

export default function App() {
  const [user, setUser] = useState(null)
  const [pronto, setPronto] = useState(false)
  const [pagina, setPagina] = useState('perfil')
  useEffect(() => {
    api('GET', '/auth/eu').then(setUser).catch(() => {}).finally(() => setPronto(true))
  }, [])
  if (!pronto) return null
  if (!user) return <Login onEntrar={setUser} />

  // [chave, rótulo, só admin?, conteúdo]
  const paginas = [
    ['perfil', 'Perfil', false, <Perfil user={user} onAtualizar={setUser} />],
    ['usuarios', 'Usuários', true, <Usuarios />],
  ].filter((p) => !p[2] || user.perfil === 'admin')
  const atual = paginas.find((p) => p[0] === pagina) || paginas[0]

  return (
    <>
      <nav>
        {paginas.map(([k, rotulo]) => (
          <button key={k} className={k === atual[0] ? 'ativo' : ''} onClick={() => setPagina(k)}>{rotulo}</button>
        ))}
        <span className="espaco" />
        <span>{user.nome}</span>
        <button onClick={() => api('POST', '/auth/logout').then(() => setUser(null))}>Sair</button>
      </nav>
      <main key={atual[0]}>{atual[3]}</main>
    </>
  )
}
