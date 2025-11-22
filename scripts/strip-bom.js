#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs/promises');
const path = require('node:path');

const BOM_CODE_POINT = 0xfeff;
const rootDir = path.resolve(__dirname, '..');
const defaultTargets = [path.join(rootDir, 'node_modules', '.pnpm')];
const extraTargets = process.argv.slice(2).map((arg) => path.resolve(rootDir, arg));
const targets = [...defaultTargets, ...extraTargets];

let scanned = 0;
let cleaned = 0;

async function pathExists(candidate) {
  try {
    await fs.access(candidate);
    return true;
  } catch {
    return false;
  }
}

async function stripFileIfNeeded(filePath) {
  let contents;
  try {
    contents = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    console.warn(`skip read ${filePath}: ${error.message}`);
    return;
  }

  scanned += 1;
  if (!contents || contents.charCodeAt(0) !== BOM_CODE_POINT) {
    return;
  }

  try {
    await fs.writeFile(filePath, contents.slice(1), 'utf8');
    cleaned += 1;
    console.info(`Removed BOM from ${path.relative(rootDir, filePath)}`);
  } catch (error) {
    console.warn(`failed to strip ${filePath}: ${error.message}`);
  }
}

async function walk(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`skip dir ${dir}: ${error.message}`);
    }
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
    } else if (entry.isFile() && entry.name === 'package.json') {
      await stripFileIfNeeded(fullPath);
    }
  }
}

async function main() {
  for (const target of targets) {
    if (await pathExists(target)) {
      await walk(target);
    }
  }

  console.log(`BOM scan completed. Files scanned: ${scanned}. Files cleaned: ${cleaned}.`);
}

main().catch((error) => {
  console.error('strip-bom failed:', error);
  process.exitCode = 1;
});
