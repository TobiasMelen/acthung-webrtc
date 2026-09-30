import { globSync } from "node:fs";
import { runnerImport } from "vite";

for (const file of globSync("src/**/*.test.ts")) {
  await runnerImport(`./${file}`);
}
