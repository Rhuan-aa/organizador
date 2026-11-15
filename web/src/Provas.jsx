import { useCallback, useEffect, useState } from 'react'
import { api } from './api.js'
import { diasAte, hojeStr, rotuloPrazo } from './util.js'
import { Campo, Formulario, Icone, Painel, SelectAula, useAulas, useConfirmar, useToast, Vazio } from './ui.jsx'

const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function Linha({ p, passada, onAbrir }) {
  return (
    <li>
      <button className={`prova ${passada ? 'passada' : ''}`} onClick={() => onAbrir(p)}>
        <span className="data-bloco"><b className="num">{p.data.slice(8, 10)}</b>{MES[+p.data.slice(5, 7) - 1]}</span>
        <span className="corpo-item">
          <strong>{p.nome_disciplina}</strong>
          <span className="mudo num">{p.horario}{p.conteudo && ` · ${p.conteudo}`}</span>
        </span>
        <span className={`etiqueta ${passada ? '' : 'prova'}`}>{rotuloPrazo(diasAte(p.data))}</span>
      </button>
    </li>
  )
}

export default function Provas({ sub, ir }) {
  const [lista, setLista] = useState(null)
  const [erro, setErro] = useState('')
  const [editando, setEditando] = useState(null)
  const aulas = useAulas()
  const toast = useToast()
  const confirmar = useConfirmar()
  const carregar = useCallback(() => api('GET', '/provas').then(setLista).catch((e) => setErro(e.message)), [])
  useEffect(() => { carregar() }, [carregar])

  const fechar = () => { setEditando(null); if (sub) ir('provas') }
  const salvar = async (dados) => {
    await (editando ? api('PUT', `/provas/${editando.id}`, dados) : api('POST', '/provas', dados))
    toast(editando ? 'Prova salva' : 'Prova criada')
    fechar()
    carregar()
  }
  const excluir = async () => {
    if (!(await confirmar('Excluir esta prova?'))) return
    try { await api('DELETE', `/provas/${editando.id}`); toast('Excluído'); fechar(); carregar() } catch (e) { toast(e.message) }
  }
  if (erro) return <p className="erro-msg" role="alert">{erro}</p>
  if (!lista) return null
  const hoje = hojeStr()
  const proximas = lista.filter((p) => p.data >= hoje).sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario))
  const realizadas = lista.filter((p) => p.data < hoje).sort((a, b) => b.data.localeCompare(a.data))
  const p = editando

  return (
    <>
      <div className="cabecalho">
        <h1>Provas</h1>
        <div className="acoes"><button className="btn btn-primario" onClick={() => ir('provas/nova')}><Icone nome="mais" />Nova prova</button></div>
      </div>
      {!lista.length ? (
        <div className="card"><Vazio titulo="Nenhuma prova cadastrada" texto="Cadastre as datas das provas para ser avisado a tempo." acao="Cadastrar prova" onAcao={() => ir('provas/nova')} /></div>
      ) : (
        <>
          <h2 className="secao">Próximas <span className="num mudo">{proximas.length}</span></h2>
          {proximas.length ? <ul className="lista-cartoes">{proximas.map((x) => <Linha key={x.id} p={x} onAbrir={setEditando} />)}</ul> : <p className="mudo vazio-linha">Nenhuma prova futura.</p>}
          {realizadas.length > 0 && (
            <>
              <h2 className="secao">Realizadas <span className="num mudo">{realizadas.length}</span></h2>
              <ul className="lista-cartoes">{realizadas.map((x) => <Linha key={x.id} p={x} passada onAbrir={setEditando} />)}</ul>
            </>
          )}
        </>
      )}
      {(sub === 'nova' || p) && (
        <Painel titulo={p ? 'Editar prova' : 'Nova prova'} onFechar={fechar}>
          <Formulario onSalvar={salvar} extra={p && <button type="button" className="btn btn-perigo esq" onClick={excluir}>Excluir</button>}>
            <Campo rotulo="Aula" obrigatorio><SelectAula aulas={aulas} valor={p?.aula_id} /></Campo>
            <Campo rotulo="Data" obrigatorio><input name="data" type="date" defaultValue={p?.data} required /></Campo>
            <Campo rotulo="Horário" obrigatorio><input name="horario" type="time" defaultValue={p?.horario} required /></Campo>
            <Campo rotulo="Conteúdo"><textarea name="conteudo" defaultValue={p?.conteudo} placeholder="O que vai cair na prova" /></Campo>
          </Formulario>
        </Painel>
      )}
    </>
  )
}
