import nodemailer from 'nodemailer'

// Com SMTP_HOST envia e-mail de verdade; sem ele, apenas registra no console.
export function criarEnviar() {
  if (!process.env.SMTP_HOST) return async (m) => console.log(`[e-mail simulado] para ${m.para}: ${m.assunto}\n${m.texto}`)
  const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  })
  return (m) => t.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: m.para, subject: m.assunto, text: m.texto })
}

const dia = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// Avisa uma única vez (notificado_em) sobre atividades pendentes e provas dentro da antecedência do usuário.
export async function verificarPrazos(db, enviar, hoje = new Date()) {
  const h = dia(hoje)
  const janela = (col) => `t.notificado_em IS NULL AND t.excluido_em IS NULL AND u.excluido_em IS NULL
    AND t.${col} >= ? AND date(t.${col}, '-' || u.antecedencia_dias || ' days') <= ?`
  const itens = [
    ...db.prepare(`SELECT 'atividades' tabela, t.id, u.email, u.nome, 'Atividade "' || t.titulo || '"' o, t.data_entrega data, NULL horario
      FROM atividades t JOIN usuarios u ON u.id = t.usuario_id WHERE t.status != 'concluida' AND ${janela('data_entrega')}`).all(h, h),
    ...db.prepare(`SELECT 'provas' tabela, t.id, u.email, u.nome, 'Prova de ' || a.nome_disciplina o, t.data, t.horario
      FROM provas t JOIN usuarios u ON u.id = t.usuario_id JOIN aulas a ON a.id = t.aula_id WHERE ${janela('data')}`).all(h, h),
  ]
  for (const i of itens) {
    await enviar({
      para: i.email,
      assunto: `Lembrete: ${i.o} em ${i.data}`,
      texto: `Olá, ${i.nome}! ${i.o} está marcada para ${i.data}${i.horario ? ' às ' + i.horario : ''}.`,
    })
    db.prepare(`UPDATE ${i.tabela} SET notificado_em = datetime('now') WHERE id = ?`).run(i.id)
  }
  return itens.length
}
