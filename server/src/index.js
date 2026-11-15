import { abrirDb } from './db.js'
import { criarApp } from './app.js'

const db = abrirDb()
const port = process.env.PORT || 3000
criarApp(db).listen(port, () => console.log(`API em http://localhost:${port}`))
