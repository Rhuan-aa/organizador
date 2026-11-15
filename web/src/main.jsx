import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { aplicarTema, temaSalvo } from './util.js'
import './styles.css'

aplicarTema(temaSalvo())
createRoot(document.getElementById('root')).render(<App />)
