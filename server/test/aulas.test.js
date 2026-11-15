import { test } from 'node:test'
import assert from 'node:assert/strict'
import { iniciar } from './util.js'

const aula = { cod_disciplina: 'MAT01', nome_disciplina: 'Cálculo', dia_semana: 1, horario: '08:00', semestre: '2026.2' }

async function logado(cliente, nome) {
  const c = cliente()
  await c('POST', '/api/auth/registrar', { nome, email: `${nome}@x.com`, senha: '1' })
  return c
}

test('aulas: duplicada 409, obrigatório 400, filtro, exclusão e isolamento', async (t) => {
  const { cliente, fechar } = await iniciar()
  t.after(fechar)
  const a = await logado(cliente, 'ana')
  const b = await logado(cliente, 'beto')

  let r = await a('POST', '/api/aulas', aula)
  assert.equal(r.status, 201)
  const id = r.json.id
  assert.equal((await a('POST', '/api/aulas', aula)).status, 409)
  assert.equal((await a('POST', '/api/aulas', { ...aula, cod_disciplina: '  ' })).status, 400)
  assert.equal((await a('POST', '/api/aulas', { ...aula, cod_disciplina: 'X', dia_semana: 9 })).status, 400)

  await a('POST', '/api/aulas', { ...aula, cod_disciplina: 'FIS01', nome_disciplina: 'Física', professor: 'Lia' })
  assert.equal((await a('GET', '/api/aulas?nome_disciplina=cálc')).json.length, 1)
  assert.equal((await a('GET', '/api/aulas?professor=Lia')).json.length, 1)

  assert.equal((await a('PUT', `/api/aulas/${id}`, { sala: 'B2' })).json.sala, 'B2')

  // outro usuário não vê nem altera
  assert.equal((await b('GET', '/api/aulas')).json.length, 0)
  assert.equal((await b('PUT', `/api/aulas/${id}`, { sala: 'X' })).status, 404)
  assert.equal((await b('DELETE', `/api/aulas/${id}`)).status, 404)
  assert.equal((await b('POST', '/api/aulas', aula)).status, 201) // mesma aula, outro dono: ok

  // exclusão lógica: some da consulta e libera o cadastro de novo
  assert.equal((await a('DELETE', `/api/aulas/${id}`)).status, 204)
  assert.equal((await a('GET', '/api/aulas')).json.length, 1)
  assert.equal((await a('POST', '/api/aulas', aula)).status, 201)
})
