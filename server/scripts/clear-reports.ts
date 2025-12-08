const base = process.env.BASE_URL || "http://127.0.0.1:5000";

async function loginAdmin(): Promise<string> {
  const res = await fetch(`${base}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" }),
    redirect: "manual",
  });
  if (!res.ok) {
    throw new Error(`Login falló: ${res.status} ${res.statusText}`);
  }
  const cookieHeader = res.headers.get("set-cookie");
  if (!cookieHeader) {
    throw new Error(`No se recibió cookie de sesión al iniciar sesión en ${base}`);
  }
  return cookieHeader.split(";")[0];
}

async function getReports(cookie: string): Promise<any[]> {
  const res = await fetch(`${base}/api/reports`, { headers: { Cookie: cookie } });
  if (!res.ok) throw new Error(`GET /api/reports falló: ${res.status}`);
  return res.json();
}

async function clearReports(cookie: string): Promise<void> {
  const res = await fetch(`${base}/api/reports/clear`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
  });
  if (!res.ok) throw new Error(`POST /api/reports/clear falló: ${res.status} ${res.statusText}`);
}

async function main() {
  const cookie = await loginAdmin();
  const before = await getReports(cookie);
  console.log(`Reportes antes de limpiar: ${before.length}`);
  await clearReports(cookie);
  const after = await getReports(cookie);
  console.log(`Reportes después de limpiar: ${after.length}`);
  if (after.length !== 0) {
    throw new Error("La limpieza no dejó la tabla de reportes vacía");
  }
  console.log("✓ Limpieza de reportes completada");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

