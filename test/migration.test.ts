import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { getMatrix, getMigrationFileNames } from "@test/helper";
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql/build/postgresql-container";
import { Client } from "pg";

import fs from "node:fs/promises";

describe("Migration Test", async () => {
  let container: StartedPostgreSqlContainer;
  let client: Client;

  const migrations = await getMigrationFileNames();
  const matrix = getMatrix(migrations.map((p) => p.filePaths.length));

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
        // await client.connect();
        await client.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
      });
      for (let i = 0; i < scenarioIndexArray.length; i++) {
        test(`MIGRATION ${i}`, async () => {
          const m = migrations[i]!;
          await client.query(await fs.readFile(m.path, "utf-8"));
          const filePathIndex = scenarioIndexArray[i];
          if (filePathIndex !== null) {
            const filePath = m.filePaths[filePathIndex!]!;
            await client.query(await fs.readFile(filePath, "utf-8"));
          }

          // const filePath = paths[i]!.filePaths[scenarioIndex];
        });
      }
    });
  }
});
