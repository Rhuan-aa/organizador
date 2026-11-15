import { useCallback, useEffect, useState } from 'react'
import { api } from './api.js'
import { diasAte, estadoPrazo, fmtData, rotuloPrazo } from './util.js'
import { Campo, Formulario, Icone, Painel, SelectAula, useAulas, useConfirmar, useMobile, useToast, Vazio } from './ui.jsx'

const COLUNAS = [['a_fazer', 'A fazer'], ['em_andamento', 'Em andamento'], ['concluida', 'Concluída']]

function Cartao({ a, antecedencia, onAbrir, onMover }) {
  const estado = estadoPrazo(a, antecedencia)
  return (
    <article className={`cartao ${estado}`} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', String(a.id))}>
      <button className="titulo-cartao" onClick={() => onAbrir(a)}>{a.titulo}</button>
      <span className="mudo">{a.nome_disciplina}</span>
      <div className="rodape-cartao">
        <span className={`etiqueta ${estado}`}>
          <Icone nome="relogio" />
          <span className="num">{fmtData(a.data_entrega)}</span>
          {a.status !== 'concluida' && <> · {rotuloPrazo(diasAte(a.data_entrega))}</>}
        </span>
        <select aria-label={`Mover "${a.titulo}" para`} value={a.status} onChange={(e) => onMover(a, e.target.value)}>
          {COLUNAS.map(([k, r]) => <option key={k} value={k}>{r}</option>)}
        </select>
      </div>
    </article>
  )
}

function FormAtividade({ a, aulas, onSalvar, onExcluir }) {
  return (
    <Formulario onSalvar={onSalvar} extra={a && <button type="button" className="btn btn-perigo esq" onClick={onExcluir}>Excluir</button>}>
      <Campo rotulo="Aula" obrigatorio><SelectAula aulas={aulas} valor={a?.aula_id} /></Campo>
      <Campo rotulo="Título" obrigatorio><input name="titulo" defaultValue={a?.titulo} required maxLength={120} /></Campo>
      <Campo rotulo="Data de entrega" obrigatorio><input name="data_entrega" type="date" defaultValue={a?.data_entrega} required /></Campo>
      <Campo rotulo="Status">
        <select name="status" defaultValue={a?.status || 'a_fazer'}>{COLUNAS.map(([k, r]) => <option key={k} value={k}>{r}</option>)}</select>
      </Campo>
      <Campo rotulo="Descrição"><textarea name="descricao" defaultValue={a?.descricao} /></Campo>
    </Formulario>
  )
}

export default function Atividades({ user, sub, ir }) {
  const [lista, setLista] = useState(null)
  const [erro, setErro] = useState('')
  const [editando, setEditando] = useState(null)
  const [busca, setBusca] = useState('')
  const [disc, setDisc] = useState('')
  const [aba, setAba] = useState('a_fazer')
  const [todas, setTodas] = useState(false)
  const aulas = useAulas()
  const mobile = useMobile()
  const toast = useToast()
  const confirmar = useConfirmar()
  const carregar = useCallback(() => api('GET', '/atividades').then(setLista).catch((e) => setErro(e.message)), [])
  useEffect(() => { carregar() }, [carregar])

  const mover = async (a, status) => {
    if (a.status === status) return
    setLista((l) => l.map((x) => (x.id === a.id ? { ...x, status } : x))) // otimista
    try { await api('PUT', `/atividades/${a.id}`, { status }) } catch (e) { toast(e.message) }
    carregar()
  }
  const salvar = async (dados) => {
    await (editando ? api('PUT', `/atividades/${editando.id}`, dados) : api('POST', '/atividades', dados))
    toast(editando ? 'Atividade salva' : 'Atividade criada')
    fechar()
    carregar()
  }
  const excluir = async () => {
    if (!(await confirmar(`Excluir "${editando.titulo}"?`))) return
    try { await api('DELETE', `/atividades/${editando.id}`); toast('Excluído'); fechar(); carregar() } catch (e) { toast(e.message) }
  }
  const fechar = () => { setEditando(null); if (sub) ir('atividades') }
  const painelAberto = sub === 'nova' || editando

  if (erro) return <p className="erro-msg" role="alert">{erro}</p>
  if (!lista) return null
  const nomes = [...new Map(lista.map((a) => [a.aula_id, a.nome_disciplina]))]
  const filtradas = lista.filter((a) =>
    (!busca || a.titulo.toLowerCase().includes(busca.toLowerCase())) && (!disc || String(a.aula_id) === disc))
  const por = (s) => filtradas.filter((a) => a.status === s).sort((a, b) => a.data_entrega.localeCompare(b.data_entrega))
  const colunas = { a_fazer: por('a_fazer'), em_andamento: por('em_andamento'), concluida: por('concluida').reverse() }
  const concl = todas ? colunas.concluida : colunas.concluida.slice(0, 10)

  return (
    <>
      <div className="cabecalho">
        <h1>Atividades</h1>
        <div className="acoes"><button className="btn btn-primario" onClick={() => ir('atividades/nova')}><Icone nome="mais" />Nova atividade</button></div>
      </div>
      {!lista.length ? (
        <div className="card"><Vazio titulo="Nenhuma atividade ainda" texto="Registre trabalhos e entregas para não perder nenhum prazo." acao="Criar atividade" onAcao={() => ir('atividades/nova')} /></div>
      ) : (
        <>
          <div className="filtros">
            <input type="search" placeholder="Buscar por título" aria-label="Buscar por título" value={busca} onChange={(e) => setBusca(e.target.value)} />
            <select aria-label="Filtrar por disciplina" value={disc} onChange={(e) => setDisc(e.target.value)}>
              <option value="">Todas as disciplinas</option>
              {nomes.map(([id, n]) => <option key={id} value={id}>{n}</option>)}
            </select>
          </div>
          {mobile && (
            <div className="seg" role="tablist" style={{ marginBottom: 16 }}>
              {COLUNAS.map(([k, r]) => (
                <button key={k} role="tab" aria-selected={aba === k} onClick={() => setAba(k)}>{r} <span className="num mudo">&nbsp;{colunas[k].length}</span></button>
              ))}
            </div>
          )}
          <div className="quadro">
            {COLUNAS.filter(([k]) => !mobile || k === aba).map(([k, r]) => (
              <section key={k} className="coluna" aria-label={r}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const a = lista.find((x) => String(x.id) === e.dataTransfer.getData('text/plain')); a && mover(a, k) }}>
                <h2>{r} <span className="num mudo">{colunas[k].length}</span></h2>
                {(k === 'concluida' ? concl : colunas[k]).map((a) => <Cartao key={a.id} a={a} antecedencia={user.antecedencia_dias} onAbrir={setEditando} onMover={mover} />)}
                {!colunas[k].length && <p className="mudo vazio-linha">Nada por aqui.</p>}
                {k === 'concluida' && colunas.concluida.length > 10 && (
                  <button className="btn btn-fantasma" onClick={() => setTodas(!todas)}>{todas ? 'Mostrar menos' : `Ver todas (${colunas.concluida.length})`}</button>
                )}
              </section>
            ))}
          </div>
        </>
      )}
      {painelAberto && (
        <Painel titulo={editando ? 'Editar atividade' : 'Nova atividade'} onFechar={fechar}>
          <FormAtividade a={editando} aulas={aulas} onSalvar={salvar} onExcluir={excluir} />
        </Painel>
      )}
    </>
  )
}
