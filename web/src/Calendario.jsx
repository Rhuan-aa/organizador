import { useEffect, useState } from 'react'
import { api } from './api.js'
import { fmtData, hojeStr, rotuloPrazo, diasAte } from './util.js'
import { Icone, Painel, useMobile } from './ui.jsx'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const TIPO = { aula: 'Aula', atividade: 'Atividade', prova: 'Prova' }
const PAGINA = { atividade: 'atividades', prova: 'provas', aula: 'aulas' }

function Evento({ e }) {
  return (
    <li className="item">
      <span className={`tipo t-${e.tipo}`}><Icone nome={PAGINA[e.tipo]} /></span>
      <div className="corpo-item">
        <strong>{e.titulo}</strong>
        <span className="mudo">{TIPO[e.tipo]}{e.horario && ` · ${e.horario}`}{e.status === 'concluida' && ' · concluída'}</span>
      </div>
      <a className="btn btn-fantasma" href={`#${PAGINA[e.tipo]}`}>Abrir</a>
    </li>
  )
}

export default function Calendario({ ir }) {
  const mobile = useMobile()
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth() + 1) // 1-12
  const [eventos, setEventos] = useState([])
  const [erro, setErro] = useState('')
  const [aulas, setAulas] = useState(!mobile)
  const [dia, setDia] = useState(null)

  useEffect(() => {
    api('GET', `/calendario?ano=${ano}&mes=${mes}`).then((e) => { setErro(''); setEventos(e) }).catch((e) => setErro(e.message))
  }, [ano, mes])
  const mover = (delta) => {
    const d = new Date(ano, mes - 1 + delta, 1)
    setAno(d.getFullYear())
    setMes(d.getMonth() + 1)
  }
  const irHoje = () => { setAno(hoje.getFullYear()); setMes(hoje.getMonth() + 1) }

  const vis = eventos.filter((e) => aulas || e.tipo !== 'aula')
    .sort((a, b) => (a.horario || '99').localeCompare(b.horario || '99'))
  const doDia = (data) => vis.filter((e) => e.data === data)
  const hojeS = hojeStr()
  const iso = (n) => `${ano}-${String(mes).padStart(2, '0')}-${String(n).padStart(2, '0')}`
  const vazios = new Date(ano, mes - 1, 1).getDay()
  const total = new Date(ano, mes, 0).getDate()
  const diasComEvento = Array.from({ length: total }, (_, i) => iso(i + 1)).filter((d) => doDia(d).length)

  return (
    <>
      <div className="cabecalho">
        <h1>Calendário</h1>
        <div className="acoes">
          <button className="btn btn-icone" onClick={() => mover(-1)} aria-label="Mês anterior"><Icone nome="esq" /></button>
          <button className="btn" onClick={irHoje}>Hoje</button>
          <button className="btn btn-icone" onClick={() => mover(1)} aria-label="Próximo mês"><Icone nome="dir" /></button>
        </div>
      </div>
      <div className="barra-cal">
        <h2 className="mes" aria-live="polite">{MESES[mes - 1]} {ano}</h2>
        <div className="legenda">
          <span><i className="ponto aula" />Aula</span><span><i className="ponto atividade" />Atividade</span><span><i className="ponto prova" />Prova</span>
          <label className="troca"><input type="checkbox" checked={aulas} onChange={(e) => setAulas(e.target.checked)} />Mostrar aulas</label>
        </div>
      </div>
      {erro && <p className="erro-msg" role="alert">{erro}</p>}

      {mobile ? (
        <div className="agenda">
          {diasComEvento.length === 0 && <p className="mudo vazio-linha card">Nada neste mês.</p>}
          {diasComEvento.map((d) => (
            <section key={d} className={`card ${d === hojeS ? 'hoje' : ''}`}>
              <h2>{fmtData(d)} {d === hojeS && <span className="etiqueta aula">hoje</span>}</h2>
              <ul className="lista">{doDia(d).map((e) => <Evento key={e.tipo + e.id + e.data} e={e} />)}</ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="grade" role="grid">
          {DIAS.map((d) => <div key={d} className="cab" role="columnheader">{d}</div>)}
          {Array.from({ length: vazios }, (_, i) => <div key={'v' + i} className="vazia" />)}
          {Array.from({ length: total }, (_, i) => {
            const data = iso(i + 1)
            const evs = doDia(data)
            return (
              <button key={data} className={`dia ${data === hojeS ? 'hoje' : ''}`} onClick={() => setDia(data)}
                aria-label={`${i + 1} de ${MESES[mes - 1]}, ${evs.length} eventos`}>
                <b className="num">{i + 1}</b>
                {evs.slice(0, 3).map((e) => (
                  <span key={e.tipo + e.id} className={`ev ${e.tipo}`} title={`${e.horario || ''} ${e.titulo}`}>{e.horario} {e.titulo}</span>
                ))}
                {evs.length > 3 && <span className="mais mudo">+{evs.length - 3} mais</span>}
              </button>
            )
          })}
        </div>
      )}

      {dia && (
        <Painel titulo={`${fmtData(dia)} · ${rotuloPrazo(diasAte(dia))}`} onFechar={() => setDia(null)}>
          {doDia(dia).length ? <ul className="lista">{doDia(dia).map((e) => <Evento key={e.tipo + e.id} e={e} />)}</ul> : <p className="mudo">Nada neste dia.</p>}
          <div className="acoes">
            <button className="btn" onClick={() => ir('atividades/nova')}><Icone nome="mais" />Atividade</button>
            <button className="btn" onClick={() => ir('provas/nova')}><Icone nome="mais" />Prova</button>
          </div>
        </Painel>
      )}
    </>
  )
}
