import { useEffect, useState } from 'react'
import { api } from './api.js'

// campos: [{ nome, rotulo, tipo: text|date|time|textarea|select|aula, opcoes: [[valor, rotulo]], obrigatorio, filtro, inline, coluna }]
// tipo 'aula' = select carregado de /api/aulas; a tabela mostra nome_disciplina.
export default function CrudPage({ titulo, rota, campos, classeLinha }) {
  const [linhas, setLinhas] = useState([])
  const [aulas, setAulas] = useState([])
  const [filtros, setFiltros] = useState({})
  const [editando, setEditando] = useState(null)
  const [versao, setVersao] = useState(0)
  const [erro, setErro] = useState('')

  const consulta = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v)).toString()
  const carregar = () => api('GET', `/${rota}?${consulta}`).then(setLinhas).catch((e) => setErro(e.message))
  useEffect(() => { carregar() }, [consulta])
  useEffect(() => {
    if (campos.some((c) => c.tipo === 'aula')) api('GET', '/aulas').then(setAulas).catch(() => {})
  }, [])

  const opcoes = (c) => (c.tipo === 'aula' ? aulas.map((a) => [a.id, `${a.cod_disciplina} - ${a.nome_disciplina}`]) : c.opcoes)
  const rotuloOpcao = (c, v) => opcoes(c)?.find(([k]) => String(k) === String(v))?.[1] ?? v

  const entrada = (c, valor, props = {}) =>
    opcoes(c) ? (
      <select name={c.nome} defaultValue={valor ?? ''} {...props}>
        <option value="">{props.required ? 'Selecione' : 'Todos'}</option>
        {opcoes(c).map(([k, r]) => <option key={k} value={k}>{r}</option>)}
      </select>
    ) : c.tipo === 'textarea' ? (
      <textarea name={c.nome} defaultValue={valor ?? ''} {...props} />
    ) : (
      <input name={c.nome} type={c.tipo || 'text'} defaultValue={valor ?? ''} {...props} />
    )

  const salvar = async (e) => {
    e.preventDefault()
    const dados = Object.fromEntries(new FormData(e.target))
    try {
      await (editando ? api('PUT', `/${rota}/${editando.id}`, dados) : api('POST', `/${rota}`, dados))
      setErro('')
      setEditando(null)
      setVersao(versao + 1) // recria o formulário vazio
      carregar()
    } catch (err) {
      setErro(err.message)
    }
  }
  const agir = (p) => p.then(() => { setErro(''); carregar() }).catch((e) => setErro(e.message))

  return (
    <>
      <form key={`${versao}-${editando?.id}`} className="card" onSubmit={salvar}>
        <h2>{titulo}: {editando ? 'editar' : 'novo'}</h2>
        <div className="form">
          {campos.map((c) => (
            <label key={c.nome}>{c.rotulo}{c.obrigatorio && ' *'}
              {entrada(c, editando?.[c.nome] ?? (c.opcoes && !editando ? c.opcoes[0][0] : ''), { required: c.obrigatorio })}
            </label>
          ))}
        </div>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <button>{editando ? 'Salvar' : 'Adicionar'}</button>
        {editando && <button type="button" className="link" onClick={() => setEditando(null)}>Cancelar</button>}
      </form>

      <div className="card">
        <div className="form">
          {campos.filter((c) => c.filtro).map((c) => (
            <label key={c.nome}>Filtrar: {c.rotulo}
              {entrada(c, filtros[c.nome], { onChange: (e) => setFiltros({ ...filtros, [c.nome]: e.target.value }) })}
            </label>
          ))}
        </div>
        <div className="tabela">
          <table>
            <thead><tr>{campos.filter((c) => c.coluna).map((c) => <th key={c.nome}>{c.rotulo}</th>)}<th></th></tr></thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.id} className={classeLinha?.(l)}>
                  {campos.filter((c) => c.coluna).map((c) => (
                    <td key={c.nome}>
                      {c.inline ? (
                        <select value={l[c.nome]} onChange={(e) => agir(api('PUT', `/${rota}/${l.id}`, { [c.nome]: e.target.value }))}>
                          {c.opcoes.map(([k, r]) => <option key={k} value={k}>{r}</option>)}
                        </select>
                      ) : c.tipo === 'aula' ? l.nome_disciplina : rotuloOpcao(c, l[c.nome])}
                    </td>
                  ))}
                  <td>
                    <button onClick={() => { setEditando(l); setVersao(versao + 1) }}>Editar</button>{' '}
                    <button onClick={() => confirm('Excluir este registro?') && agir(api('DELETE', `/${rota}/${l.id}`))}>Excluir</button>
                  </td>
                </tr>
              ))}
              {!linhas.length && <tr><td colSpan="99">Nenhum registro.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
