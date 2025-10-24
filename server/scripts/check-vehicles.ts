import Database from "better-sqlite3";

const db = new Database("database.db");

try {
  const vehicles = db.prepare(`
    SELECT id, brand, model, plate, economic_number, assigned_area 
    FROM vehicles 
    ORDER BY id DESC 
    LIMIT 5
  `).all();
  
  console.log("Recent vehicles:");
  console.log(JSON.stringify(vehicles, null, 2));
} catch (error) {
  console.error("Error querying vehicles:", error);
} finally {
  db.close();
}
