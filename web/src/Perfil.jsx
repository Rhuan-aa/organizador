import { useState } from 'react'
import { api } from './api.js'
import { aplicarTema, temaSalvo } from './util.js'
import { Campo, Formulario, useToast } from './ui.jsx'

const TEMAS = [['sistema', 'Sistema'], ['claro', 'Claro'], ['escuro', 'Escuro']]

export default function Perfil({ user, onAtualizar }) {
  const [tema, setTema] = useState(temaSalvo)
  const toast = useToast()
  const salvar = async (d) => {
    onAtualizar(await api('PUT', '/usuarios/eu', { nome: d.nome, antecedencia_dias: Number(d.antecedencia_dias) }))
    toast('Perfil salvo')
  }
  return (
    <>
      <div className="cabecalho"><div><h1>Perfil</h1><p className="sub">{user.email} · {user.perfil}</p></div></div>
      <div className="card estreito">
        <Formulario onSalvar={salvar} semAcoes>
          <Campo rotulo="Nome" obrigatorio><input name="nome" defaultValue={user.nome} required /></Campo>
          <Campo rotulo="Avisar com antecedência (dias)" obrigatorio>
            <input name="antecedencia_dias" type="number" min="0" max="60" defaultValue={user.antecedencia_dias} required />
            <span className="mudo">Você será avisado por e-mail N dias antes de cada prazo; atividades dentro desse prazo ficam em âmbar.</span>
          </Campo>
        </Formulario>
        <div className="campo" style={{ marginTop: 24 }}>
          <span className="rotulo" id="rot-tema">Tema</span>
          <div className="seg" role="group" aria-labelledby="rot-tema">
            {TEMAS.map(([k, r]) => (
              <button key={k} aria-pressed={tema === k} onClick={() => { setTema(k); aplicarTema(k) }}>{r}</button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
