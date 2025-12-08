import 'dotenv/config';
const base = process.env.BASE_URL || 'http://127.0.0.1:5000';

async function loginAdmin(): Promise<string> {
  const res = await fetch(`${base}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    redirect: 'manual',
  });
  if (!res.ok) throw new Error(`login ${res.status}`);
  const cookieHeader = res.headers.get('set-cookie');
  if (!cookieHeader) throw new Error('no cookie');
  return cookieHeader.split(';')[0];
}

async function getJSON<T>(path: string, cookie: string): Promise<T> {
  const res = await fetch(`${base}${path}`, { headers: { Cookie: cookie } });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return await res.json();
}

async function postJSON<T>(path: string, body: any, cookie: string): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return await res.json();
}

async function main() {
  const cookie = await loginAdmin();
  const users = await getJSON<any[]>('/api/users', cookie);
  const assignedUserId = users[0]?.id;
  if (!assignedUserId) throw new Error('no users');

  let vehicles = await getJSON<any[]>('/api/vehicles', cookie);
  let vehicleId = vehicles[0]?.id;
  if (!vehicleId) {
    const v = await postJSON<any>('/api/vehicles', { brand: 'Nissan', model: 'Versa', year: 2019, plate: `TEST-${Date.now()}`, mileage: 50000, fuelType: 'Gasolina' }, cookie);
    vehicleId = v.id;
    vehicles = [v];
  }

  let categories = await getJSON<any[]>('/api/service-categories', cookie);
  let categoryId = categories.find((c) => c.active)?.id || categories[0]?.id;
  if (!categoryId) {
    const c = await postJSON<any>('/api/service-categories', { name: `Mantenimiento ${Date.now()}` }, cookie);
    categoryId = c.id;
    categories = [c];
  }

  const nextDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const payload = {
    vehicleId,
    categoryId,
    assignedUserId,
    title: 'Servicio programado de prueba',
    description: 'Validación de creación desde script',
    frequency: 'mensual',
    nextDueDate,
    nextDueMileage: 1000,
    estimatedCost: 1500,
    status: 'pending',
  };

  const created = await postJSON<any>('/api/scheduled-maintenance', payload, cookie);
  console.log(JSON.stringify({ ok: true, created }, null, 2));
}

main().catch((err) => { console.error(err); process.exit(1); });
