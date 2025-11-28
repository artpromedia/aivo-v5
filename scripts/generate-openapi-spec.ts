#!/usr/bin/env tsx
/**
 * Generate static OpenAPI specification file
 * 
 * This script generates the OpenAPI spec without needing the server running.
 * Used by CI to validate the spec.
 * 
 * Run: pnpm tsx scripts/generate-openapi-spec.ts
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';

// Dynamic import to handle the OpenAPI generation
async function main() {
  const ROOT_DIR = resolve(dirname(import.meta.url.replace('file://', '')), '..');
  const OUTPUT_FILE = resolve(ROOT_DIR, 'openapi.json');
  
  console.log('🔧 Generating OpenAPI specification...');
  
  try {
    // Import the generate function
    const { generateOpenApiSpec } = await import('../apps/web/lib/openapi/generate');
    
    const spec = generateOpenApiSpec();
    
    writeFileSync(OUTPUT_FILE, JSON.stringify(spec, null, 2));
    
    console.log(`✅ OpenAPI spec written to ${OUTPUT_FILE}`);
    console.log(`   - Title: ${spec.info.title}`);
    console.log(`   - Version: ${spec.info.version}`);
    console.log(`   - Paths: ${Object.keys(spec.paths || {}).length}`);
    console.log(`   - Schemas: ${Object.keys(spec.components?.schemas || {}).length}`);
  } catch (error) {
    console.error('❌ Failed to generate OpenAPI spec:', error);
    process.exit(1);
  }
}

main();
