import { useCallback, useEffect, useState } from 'react'
import { api } from './api.js'
import { diasAte, hojeStr, rotuloPrazo, SEMANA_LONGA } from './util.js'
import { Icone, useToast, Vazio } from './ui.jsx'

function Item({ tipo, titulo, disciplina, quando, detalhe, atrasada, onConcluir }) {
  return (
    <li className="item">
      {onConcluir ? (
        <button className="check" aria-label={`Concluir ${titulo}`} onClick={onConcluir} />
      ) : (
        <span className={`tipo t-${tipo}`}><Icone nome={tipo === 'aula' ? 'aulas' : tipo === 'prova' ? 'provas' : 'atividades'} /></span>
      )}
      <div className="corpo-item">
        <strong>{titulo}</strong>
        <span className="mudo">{[disciplina, detalhe].filter(Boolean).join(' · ')}</span>
      </div>
      {quando && <span className={`etiqueta ${atrasada ? 'atrasada' : tipo === 'prova' ? 'prova' : ''}`}>{quando}</span>}
    </li>
  )
}

export default function Inicio({ user, ir }) {
  const [d, setD] = useState(null)
  const [erro, setErro] = useState('')
  const toast = useToast()
  const carregar = useCallback(() => {
    Promise.all([api('GET', '/atividades'), api('GET', '/provas'), api('GET', '/aulas')])
      .then(([atividades, provas, aulas]) => setD({ atividades, provas, aulas }))
      .catch((e) => setErro(e.message))
  }, [])
  useEffect(carregar, [carregar])

  if (erro) return <p className="erro-msg" role="alert">{erro}</p>
  if (!d) return null

  const hoje = hojeStr()
  const abertas = d.atividades.filter((a) => a.status !== 'concluida')
  const atrasadas = abertas.filter((a) => a.data_entrega < hoje).sort((a, b) => a.data_entrega.localeCompare(b.data_entrega))
  const aulasHoje = d.aulas.filter((a) => a.status === 'ativa' && a.dia_semana === new Date().getDay()).sort((a, b) => a.horario.localeCompare(b.horario))
  const ativHoje = abertas.filter((a) => a.data_entrega === hoje)
  const provasHoje = d.provas.filter((p) => p.data === hoje)
  const proximos = [
    ...abertas.filter((a) => a.data_entrega > hoje && diasAte(a.data_entrega) <= 7).map((a) => ({ ...a, tipo: 'atividade', data: a.data_entrega })),
    ...d.provas.filter((p) => p.data > hoje && diasAte(p.data) <= 7).map((p) => ({ ...p, tipo: 'prova', titulo: 'Prova' })),
  ].sort((a, b) => a.data.localeCompare(b.data))

  const concluir = async (a) => {
    try {
      await api('PUT', `/atividades/${a.id}`, { status: 'concluida' })
      carregar()
      toast('Atividade concluída', { rotulo: 'Desfazer', fn: () => api('PUT', `/atividades/${a.id}`, { status: a.status }).then(carregar) })
    } catch (e) { toast(e.message) }
  }
  const itemAtiv = (a, atrasada) => (
    <Item key={a.id} tipo="atividade" titulo={a.titulo} disciplina={a.nome_disciplina} atrasada={atrasada}
      quando={rotuloPrazo(diasAte(a.data_entrega))} onConcluir={() => concluir(a)} />
  )
  const extenso = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const nada = !aulasHoje.length && !ativHoje.length && !provasHoje.length

  return (
    <>
      <div className="cabecalho">
        <div>
          <h1>Olá, {user.nome.split(' ')[0]}</h1>
          <p className="sub" style={{ textTransform: 'capitalize' }}>{extenso}</p>
        </div>
        <div className="acoes">
          <button className="btn" onClick={() => ir('atividades/nova')}><Icone nome="mais" />Atividade</button>
          <button className="btn" onClick={() => ir('provas/nova')}><Icone nome="mais" />Prova</button>
        </div>
      </div>

      {!d.aulas.length ? (
        <div className="card">
          <Vazio titulo="Comece cadastrando suas aulas" texto="Com as aulas cadastradas você poderá registrar atividades e provas e ver tudo aqui."
            acao="Cadastrar aula" onAcao={() => ir('aulas/nova')} />
        </div>
      ) : (
        <div className="inicio-grade">
          {atrasadas.length > 0 && (
            <section className="card alerta inteiro">
              <h2><span className="num">{atrasadas.length}</span> {atrasadas.length === 1 ? 'atividade atrasada' : 'atividades atrasadas'}</h2>
              <ul className="lista">{atrasadas.map((a) => itemAtiv(a, true))}</ul>
            </section>
          )}
          <section className="card">
            <h2>Hoje</h2>
            {nada ? <p className="mudo vazio-linha">Nada marcado para hoje.</p> : (
              <ul className="lista">
                {aulasHoje.map((a) => (
                  <Item key={'a' + a.id} tipo="aula" titulo={a.nome_disciplina} quando={a.horario}
                    detalhe={[a.sala, a.professor].filter(Boolean).join(' · ')} />
                ))}
                {provasHoje.map((p) => <Item key={'p' + p.id} tipo="prova" titulo="Prova" disciplina={p.nome_disciplina} quando={p.horario} />)}
                {ativHoje.map((a) => itemAtiv(a))}
              </ul>
            )}
          </section>
          <section className="card">
            <h2>Próximos 7 dias</h2>
            {!proximos.length ? <p className="mudo vazio-linha">Sem prazos na próxima semana.</p> : (
              <ul className="lista">
                {proximos.map((x) => x.tipo === 'atividade' ? itemAtiv(x) : (
                  <Item key={'p' + x.id} tipo="prova" titulo="Prova" disciplina={x.nome_disciplina}
                    detalhe={x.conteudo} quando={rotuloPrazo(diasAte(x.data))} />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  )
}
