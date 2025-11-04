// Muestra el usuario autenticado actual
// Uso: npx tsx server/scripts/whoami.ts

const base = process.env.BASE_URL || 'http://127.0.0.1:5000';

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
  const res = await fetch(`${base}/api/auth/user`, { headers: { Cookie: cookie } });
  if (!res.ok) throw new Error(`Error al obtener usuario: ${res.status} ${res.statusText}`);
  const user = await res.json();
  console.log('Usuario actual:', user);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});