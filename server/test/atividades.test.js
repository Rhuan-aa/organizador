import { test } from 'node:test'
import assert from 'node:assert/strict'
import { iniciar } from './util.js'

test('atividades: obrigatórios, duplicada, status, aula de outro usuário e join', async (t) => {
  const { cliente, fechar } = await iniciar()
  t.after(fechar)
  const a = cliente()
  const b = cliente()
  await a('POST', '/api/auth/registrar', { nome: 'Ana', email: 'a@x.com', senha: '1' })
  await b('POST', '/api/auth/registrar', { nome: 'Beto', email: 'b@x.com', senha: '1' })
  const aula = (await a('POST', '/api/aulas', { cod_disciplina: 'M1', nome_disciplina: 'Cálculo', dia_semana: 1, horario: '08:00', semestre: '1' })).json
  const ativ = { aula_id: aula.id, titulo: 'Lista 1', data_entrega: '2026-11-20' }

  let r = await a('POST', '/api/atividades', ativ)
  assert.equal(r.status, 201)
  assert.equal(r.json.status, 'a_fazer')
  assert.equal(r.json.nome_disciplina, 'Cálculo')
  assert.equal((await a('POST', '/api/atividades', ativ)).status, 409)
  assert.equal((await a('POST', '/api/atividades', { ...ativ, titulo: '' })).status, 400)
  assert.equal((await b('POST', '/api/atividades', ativ)).status, 400) // aula de outro usuário

  assert.equal((await a('PUT', `/api/atividades/${r.json.id}`, { status: 'concluida' })).json.status, 'concluida')
  assert.equal((await a('PUT', `/api/atividades/${r.json.id}`, { status: 'xis' })).status, 400)
  assert.equal((await a('GET', '/api/atividades?data_entrega=2026-11-20')).json.length, 1)
  assert.equal((await a('GET', '/api/atividades?titulo=zzz')).json.length, 0)
  assert.equal((await b('GET', '/api/atividades')).json.length, 0)

  assert.equal((await a('DELETE', `/api/atividades/${r.json.id}`)).status, 204)
  assert.equal((await a('GET', '/api/atividades')).json.length, 0)
})
