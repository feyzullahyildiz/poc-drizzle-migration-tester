import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { getMirationFileNames } from "@test/helper";
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql/build/postgresql-container";

describe("Migration Test", async () => {
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    console.log("beforeAll before postgresql");
    container = await new PostgreSqlContainer("postgres:16-alpine")
      .withDatabase("test_db")
      .withUsername("test_user")
      .withPassword("test_password")
      .withReuse()
      .start();
    console.log("beforeAll after postgresql");
  });
  afterAll(async () => {
    console.log("afterAll before postgresql");
    await container.stop();
    console.log("afterAll after postgresql");
  });

  describe("migrations", async () => {
    const paths = await getMirationFileNames();
    // console.log("paths", paths);

    test("2 + 2", () => {
      expect(2 + 2).toBe(4);
    });
  });

  test("2 + 2", () => {
    expect(2 + 2).toBe(4);
  });
});
