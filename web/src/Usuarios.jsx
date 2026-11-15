import { useCallback, useEffect, useState } from 'react'
import { api } from './api.js'
import { useConfirmar, useToast } from './ui.jsx'

export default function Usuarios() {
  const [lista, setLista] = useState([])
  const [erro, setErro] = useState('')
  const toast = useToast()
  const confirmar = useConfirmar()
  const carregar = useCallback(() => api('GET', '/usuarios').then(setLista).catch((e) => setErro(e.message)), [])
  useEffect(() => { carregar() }, [carregar])
  const agir = (fn, msg) => fn().then(() => { toast(msg); carregar() }).catch((e) => toast(e.message))
  return (
    <>
      <div className="cabecalho"><h1>Usuários</h1></div>
      {erro && <p className="erro-msg" role="alert">{erro}</p>}
      <div className="card tabela">
        <table>
          <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th><span className="so-leitor">Ações</span></th></tr></thead>
          <tbody>
            {lista.map((u) => (
              <tr key={u.id}>
                <td><input aria-label={`Nome de ${u.email}`} defaultValue={u.nome} onBlur={(e) => e.target.value !== u.nome && agir(() => api('PUT', `/usuarios/${u.id}`, { nome: e.target.value }), 'Nome salvo')} /></td>
                <td className="mudo">{u.email}</td>
                <td>
                  <select aria-label={`Perfil de ${u.nome}`} value={u.perfil} onChange={(e) => agir(() => api('PUT', `/usuarios/${u.id}`, { perfil: e.target.value }), 'Perfil alterado')}>
                    <option value="aluno">aluno</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td><button className="btn btn-perigo" onClick={async () => (await confirmar(`Excluir ${u.nome}?`)) && agir(() => api('DELETE', `/usuarios/${u.id}`), 'Excluído')}>Excluir</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
