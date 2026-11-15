import { useCallback, useEffect, useState } from 'react'
import { api } from './api.js'
import { SEMANA, SEMANA_LONGA } from './util.js'
import { Campo, Formulario, Icone, Painel, useConfirmar, useToast, Vazio } from './ui.jsx'

const ORDEM = [1, 2, 3, 4, 5, 6, 0]

export default function Aulas({ sub, ir }) {
  const [lista, setLista] = useState(null)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [editando, setEditando] = useState(null)
  const toast = useToast()
  const confirmar = useConfirmar()
  const carregar = useCallback(() => api('GET', '/aulas').then(setLista).catch((e) => setErro(e.message)), [])
  useEffect(() => { carregar() }, [carregar])

  const fechar = () => { setEditando(null); if (sub) ir('aulas') }
  const salvar = async (dados) => {
    await (editando ? api('PUT', `/aulas/${editando.id}`, dados) : api('POST', '/aulas', dados))
    toast(editando ? 'Aula salva' : 'Aula criada')
    fechar()
    carregar()
  }
  const excluir = async () => {
    if (!(await confirmar(`Excluir "${editando.nome_disciplina}"? Atividades e provas dela também serão removidas.`))) return
    try { await api('DELETE', `/aulas/${editando.id}`); toast('Excluído'); fechar(); carregar() } catch (e) { toast(e.message) }
  }
  if (erro) return <p className="erro-msg" role="alert">{erro}</p>
  if (!lista) return null
  const q = busca.toLowerCase()
  const visiveis = lista.filter((a) => !q || [a.cod_disciplina, a.nome_disciplina, a.professor].some((c) => c?.toLowerCase().includes(q)))
  const a = editando

  return (
    <>
      <div className="cabecalho">
        <h1>Aulas</h1>
        <div className="acoes"><button className="btn btn-primario" onClick={() => ir('aulas/nova')}><Icone nome="mais" />Nova aula</button></div>
      </div>
      {!lista.length ? (
        <div className="card"><Vazio titulo="Nenhuma aula cadastrada" texto="Cadastre sua grade semanal para organizar atividades e provas por disciplina." acao="Cadastrar aula" onAcao={() => ir('aulas/nova')} /></div>
      ) : (
        <>
          <div className="filtros"><input type="search" placeholder="Buscar por código, disciplina ou professor" aria-label="Buscar aulas" value={busca} onChange={(e) => setBusca(e.target.value)} /></div>
          {ORDEM.map((dia) => {
            const doDia = visiveis.filter((x) => x.dia_semana === dia).sort((x, y) => x.horario.localeCompare(y.horario))
            return doDia.length > 0 && (
              <section key={dia}>
                <h2 className="secao">{SEMANA_LONGA[dia]}</h2>
                <ul className="lista-cartoes">
                  {doDia.map((x) => (
                    <li key={x.id}>
                      <button className={`linha-botao aula-linha ${x.status === 'inativa' ? 'passada' : ''}`} onClick={() => setEditando(x)}>
                        <span className="hora num">{x.horario}</span>
                        <span className="corpo-item">
                          <strong>{x.nome_disciplina} <span className="mudo">{x.cod_disciplina}</span></strong>
                          <span className="mudo">{[x.professor, x.sala && `Sala ${x.sala}`].filter(Boolean).join(' · ')}</span>
                        </span>
                        {x.status === 'inativa' && <span className="etiqueta">inativa</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
          {!visiveis.length && <p className="mudo vazio-linha">Nenhuma aula encontrada.</p>}
        </>
      )}
      {(sub === 'nova' || a) && (
        <Painel titulo={a ? 'Editar aula' : 'Nova aula'} onFechar={fechar}>
          <Formulario dois onSalvar={salvar} extra={a && <button type="button" className="btn btn-perigo esq" onClick={excluir}>Excluir</button>}>
            <Campo className="inteiro" rotulo="Disciplina" obrigatorio><input name="nome_disciplina" defaultValue={a?.nome_disciplina} required /></Campo>
            <Campo rotulo="Código" obrigatorio><input name="cod_disciplina" defaultValue={a?.cod_disciplina} required /></Campo>
            <Campo rotulo="Semestre" obrigatorio><input name="semestre" defaultValue={a?.semestre} placeholder="2026.2" required /></Campo>
            <div className="campo inteiro">
              <span className="rotulo" id="rot-dia">Dia da semana<span className="obrig"> *</span></span>
              <div className="seg" role="radiogroup" aria-labelledby="rot-dia">
                {ORDEM.map((d) => (
                  <label key={d}><input type="radio" name="dia_semana" value={d} defaultChecked={a?.dia_semana === d} required />{SEMANA[d][0].toUpperCase() + SEMANA[d].slice(1)}</label>
                ))}
              </div>
            </div>
            <Campo rotulo="Horário" obrigatorio><input name="horario" type="time" defaultValue={a?.horario} required /></Campo>
            <Campo rotulo="Sala"><input name="sala" defaultValue={a?.sala} /></Campo>
            <Campo className="inteiro" rotulo="Professor"><input name="professor" defaultValue={a?.professor} /></Campo>
            <Campo rotulo="Período"><input name="periodo" defaultValue={a?.periodo} /></Campo>
            <Campo rotulo="Status">
              <select name="status" defaultValue={a?.status || 'ativa'}><option value="ativa">Ativa</option><option value="inativa">Inativa</option></select>
            </Campo>
          </Formulario>
        </Painel>
      )}
    </>
  )
}
