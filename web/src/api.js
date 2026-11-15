export async function api(metodo, url, corpo) {
  const r = await fetch('/api' + url, {
    method: metodo,
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: corpo && JSON.stringify(corpo),
  })
  const txt = await r.text()
  const json = txt ? JSON.parse(txt) : null
  if (!r.ok) throw new Error(json?.erro || `Erro ${r.status}`)
  return json
}
