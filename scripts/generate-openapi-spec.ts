#!/usr/bin/env tsx
/**
 * Generate OpenAPI Specification
 *
 * This script fetches the OpenAPI spec from the running API Gateway server
 * and saves it to a JSON file for documentation and validation purposes.
 *
 * Usage:
 *   1. Start the API Gateway: pnpm --filter @aivo/api-gateway dev
 *   2. Run this script: pnpm tsx scripts/generate-openapi-spec.ts
 *
 * Or use the npm script: pnpm generate:openapi
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_URL = process.env.API_URL || 'http://localhost:4000';
const ROOT_DIR = resolve(__dirname, '..');
const OUTPUT_FILE = resolve(ROOT_DIR, 'openapi.json');
const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(): Promise<boolean> {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await fetch(`${API_URL}/docs/json`);
      if (response.ok) {
        return true;
      }
    } catch {
      // Server not ready yet
    }
    console.log(`Waiting for server... (attempt ${i + 1}/${MAX_RETRIES})`);
    await sleep(RETRY_DELAY_MS);
  }
  return false;
}

async function fetchOpenApiSpec(): Promise<Record<string, unknown>> {
  const response = await fetch(`${API_URL}/docs/json`);

  if (!response.ok) {
    throw new Error(`Failed to fetch OpenAPI spec: ${response.status} ${response.statusText}`);
  }

  const spec = (await response.json()) as Record<string, unknown>;
  return spec;
}

function validateSpec(spec: Record<string, unknown>): void {
  if (!spec.openapi) {
    throw new Error("Invalid OpenAPI spec: missing 'openapi' field");
  }

  if (!spec.info) {
    throw new Error("Invalid OpenAPI spec: missing 'info' field");
  }

  if (!spec.paths) {
    throw new Error("Invalid OpenAPI spec: missing 'paths' field");
  }

  const pathCount = Object.keys(spec.paths as object).length;
  console.log(`✓ Valid OpenAPI ${spec.openapi} spec with ${pathCount} paths`);
}

async function main() {
  console.log('🔧 Generating OpenAPI specification...');
  console.log(`   URL: ${API_URL}/docs/json`);
  console.log(`   Output: ${OUTPUT_FILE}`);
  console.log('');

  // Wait for server to be ready
  const serverReady = await waitForServer();
  if (!serverReady) {
    console.error('❌ Server did not become ready in time');
    console.error('   Make sure the API Gateway is running: pnpm --filter @aivo/api-gateway dev');
    process.exit(1);
  }

  try {
    // Fetch the spec
    const spec = await fetchOpenApiSpec();

    // Validate it
    validateSpec(spec);

    // Write to file
    const specJson = JSON.stringify(spec, null, 2);
    writeFileSync(OUTPUT_FILE, specJson, 'utf-8');

    console.log('');
    console.log(`✅ OpenAPI spec written to ${OUTPUT_FILE}`);
    console.log(`   File size: ${(specJson.length / 1024).toFixed(2)} KB`);

    // Print summary
    const info = spec.info as { title: string; version: string };
    const paths = spec.paths as Record<string, unknown>;
    const tags = (spec.tags as Array<{ name: string }>) || [];
    const schemas =
      ((spec.components as Record<string, unknown>)?.schemas as Record<string, unknown>) || {};

    console.log('');
    console.log('📋 Spec Summary:');
    console.log(`   - Title: ${info.title}`);
    console.log(`   - Version: ${info.version}`);
    console.log(`   - Paths: ${Object.keys(paths).length}`);
    console.log(`   - Tags: ${tags.length}`);
    console.log(`   - Schemas: ${Object.keys(schemas).length}`);
  } catch (error) {
    console.error('❌ Failed to generate OpenAPI spec:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
