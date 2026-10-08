import { DataSource } from "typeorm";
import { entities } from "../entities/index.js";

export const AppDataSource = new DataSource({
  type: "better-sqlite3",
  database: "database.sqlite",
  synchronize: true,
  logging: false,
  entities,
});

export async function dbConnection() {
  try {
    const conn = await AppDataSource.initialize();
    console.log("database is connected", conn.options.database);
  } catch (error) {
    console.log("database connected failed", error);
  }
}
