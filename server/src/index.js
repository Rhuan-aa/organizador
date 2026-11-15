import { abrirDb } from './db.js'
import { criarApp } from './app.js'
import { criarEnviar, verificarPrazos } from './notificacoes.js'

const db = abrirDb()
const port = process.env.PORT || 3000
const enviar = criarEnviar()
const rodar = () => verificarPrazos(db, enviar).catch((e) => console.error('Falha ao notificar:', e.message))

rodar()
setInterval(rodar, 24 * 60 * 60 * 1000)
criarApp(db).listen(port, () => console.log(`API em http://localhost:${port}`))
