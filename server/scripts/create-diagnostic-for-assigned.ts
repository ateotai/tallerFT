// Crea un diagnóstico para un reporte asignado (o asigna uno si no hay)
// Uso: npx tsx server/scripts/create-diagnostic-for-assigned.ts

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

async function getJSON(path: string, cookie: string) {
  const res = await fetch(`${base}${path}`, { headers: { Cookie: cookie } });
  if (!res.ok) throw new Error(`GET ${path} falló: ${res.status} ${res.statusText}`);
  return res.json();
}

async function postJSON(path: string, body: any, cookie: string) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} falló: ${res.status} ${res.statusText}`);
  return res.json();
}

async function main() {
  const cookie = await loginAdmin();

  const reports = await getJSON('/api/reports', cookie);
  const employees = await getJSON('/api/employees', cookie);
  if (!Array.isArray(employees) || employees.length === 0) {
    throw new Error('No hay empleados disponibles; crea al menos uno.');
  }

  // Buscar un reporte ya asignado para diagnóstico
  let targetReport = reports.find((r: any) => r.status === 'diagnostico' && r.assignedToEmployeeId);
  let assignedEmployeeId: number | null = targetReport?.assignedToEmployeeId || null;

  // Si no hay uno asignado, asignar el primero no resuelto al primer empleado
  if (!targetReport) {
    const reportToAssign = reports.find((r: any) => r.status !== 'resolved') || reports[0];
    const employee = employees[0];
    console.log('Asignando reporte', reportToAssign.id, 'al empleado', employee.id);
    const assignResult = await postJSON(`/api/reports/${reportToAssign.id}/assign`, { employeeId: employee.id }, cookie);
    targetReport = assignResult.report;
    assignedEmployeeId = assignResult.report?.assignedToEmployeeId ?? employee.id;
  }

  if (!targetReport) throw new Error('No se pudo determinar un reporte para diagnóstico');
  if (!assignedEmployeeId) throw new Error('El reporte no tiene empleado asignado');

  // Crear diagnóstico explícito
  const payload = {
    reportId: targetReport.id,
    employeeId: assignedEmployeeId,
    odometer: 123456,
    vehicleCondition: 'pendiente de evaluación',
    fuelLevel: 'medio',
    possibleCause: 'Ruido en transmisión al acelerar',
    severity: 'moderado',
    technicalRecommendation: 'Inspección de transmisión y cambio de aceite',
    estimatedRepairTime: '4 horas',
    requiredMaterials: 'Aceite de transmisión, filtros',
    requiresAdditionalTests: false,
  };

  console.log('Creando diagnóstico para reporte', targetReport.id, 'y empleado', assignedEmployeeId);
  const created = await postJSON('/api/diagnostics', payload, cookie);
  console.log('Diagnóstico creado con ID:', created?.id);

  // Verificar lista de diagnósticos no aprobados
  const diagnostics = await getJSON('/api/diagnostics', cookie);
  console.log('Diagnósticos pendientes visibles:', Array.isArray(diagnostics) ? diagnostics.length : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});