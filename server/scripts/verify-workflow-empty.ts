// Verifica que reportes, diagnósticos y órdenes de trabajo estén vacíos
// Uso: npx tsx server/scripts/verify-workflow-empty.ts

const base = process.env.BASE_URL || 'http://127.0.0.1:5000';

async function main() {
  const loginRes = await fetch(`${base}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    redirect: 'manual',
  });

  const cookieHeader = loginRes.headers.get('set-cookie');
  if (!cookieHeader) {
    throw new Error(`No se recibió cookie de sesión al iniciar sesión en ${base}`);
  }
  const sessionCookie = cookieHeader.split(';')[0]; // p.ej. connect.sid=...

  const endpoints = [
    { name: 'Reportes de fallas', path: '/api/reports' },
    { name: 'Diagnósticos', path: '/api/diagnostics?includeApproved=true' },
    { name: 'Órdenes de trabajo', path: '/api/work-orders' },
  ];

  for (const ep of endpoints) {
    const res = await fetch(`${base}${ep.path}`, { headers: { Cookie: sessionCookie } });
    if (!res.ok) {
      throw new Error(`Error al consultar ${ep.name}: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log(`${ep.name}:`, Array.isArray(data) ? data.length : 0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});