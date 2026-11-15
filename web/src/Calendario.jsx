import { useEffect, useState } from 'react'
import { api } from './api.js'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function Calendario() {
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth() + 1) // 1-12
  const [eventos, setEventos] = useState([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    api('GET', `/calendario?ano=${ano}&mes=${mes}`).then((e) => { setErro(''); setEventos(e) }).catch((e) => setErro(e.message))
  }, [ano, mes])

  const mover = (delta) => {
    const d = new Date(ano, mes - 1 + delta, 1)
    setAno(d.getFullYear())
    setMes(d.getMonth() + 1)
  }
  const vazios = new Date(ano, mes - 1, 1).getDay()
  const dias = new Date(ano, mes, 0).getDate()

  return (
    <div className="card">
      <h2>
        <button onClick={() => mover(-1)}>&lt;</button> {MESES[mes - 1]} {ano} <button onClick={() => mover(1)}>&gt;</button>
      </h2>
      {erro && <p className="erro" role="alert">{erro}</p>}
      <div className="grade">
        {DIAS.map((d) => <div key={d} className="cab">{d}</div>)}
        {Array.from({ length: vazios }, (_, i) => <div key={'v' + i} />)}
        {Array.from({ length: dias }, (_, i) => {
          const data = `${ano}-${String(mes).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
          return (
            <div key={data}>
              <b>{i + 1}</b>
              {eventos.filter((e) => e.data === data).map((e) => (
                <span key={e.tipo + e.id} className={`ev ${e.tipo}`} title={e.titulo}>
                  {e.horario} {e.titulo}
                </span>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
