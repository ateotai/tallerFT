import Database from "better-sqlite3";

const db = new Database("database.db");

try {
  db.exec(`ALTER TABLE vehicles ADD COLUMN assigned_employee_id INTEGER;`);
  console.log("✓ Column assigned_employee_id added to vehicles table successfully");
} catch (error: any) {
  if (error.message.includes("duplicate column name") || error.message.includes("already exists")) {
    console.log("✓ Column assigned_employee_id already exists in vehicles table");
  } else {
    console.error("Error adding column:", error);
    throw error;
  }
} finally {
  db.close();
}
