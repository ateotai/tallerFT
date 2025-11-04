// Lista diagnósticos vía API con y sin includeApproved
// Uso: npx tsx server/scripts/list-diagnostics-api.ts

const base = process.env.BASE_URL || 'http://127.0.0.1:5000';

async function main() {
  const loginRes = await fetch(`${base}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  const cookieHeader = loginRes.headers.get('set-cookie');
  if (!cookieHeader) throw new Error('No session cookie');
  const Cookie = cookieHeader.split(';')[0];

  const resPending = await fetch(`${base}/api/diagnostics`, { headers: { Cookie } });
  const pending = await resPending.json();
  console.log('Pendientes:', Array.isArray(pending) ? pending.length : 0);

  const resAll = await fetch(`${base}/api/diagnostics?includeApproved=1`, { headers: { Cookie } });
  const all = await resAll.json();
  console.log('Todos (incl. aprobados):', Array.isArray(all) ? all.length : 0);
  if (Array.isArray(all)) console.log(all.map((d:any) => ({ id: d.id, reportId: d.reportId, employeeId: d.employeeId, approvedAt: d.approvedAt })));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});