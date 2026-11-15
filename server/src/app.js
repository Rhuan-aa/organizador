import express from 'express'
import { crud } from './crud.js'
import { hashSenha, confereSenha, setarCookie, exigeLogin, exigeAdmin } from './auth.js'

const publico = ({ senha_hash, ...u }) => u
const vazio = (v) => v === undefined || v === null || String(v).trim() === ''

export function criarApp(db) {
  const app = express()
  app.use(express.json())
  const login = exigeLogin(db)

  app.post('/api/auth/registrar', (req, res) => {
    const { nome, email, senha } = req.body
    if ([nome, email, senha].some(vazio)) return res.status(400).json({ erro: 'Campos obrigatórios: nome, email, senha' })
    const em = String(email).trim().toLowerCase()
    if (db.prepare('SELECT 1 FROM usuarios WHERE email = ? AND excluido_em IS NULL').get(em))
      return res.status(409).json({ erro: 'E-mail já cadastrado' })
    const perfil = db.prepare('SELECT COUNT(*) n FROM usuarios').get().n === 0 ? 'admin' : 'aluno'
    const { lastInsertRowid: id } = db
      .prepare('INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)')
      .run(String(nome).trim(), em, hashSenha(String(senha)), perfil)
    const u = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id)
    setarCookie(res, u)
    res.status(201).json(publico(u))
  })

  app.post('/api/auth/login', (req, res) => {
    const { email, senha } = req.body
    const u = db.prepare('SELECT * FROM usuarios WHERE email = ? AND excluido_em IS NULL').get(String(email || '').trim().toLowerCase())
    if (!u || !confereSenha(String(senha || ''), u.senha_hash)) return res.status(401).json({ erro: 'E-mail ou senha inválidos' })
    setarCookie(res, u)
    res.json(publico(u))
  })

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token')
    res.status(204).end()
  })

  app.get('/api/auth/eu', login, (req, res) => res.json(publico(req.user)))

  app.put('/api/usuarios/eu', login, (req, res) => {
    const { nome = req.user.nome, antecedencia_dias = req.user.antecedencia_dias } = req.body
    if (vazio(nome) || !Number.isInteger(antecedencia_dias) || antecedencia_dias < 0)
      return res.status(400).json({ erro: 'Nome e antecedência (inteiro >= 0) são obrigatórios' })
    db.prepare('UPDATE usuarios SET nome = ?, antecedencia_dias = ? WHERE id = ?').run(String(nome).trim(), antecedencia_dias, req.user.id)
    res.json(publico(db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.user.id)))
  })

  app.get('/api/usuarios', login, exigeAdmin, (req, res) =>
    res.json(db.prepare('SELECT * FROM usuarios WHERE excluido_em IS NULL ORDER BY id').all().map(publico)))

  app.put('/api/usuarios/:id', login, exigeAdmin, (req, res) => {
    const u = db.prepare('SELECT * FROM usuarios WHERE id = ? AND excluido_em IS NULL').get(req.params.id)
    if (!u) return res.status(404).json({ erro: 'Não encontrado' })
    const { nome = u.nome, perfil = u.perfil } = req.body
    if (vazio(nome) || !['aluno', 'admin'].includes(perfil)) return res.status(400).json({ erro: 'Nome ou perfil inválido' })
    db.prepare('UPDATE usuarios SET nome = ?, perfil = ? WHERE id = ?').run(String(nome).trim(), perfil, u.id)
    res.json(publico(db.prepare('SELECT * FROM usuarios WHERE id = ?').get(u.id)))
  })

  app.delete('/api/usuarios/:id', login, exigeAdmin, (req, res) => {
    const r = db.prepare("UPDATE usuarios SET excluido_em = datetime('now') WHERE id = ? AND excluido_em IS NULL").run(req.params.id)
    if (!r.changes) return res.status(404).json({ erro: 'Não encontrado' })
    res.status(204).end()
  })

  crud(app, db, login, {
    tabela: 'aulas',
    campos: ['cod_disciplina', 'nome_disciplina', 'professor', 'sala', 'dia_semana', 'horario', 'periodo', 'semestre', 'status'],
    obrigatorios: ['cod_disciplina', 'nome_disciplina', 'dia_semana', 'horario', 'semestre'],
    texto: ['cod_disciplina', 'nome_disciplina', 'professor'],
    filtros: ['semestre', 'periodo', 'status'],
    inteiros: ['dia_semana'],
    ordem: 't.semestre DESC, t.dia_semana, t.horario',
  })

  crud(app, db, login, {
    tabela: 'atividades',
    campos: ['aula_id', 'titulo', 'descricao', 'data_entrega', 'status'],
    obrigatorios: ['aula_id', 'titulo', 'data_entrega'],
    texto: ['titulo'],
    filtros: ['data_entrega'],
    inteiros: ['aula_id'],
    aula: true,
    ordem: 't.data_entrega, t.id',
  })

  crud(app, db, login, {
    tabela: 'provas',
    campos: ['aula_id', 'data', 'horario', 'conteudo'],
    obrigatorios: ['aula_id', 'data', 'horario'],
    filtros: ['aula_id', 'data'],
    inteiros: ['aula_id'],
    aula: true,
    ordem: 't.data, t.horario',
    duplicado: 'Conflito de horário com outra prova',
  })

  app.get('/api/calendario', login, (req, res) => {
    const ano = Number(req.query.ano), mes = Number(req.query.mes)
    if (!Number.isInteger(ano) || !Number.isInteger(mes) || mes < 1 || mes > 12)
      return res.status(400).json({ erro: 'Informe ano e mes (1-12)' })
    const prefixo = `${ano}-${String(mes).padStart(2, '0')}-`
    const uid = req.user.id
    const eventos = []
    const aulas = db.prepare("SELECT id, nome_disciplina, dia_semana, horario FROM aulas WHERE usuario_id = ? AND excluido_em IS NULL AND status = 'ativa'").all(uid)
    for (let d = 1, n = new Date(ano, mes, 0).getDate(); d <= n; d++) {
      const dow = new Date(ano, mes - 1, d).getDay()
      for (const a of aulas.filter((a) => a.dia_semana === dow))
        eventos.push({ tipo: 'aula', data: prefixo + String(d).padStart(2, '0'), horario: a.horario, titulo: a.nome_disciplina, id: a.id })
    }
    for (const a of db.prepare("SELECT id, titulo, data_entrega, status FROM atividades WHERE usuario_id = ? AND excluido_em IS NULL AND data_entrega LIKE ?").all(uid, prefixo + '%'))
      eventos.push({ tipo: 'atividade', data: a.data_entrega, titulo: a.titulo, id: a.id, status: a.status })
    for (const p of db.prepare("SELECT p.id, p.data, p.horario, a.nome_disciplina FROM provas p JOIN aulas a ON a.id = p.aula_id WHERE p.usuario_id = ? AND p.excluido_em IS NULL AND p.data LIKE ?").all(uid, prefixo + '%'))
      eventos.push({ tipo: 'prova', data: p.data, horario: p.horario, titulo: `Prova: ${p.nome_disciplina}`, id: p.id })
    res.json(eventos.sort((a, b) => a.data.localeCompare(b.data) || (a.horario || '').localeCompare(b.horario || '')))
  })

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => res.status(err.status || 500).json({ erro: err.status ? 'Requisição inválida' : 'Erro interno' }))
  return app
}
