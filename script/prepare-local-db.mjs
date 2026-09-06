import { constants } from "node:fs";
import { access, copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repositoryRoot = process.cwd();
const seedPath = path.join(repositoryRoot, "data.db");
const localDirectory = path.join(repositoryRoot, ".local");
const localPath = path.join(localDirectory, "data.db");

await mkdir(localDirectory, { recursive: true });

try {
  await access(localPath, constants.F_OK);
} catch {
  await copyFile(seedPath, localPath, constants.COPYFILE_EXCL);
  console.log("Initialized .local/data.db from the tracked seed database.");
}
