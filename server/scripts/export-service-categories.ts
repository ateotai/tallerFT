import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "../db";
import { serviceCategories, serviceSubcategories } from "../../shared/schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../");
const exportDir = path.resolve(rootDir, "exports");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  const needsQuotes = /[",\n]/.test(str);
  const escaped = str.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function toCsv<T extends Record<string, any>>(rows: T[], headers: string[]): string {
  const lines = [headers.join(",")];
  for (const row of rows) {
    const line = headers.map((h) => escapeCsv(row[h])).join(",");
    lines.push(line);
  }
  return lines.join("\n") + "\n";
}

async function main() {
  console.log("Exportando categorías y subcategorías de servicio...");

  ensureDir(exportDir);

  const categories = await db.select().from(serviceCategories).orderBy(serviceCategories.id);
  const subcategories = await db.select().from(serviceSubcategories).orderBy(serviceSubcategories.categoryId, serviceSubcategories.id);

  // JSON
  const categoriesJsonPath = path.resolve(exportDir, "service_categories.json");
  const subcategoriesJsonPath = path.resolve(exportDir, "service_subcategories.json");
  fs.writeFileSync(categoriesJsonPath, JSON.stringify(categories, null, 2), "utf-8");
  fs.writeFileSync(subcategoriesJsonPath, JSON.stringify(subcategories, null, 2), "utf-8");

  // CSV
  const categoriesCsvHeaders = ["id", "name", "description", "active", "createdAt"];
  const subcategoriesCsvHeaders = ["id", "categoryId", "name", "description", "active", "createdAt"];
  const categoriesCsv = toCsv(categories, categoriesCsvHeaders);
  const subcategoriesCsv = toCsv(subcategories, subcategoriesCsvHeaders);
  const categoriesCsvPath = path.resolve(exportDir, "service_categories.csv");
  const subcategoriesCsvPath = path.resolve(exportDir, "service_subcategories.csv");
  fs.writeFileSync(categoriesCsvPath, categoriesCsv, "utf-8");
  fs.writeFileSync(subcategoriesCsvPath, subcategoriesCsv, "utf-8");

  console.log("\nArchivos generados:");
  console.log("- ", path.relative(rootDir, categoriesJsonPath));
  console.log("- ", path.relative(rootDir, subcategoriesJsonPath));
  console.log("- ", path.relative(rootDir, categoriesCsvPath));
  console.log("- ", path.relative(rootDir, subcategoriesCsvPath));
}

main().catch((err) => {
  console.error("Error en exportación:", err);
  process.exit(1);
});