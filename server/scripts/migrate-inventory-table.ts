import { sqlite } from "../db";

async function migrate() {
  console.log("Migrating inventory table to add categoryId and maxQuantity fields...");
  
  try {
    sqlite.exec(`
      ALTER TABLE inventory ADD COLUMN category_id INTEGER REFERENCES inventory_categories(id);
      ALTER TABLE inventory ADD COLUMN max_quantity INTEGER;
    `);
    
    console.log("Migration completed successfully!");
  } catch (error: any) {
    if (error.message.includes("duplicate column name")) {
      console.log("Columns already exist, migration not needed.");
    } else {
      throw error;
    }
  }
}

migrate()
  .catch((error) => {
    console.error("Error migrating inventory table:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
