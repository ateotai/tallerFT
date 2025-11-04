// Asigna el primer reporte disponible al primer mecánico y genera un diagnóstico automáticamente
// Uso: npx tsx server/scripts/assign-first-report.ts

const base = process.env.BASE_URL || 'http://127.0.0.1:5000';

async function main() {
  // Iniciar sesión como administrador
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

  // Obtener reportes disponibles
  const reportsRes = await fetch(`${base}/api/reports`, { headers: { Cookie: sessionCookie } });
  if (!reportsRes.ok) throw new Error(`Error al consultar reportes: ${reportsRes.status} ${reportsRes.statusText}`);
  const reports = await reportsRes.json();
  if (!Array.isArray(reports) || reports.length === 0) {
    console.log('No hay reportes disponibles para asignar.');
    return;
  }

  // Seleccionar el primer reporte que no esté resuelto
  const report = reports.find((r: any) => r.status !== 'resolved') || reports[0];
  console.log('Asignando reporte ID:', report.id);

  // Obtener empleados
  const empRes = await fetch(`${base}/api/employees`, { headers: { Cookie: sessionCookie } });
  if (!empRes.ok) throw new Error(`Error al consultar empleados: ${empRes.status} ${empRes.statusText}`);
  const employees = await empRes.json();
  if (!Array.isArray(employees) || employees.length === 0) {
    throw new Error('No hay empleados para asignar. Crea al menos un empleado.');
  }
  const employee = employees[0];
  console.log('Asignando al empleado ID:', employee.id, `${employee.firstName} ${employee.lastName}`);

  // Asignar reporte al empleado
  const assignRes = await fetch(`${base}/api/reports/${report.id}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
    body: JSON.stringify({ employeeId: employee.id }),
  });
  if (!assignRes.ok) throw new Error(`Error al asignar reporte: ${assignRes.status} ${assignRes.statusText}`);
  const result = await assignRes.json();
  console.log('Reporte asignado. Estado:', result.report?.status);

  // Verificar diagnósticos
  const diagRes = await fetch(`${base}/api/diagnostics`, { headers: { Cookie: sessionCookie } });
  if (!diagRes.ok) throw new Error(`Error al consultar diagnósticos: ${diagRes.status} ${diagRes.statusText}`);
  const diagnostics = await diagRes.json();
  console.log('Diagnósticos pendientes:', Array.isArray(diagnostics) ? diagnostics.length : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});