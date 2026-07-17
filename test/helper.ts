import path from "node:path";
import fs from "node:fs/promises";

const basePath = path.join(__dirname, "..", "src", "drizzle");

export const getMirationFileNames = async () => {
  const dirNames = await fs.readdir(basePath);

  const migrationFileNames = dirNames.map(async (dirName) => {
    const filePath = path.join(basePath, dirName, "test_seeds");
    const exists = await fs.exists(filePath);
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
      filePaths: subFilesPaths[index],
    };
  });
};

