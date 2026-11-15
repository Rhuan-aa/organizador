import { test } from 'node:test'
import assert from 'node:assert/strict'
import { iniciar } from './util.js'

test('calendário: aula expandida por dia da semana, atividade e prova', async (t) => {
  const { cliente, fechar } = await iniciar()
  t.after(fechar)
  const a = cliente()
  await a('POST', '/api/auth/registrar', { nome: 'Ana', email: 'a@x.com', senha: '1' })
  // novembro/2026: 2, 9, 16, 23 e 30 são segundas-feiras
  const aula = (await a('POST', '/api/aulas', { cod_disciplina: 'M1', nome_disciplina: 'Cálculo', dia_semana: 1, horario: '08:00', semestre: '1' })).json
  await a('POST', '/api/atividades', { aula_id: aula.id, titulo: 'Lista 1', data_entrega: '2026-11-20' })
  await a('POST', '/api/provas', { aula_id: aula.id, data: '2026-11-25', horario: '14:00' })
  await a('POST', '/api/provas', { aula_id: aula.id, data: '2026-12-02', horario: '14:00' }) // outro mês

  const { status, json } = await a('GET', '/api/calendario?ano=2026&mes=11')
  assert.equal(status, 200)
  assert.deepEqual(json.filter((e) => e.tipo === 'aula').map((e) => e.data.slice(8)), ['02', '09', '16', '23', '30'])
  assert.equal(json.filter((e) => e.tipo === 'atividade')[0].data, '2026-11-20')
  assert.equal(json.filter((e) => e.tipo === 'prova').length, 1)
  assert.equal((await a('GET', '/api/calendario?ano=2026&mes=13')).status, 400)
})
