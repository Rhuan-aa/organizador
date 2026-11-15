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
  `CREATE TABLE IF NOT EXISTS aulas (
    id INTEGER PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    cod_disciplina TEXT NOT NULL,
    nome_disciplina TEXT NOT NULL,
    professor TEXT,
    sala TEXT,
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
    horario TEXT NOT NULL CHECK (horario GLOB '[0-2][0-9]:[0-5][0-9]'),
    periodo TEXT,
    semestre TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ativa',
    excluido_em TEXT
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS ux_aulas ON aulas(usuario_id, cod_disciplina, dia_semana, horario, semestre) WHERE excluido_em IS NULL`,
]

export function abrirDb(arquivo = process.env.DB_FILE || 'organizador.db') {
  const db = new DatabaseSync(arquivo)
  for (const s of SCHEMA) db.exec(s)
  return db
}
