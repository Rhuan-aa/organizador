import { test } from 'node:test'
import assert from 'node:assert/strict'
import { iniciar } from './util.js'
import { verificarPrazos } from '../src/notificacoes.js'

test('verificarPrazos: avisa uma vez, respeita antecedência, ignora concluídas', async (t) => {
  const { cliente, db, fechar } = await iniciar()
  t.after(fechar)
  const a = cliente()
  await a('POST', '/api/auth/registrar', { nome: 'Ana', email: 'a@x.com', senha: '1' }) // antecedência padrão: 2 dias
  const aula = (await a('POST', '/api/aulas', { cod_disciplina: 'M1', nome_disciplina: 'Cálculo', dia_semana: 1, horario: '08:00', semestre: '1' })).json
  const mk = (titulo, data_entrega, status) => a('POST', '/api/atividades', { aula_id: aula.id, titulo, data_entrega, status })
  await mk('Dentro', '2026-11-17')
  await mk('Longe', '2026-11-30')
  await mk('Vencida', '2026-11-10')
  await mk('Feita', '2026-11-16', 'concluida')
  await a('POST', '/api/provas', { aula_id: aula.id, data: '2026-11-16', horario: '10:00' })

  const enviados = []
  const enviar = async (m) => enviados.push(m)
  const hoje = new Date(2026, 10, 15)
  assert.equal(await verificarPrazos(db, enviar, hoje), 2)
  assert.equal(enviados.length, 2)
  assert.ok(enviados.every((m) => m.para === 'a@x.com'))
  assert.equal(await verificarPrazos(db, enviar, hoje), 0) // não repete
  assert.equal(await verificarPrazos(db, enviar, new Date(2026, 10, 28)), 1) // "Longe" entra na janela
})
