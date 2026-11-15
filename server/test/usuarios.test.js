import { test } from 'node:test'
import assert from 'node:assert/strict'
import { iniciar } from './util.js'

test('registro, login, eu, perfis e senha errada', async (t) => {
  const { cliente, fechar } = await iniciar()
  t.after(fechar)
  const a = cliente()
  let r = await a('POST', '/api/auth/registrar', { nome: 'Ana', email: 'ana@x.com', senha: '123' })
  assert.equal(r.status, 201)
  assert.equal(r.json.perfil, 'admin') // primeiro usuário
  assert.equal(r.json.senha_hash, undefined)
  r = await a('GET', '/api/auth/eu')
  assert.equal(r.json.email, 'ana@x.com')

  assert.equal((await a('POST', '/api/auth/registrar', { nome: 'Z', email: 'ANA@x.com', senha: '1' })).status, 409)
  const b = cliente()
  assert.equal((await b('POST', '/api/auth/login', { email: 'ana@x.com', senha: 'errada' })).status, 401)
  r = await b('POST', '/api/auth/registrar', { nome: 'Beto', email: 'beto@x.com', senha: '123' })
  assert.equal(r.json.perfil, 'aluno')
  assert.equal((await b('GET', '/api/usuarios')).status, 403)
  assert.equal((await a('GET', '/api/usuarios')).json.length, 2)
  assert.equal((await cliente()('GET', '/api/auth/eu')).status, 401)

  r = await b('PUT', '/api/usuarios/eu', { antecedencia_dias: 5 })
  assert.equal(r.json.antecedencia_dias, 5)

  // exclusão de usuário: sai da lista e perde o acesso
  assert.equal((await a('DELETE', `/api/usuarios/${r.json.id}`)).status, 204)
  assert.equal((await b('GET', '/api/auth/eu')).status, 401)
})
