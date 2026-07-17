import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const basePath = path.join(__dirname, "..", "src", "drizzle");

export const getMigrationFileNames = async () => {
  const dirNames = await fs.readdir(basePath);

  const migrationFileNames = dirNames.map(async (dirName) => {
    const filePath = path.join(basePath, dirName, "test_seeds");

    const exists = await fs.access(filePath).then(() => true).catch(() => false);
    if (!exists) {
      return [];
    }
    const stat = await fs.stat(filePath);
    if (!stat.isDirectory()) {
      return [];
    }
    const subFileNames = await fs.readdir(filePath);

    return subFileNames
      .filter((subFileName) => subFileName.endsWith(".sql"))
      .map((subFileName) => path.join(filePath, subFileName));
  });

  const subFilesPaths = await Promise.all(migrationFileNames);

  return dirNames.map((dirName, index) => {
    return {
      name: dirName,
      path: path.join(basePath, dirName, "migration.sql"),
      filePaths: subFilesPaths[index] || [],
    };
  });
};


export function getMatrix(arr: number[]): (number | null)[][] {
  // Sonuç dizisi: İçinde sayılar veya null barındıran alt diziler tutar
  const result: (number | null)[][] = [];
  
  if (!arr || arr.length === 0) return result;

  // currentIndices tipini ve depth tipini belirtiyoruz
  function generateIndices(currentIndices: (number | null)[], depth: number): void {
    if (depth === arr.length) {
      result.push([...currentIndices]);
      return;
    }

    const limit: number = arr[depth] === 0 ? 1 : arr[depth]!;

    for (let i = 0; i < limit; i++) {
      // Değer sayı da olabilir, null da olabilir
      const value: number | null = arr[depth] === 0 ? null : i;
      
      currentIndices.push(value);
      generateIndices(currentIndices, depth + 1);
      currentIndices.pop();
    }
  }

  generateIndices([], 0);
  
  return result;
}