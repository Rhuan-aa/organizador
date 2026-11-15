// Fábrica de rotas CRUD por usuário, com exclusão lógica (excluido_em).
// cfg: { tabela, campos, obrigatorios, texto (filtros LIKE), filtros (filtros =), inteiros, aula (tem aula_id + JOIN), ordem, duplicado }
const vazio = (v) => v === undefined || v === null || String(v).trim() === ''

export function crud(app, db, login, cfg) {
  const { tabela, campos, obrigatorios, texto = [], filtros = [], inteiros = [], aula = false, ordem, duplicado = 'Registro duplicado' } = cfg
  const base = aula
    ? `SELECT t.*, a.nome_disciplina FROM ${tabela} t JOIN aulas a ON a.id = t.aula_id`
    : `SELECT t.* FROM ${tabela} t`
  const rota = `/api/${tabela}`
  const buscar = (id, uid) => db.prepare(`${base} WHERE t.id = ? AND t.usuario_id = ? AND t.excluido_em IS NULL`).get(id, uid)

  // normaliza o corpo: vazio vira null, inteiros viram número
  const limpa = (body) => {
    const o = {}
    for (const c of campos) {
      if (!(c in body)) continue
      const v = vazio(body[c]) ? null : body[c]
      o[c] = v !== null && inteiros.includes(c) ? Number(v) : typeof v === 'string' ? v.trim() : v
    }
    return o
  }

  // grava (insert/update) traduzindo erros de restrição do SQLite em 400/409
  const grava = (res, uid, dados, sql, args, status, id) => {
    const faltam = obrigatorios.filter((c) => vazio(dados[c]))
    if (faltam.length) return res.status(400).json({ erro: `Campos obrigatórios: ${faltam.join(', ')}` })
    if (aula && !db.prepare('SELECT 1 FROM aulas WHERE id = ? AND usuario_id = ? AND excluido_em IS NULL').get(dados.aula_id, uid))
      return res.status(400).json({ erro: 'Aula inválida' })
    try {
      const r = db.prepare(sql).run(...args)
      res.status(status).json(buscar(id ?? r.lastInsertRowid, uid))
    } catch (e) {
      if (/UNIQUE/.test(e.message)) return res.status(409).json({ erro: duplicado })
      if (/CHECK|NOT NULL/.test(e.message)) return res.status(400).json({ erro: 'Valor inválido' })
      throw e
    }
  }

  app.get(rota, login, (req, res) => {
    const where = ['t.usuario_id = ?', 't.excluido_em IS NULL']
    const args = [req.user.id]
    for (const f of [...texto, ...filtros]) {
      const v = req.query[f]
      if (vazio(v)) continue
      where.push(texto.includes(f) ? `t.${f} LIKE ?` : `t.${f} = ?`)
      args.push(texto.includes(f) ? `%${v}%` : v)
    }
    res.json(db.prepare(`${base} WHERE ${where.join(' AND ')} ORDER BY ${ordem}`).all(...args))
  })

  app.post(rota, login, (req, res) => {
    const d = limpa(req.body)
    const cols = Object.keys(d)
    grava(res, req.user.id, d,
      `INSERT INTO ${tabela} (usuario_id${cols.map((c) => ', ' + c).join('')}) VALUES (?${', ?'.repeat(cols.length)})`,
      [req.user.id, ...cols.map((c) => d[c])], 201)
  })

  app.put(`${rota}/:id`, login, (req, res) => {
    const atual = buscar(req.params.id, req.user.id)
    if (!atual) return res.status(404).json({ erro: 'Não encontrado' })
    const d = { ...Object.fromEntries(campos.map((c) => [c, atual[c]])), ...limpa(req.body) }
    grava(res, req.user.id, d,
      `UPDATE ${tabela} SET ${campos.map((c) => c + ' = ?').join(', ')} WHERE id = ?`,
      [...campos.map((c) => d[c]), atual.id], 200, atual.id)
  })

  app.delete(`${rota}/:id`, login, (req, res) => {
    const r = db.prepare(`UPDATE ${tabela} SET excluido_em = datetime('now') WHERE id = ? AND usuario_id = ? AND excluido_em IS NULL`)
      .run(req.params.id, req.user.id)
    if (!r.changes) return res.status(404).json({ erro: 'Não encontrado' })
    res.status(204).end()
  })
}
