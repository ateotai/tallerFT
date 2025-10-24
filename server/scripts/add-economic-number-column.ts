import Database from "better-sqlite3";

const db = new Database("database.db");

try {
  db.exec(`ALTER TABLE vehicles ADD COLUMN economic_number TEXT;`);
  console.log("✓ Column economic_number added to vehicles table successfully");
} catch (error: any) {
  if (error.message.includes("duplicate column name")) {
    console.log("✓ Column economic_number already exists in vehicles table");
  } else {
    console.error("Error adding column:", error);
    throw error;
  }
} finally {
  db.close();
}
