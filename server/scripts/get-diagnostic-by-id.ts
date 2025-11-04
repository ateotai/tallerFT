// Obtiene un diagnóstico por ID desde el API
// Uso: npx tsx server/scripts/get-diagnostic-by-id.ts <id>

const base = process.env.BASE_URL || 'http://127.0.0.1:5000';
const id = Number(process.argv[2] || '1');

async function loginAdmin() {
  const res = await fetch(`${base}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    redirect: 'manual',
  });
  if (!res.ok) throw new Error(`Error al iniciar sesión: ${res.status} ${res.statusText}`);
  const cookieHeader = res.headers.get('set-cookie');
  if (!cookieHeader) throw new Error('No se recibió cookie de sesión');
  return cookieHeader.split(';')[0];
}

async function main() {
  const cookie = await loginAdmin();
  const res = await fetch(`${base}/api/diagnostics/${id}`, { headers: { Cookie: cookie } });
  console.log('Status:', res.status, res.statusText);
  const json = await res.json().catch(() => ({}));
  console.log('Body:', json);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});