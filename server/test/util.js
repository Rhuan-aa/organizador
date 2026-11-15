import { once } from 'node:events'
import { abrirDb } from '../src/db.js'
import { criarApp } from '../src/app.js'

export async function iniciar() {
  const db = abrirDb(':memory:')
  const srv = criarApp(db).listen(0)
  await once(srv, 'listening')
  const base = `http://localhost:${srv.address().port}`
  // cada cliente tem seu próprio cookie (um "usuário logado")
  const cliente = () => {
    let cookie = ''
    return async (metodo, caminho, corpo) => {
      const r = await fetch(base + caminho, {
        method: metodo,
        headers: { 'content-type': 'application/json', cookie },
        body: corpo && JSON.stringify(corpo),
      })
      const sc = r.headers.get('set-cookie')
      if (sc) cookie = sc.split(';')[0]
      const txt = await r.text()
      return { status: r.status, json: txt ? JSON.parse(txt) : null }
    }
  }
  return { db, base, cliente, fechar: () => srv.close() }
}
