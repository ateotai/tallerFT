// Simple script to verify login and inventory items via the running dev server
// Usage: npx tsx server/scripts/verify-inventory.ts

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
  const sessionCookie = cookieHeader.split(';')[0]; // e.g. connect.sid=...

  const invRes = await fetch(`${base}/api/inventory`, {
    headers: { Cookie: sessionCookie },
  });
  if (!invRes.ok) {
    throw new Error(`Error al consultar inventario: ${invRes.status} ${invRes.statusText}`);
  }
  const items = await invRes.json();
  console.log('Total inventario:', items.length);
  console.log(
    JSON.stringify(
      items.slice(0, 10).map((i: any) => ({
        name: i.name,
        partNumber: i.partNumber,
        quantity: i.quantity,
        workshopId: i.workshopId,
      })),
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});