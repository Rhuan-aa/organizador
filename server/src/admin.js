import { pathToFileURL } from 'node:url'
import { abrirDb } from './db.js'

export function promoverAdmin(db, email) {
  const em = String(email).trim().toLowerCase()
  return db.prepare("UPDATE usuarios SET perfil = 'admin' WHERE email = ? AND excluido_em IS NULL").run(em).changes > 0
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const email = process.argv[2]
  if (!email) {
    console.error('Uso: npm run admin -- email@exemplo.com')
    process.exit(1)
  }
  if (promoverAdmin(abrirDb(), email)) console.log(`Usuário ${email} agora é admin.`)
  else {
    console.error(`Usuário não encontrado: ${email}`)
    process.exit(1)
  }
}
