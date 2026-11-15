import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto'

const SECRET = process.env.SECRET || 'dev-secret-troque-em-producao'
const assina = (p) => createHmac('sha256', SECRET).update(p).digest('base64url')
const iguais = (a, b) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))

export function hashSenha(senha) {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(senha, salt, 64).toString('hex')}`
}

export function confereSenha(senha, hash) {
  const [salt, chave] = hash.split(':')
  return iguais(chave, scryptSync(senha, salt, 64).toString('hex'))
}

export function criarToken({ id, perfil }) {
  const p = Buffer.from(JSON.stringify({ id, perfil })).toString('base64url')
  return `${p}.${assina(p)}`
}

function lerToken(token) {
  const [p, s] = (token || '').split('.')
  if (!p || !s || !iguais(s, assina(p))) return null
  try { return JSON.parse(Buffer.from(p, 'base64url')) } catch { return null }
}

export function setarCookie(res, user) {
  res.cookie('token', criarToken(user), { httpOnly: true, sameSite: 'lax' })
}

// Carrega o usuário do banco a cada requisição: exclusão e mudança de perfil valem na hora.
export const exigeLogin = (db) => (req, res, next) => {
  const cookie = /(?:^|;\s*)token=([^;]*)/.exec(req.headers.cookie || '')
  const t = lerToken(cookie && cookie[1])
  const u = t && db.prepare('SELECT * FROM usuarios WHERE id = ? AND excluido_em IS NULL').get(t.id)
  if (!u) return res.status(401).json({ erro: 'Não autenticado' })
  req.user = u
  next()
}

export const exigeAdmin = (req, res, next) =>
  req.user.perfil === 'admin' ? next() : res.status(403).json({ erro: 'Acesso restrito a administradores' })
