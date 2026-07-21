import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { getMatrix, getErrorMatrix, getMigrationFileNames } from "@test/helper";
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql/build/postgresql-container";
import { Client } from "pg";
import path from "node:path";
import fs from "node:fs/promises";

describe("Migration Test", async () => {
  let container: StartedPostgreSqlContainer;
  let client: Client;

  const migrations = await getMigrationFileNames();
  const matrix = getMatrix(migrations.map((p) => p.testSeeds.length));
  const errorMatrix = getErrorMatrix(migrations.map((p) => p.testErrors.length));

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:16-alpine")
      .withDatabase("test_db")
      .withUsername("test_user")
      .withPassword("test_password")
      .withReuse()
      .start();

    client = new Client({
      connectionString: container.getConnectionUri(),
    });
    await client.connect();
  });
  afterAll(async () => {
    await client.end();
    await container.stop();
  });

  for (let scenarioIndex = 0; scenarioIndex < matrix.length; scenarioIndex++) {
    const scenarioIndexArray = matrix[scenarioIndex]!;
    describe(`Scenario ${scenarioIndex}`, () => {
      beforeAll(async () => {
        await client.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
      });
      for (let i = 0; i < scenarioIndexArray.length; i++) {
        test(`MIGRATION ${i}`, async () => {
          const m = migrations[i]!;
          await client.query(await fs.readFile(m.path, "utf-8"));
          const filePathIndex = scenarioIndexArray[i];
          if (filePathIndex !== null) {
            const filePath = m.testSeeds[filePathIndex!]!;
            await client.query(await fs.readFile(filePath, "utf-8"));
          }
        });
      }
    });
  }

  for (let errorIdx = 0; errorIdx < errorMatrix.length; errorIdx++) {
    const scenario = errorMatrix[errorIdx]!;
    const errorMigration = migrations[scenario.migrationIndex]!;
    const errorFilePath = errorMigration.testErrors[scenario.errorFileIndex]!;
    const errorFileName = path.basename(errorFilePath, ".sql");

    describe(`Error Scenario: ${errorMigration.name}/${errorFileName}`, () => {
      beforeAll(async () => {
        await client.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
      });

      for (let i = 0; i <= scenario.migrationIndex; i++) {
        if (i < scenario.migrationIndex) {
          test(`MIGRATION ${i}`, async () => {
            const m = migrations[i]!;
            await client.query(await fs.readFile(m.path, "utf-8"));
            if (m.testSeeds.length > 0) {
              await client.query(await fs.readFile(m.testSeeds[0]!, "utf-8"));
            }
          });
        } else {
          test(`MIGRATION ${i} + ERROR: ${errorFileName}`, async () => {
            const m = migrations[i]!;
            await client.query(await fs.readFile(m.path, "utf-8"));
            await expect(
              client.query(await fs.readFile(errorFilePath, "utf-8"))
            ).rejects.toThrow();
          });
        }
      }
    });
  }
});
