import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../../database.db");
const db = new Database(dbPath);

console.log("Starting service categories migration...");

try {
  // Check if service_categories table exists
  const tableCheck = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='service_categories'
  `).get();

  if (tableCheck) {
    console.log("service_categories table exists, checking columns...");
    
    // Get current columns
    const columns = db.prepare(`PRAGMA table_info(service_categories)`).all() as any[];
    const hasColor = columns.some((col: any) => col.name === 'color');
    const hasActive = columns.some((col: any) => col.name === 'active');
    
    if (hasColor && !hasActive) {
      console.log("Need to migrate from 'color' to 'active' column...");
      
      // SQLite doesn't support DROP COLUMN easily, so we need to recreate the table
      db.exec(`
        BEGIN TRANSACTION;
        
        -- Create new table with correct structure
        CREATE TABLE service_categories_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          active INTEGER DEFAULT 1 NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );
        
        -- Copy data from old table (all records will be active=1)
        INSERT INTO service_categories_new (id, name, description, created_at)
        SELECT id, name, description, created_at FROM service_categories;
        
        -- Drop old table
        DROP TABLE service_categories;
        
        -- Rename new table
        ALTER TABLE service_categories_new RENAME TO service_categories;
        
        COMMIT;
      `);
      
      console.log("✓ Migrated service_categories table successfully");
    } else if (!hasActive) {
      console.log("Adding 'active' column...");
      db.exec(`
        ALTER TABLE service_categories ADD COLUMN active INTEGER DEFAULT 1 NOT NULL;
      `);
      console.log("✓ Added 'active' column");
    } else {
      console.log("✓ service_categories table structure is correct");
    }
  } else {
    console.log("Creating service_categories table...");
    db.exec(`
      CREATE TABLE service_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        active INTEGER DEFAULT 1 NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `);
    console.log("✓ Created service_categories table");
  }

  // Check if service_subcategories table exists
  const subTableCheck = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='service_subcategories'
  `).get();

  if (!subTableCheck) {
    console.log("Creating service_subcategories table...");
    db.exec(`
      CREATE TABLE service_subcategories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        active INTEGER DEFAULT 1 NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        FOREIGN KEY (category_id) REFERENCES service_categories(id)
      );
    `);
    console.log("✓ Created service_subcategories table");
  } else {
    console.log("✓ service_subcategories table already exists");
  }

  console.log("\n✅ Migration completed successfully!");
  
} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
} finally {
  db.close();
}
