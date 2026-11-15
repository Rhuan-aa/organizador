import { DatabaseSync } from 'node:sqlite'

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    senha_hash TEXT NOT NULL,
    perfil TEXT NOT NULL DEFAULT 'aluno' CHECK (perfil IN ('aluno','admin')),
    antecedencia_dias INTEGER NOT NULL DEFAULT 2,
    excluido_em TEXT
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_email ON usuarios(email) WHERE excluido_em IS NULL`,
]

export function abrirDb(arquivo = process.env.DB_FILE || 'organizador.db') {
  const db = new DatabaseSync(arquivo)
  for (const s of SCHEMA) db.exec(s)
  return db
}
