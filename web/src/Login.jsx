import { useState } from 'react'
import { api } from './api.js'
import { Campo } from './ui.jsx'

export default function Login({ onEntrar }) {
  const [registro, setRegistro] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const trocar = (r) => { setRegistro(r); setErro('') }
  const enviar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    try {
      onEntrar(await api('POST', registro ? '/auth/registrar' : '/auth/login', Object.fromEntries(new FormData(e.target))))
    } catch (err) {
      setErro(err.message)
      setEnviando(false)
    }
  }
  return (
    <div className="login-pagina">
      <form className="card login" onSubmit={enviar}>
        <div>
          <h1>Organizador Acadêmico</h1>
          <p className="sub">Seus prazos, aulas e provas em um só lugar.</p>
        </div>
        <div className="seg" role="tablist">
          <button type="button" role="tab" aria-selected={!registro} onClick={() => trocar(false)}>Entrar</button>
          <button type="button" role="tab" aria-selected={registro} onClick={() => trocar(true)}>Criar conta</button>
        </div>
        {erro && <p className="erro-msg" role="alert">{erro}</p>}
        {registro && <Campo rotulo="Nome"><input name="nome" autoComplete="name" required /></Campo>}
        <Campo rotulo="E-mail"><input name="email" type="email" autoComplete="email" required /></Campo>
        <Campo rotulo="Senha"><input name="senha" type="password" autoComplete={registro ? 'new-password' : 'current-password'} required /></Campo>
        <button className={`btn btn-primario ${enviando ? 'carregando' : ''}`} disabled={enviando}>{registro ? 'Criar conta' : 'Entrar'}</button>
      </form>
    </div>
  )
}
