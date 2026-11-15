import { test } from 'node:test'
import assert from 'node:assert/strict'
import { iniciar } from './util.js'

test('provas: conflito de horário 409, obrigatórios, filtro e exclusão', async (t) => {
  const { cliente, fechar } = await iniciar()
  t.after(fechar)
  const a = cliente()
  await a('POST', '/api/auth/registrar', { nome: 'Ana', email: 'a@x.com', senha: '1' })
  const mk = async (cod) => (await a('POST', '/api/aulas', { cod_disciplina: cod, nome_disciplina: cod, dia_semana: 1, horario: '08:00', semestre: '1' })).json
  const [m, f] = [await mk('M1'), await mk('F1')]
  const prova = { aula_id: m.id, data: '2026-12-01', horario: '14:00' }

  let r = await a('POST', '/api/provas', prova)
  assert.equal(r.status, 201)
  r = await a('POST', '/api/provas', { ...prova, aula_id: f.id })
  assert.equal(r.status, 409)
  assert.equal(r.json.erro, 'Conflito de horário com outra prova')
  assert.equal((await a('POST', '/api/provas', { aula_id: f.id, data: '2026-12-01' })).status, 400)
  assert.equal((await a('POST', '/api/provas', { ...prova, aula_id: f.id, horario: '16:00' })).status, 201)
  assert.equal((await a('GET', `/api/provas?aula_id=${f.id}`)).json.length, 1)

  // excluída libera o horário
  const { json: [p1] } = await a('GET', '/api/provas?data=2026-12-01')
  await a('DELETE', `/api/provas/${p1.id}`)
  assert.equal((await a('POST', '/api/provas', { ...prova, aula_id: f.id })).status, 201)
})
