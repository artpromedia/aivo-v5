#!/usr/bin/env tsx
/**
 * Generate TypeScript API Client from OpenAPI Specification
 * 
 * This script generates type-safe API clients from the OpenAPI spec.
 * Run: pnpm tsx scripts/generate-api-client.ts
 * 
 * Requirements:
 * - @openapitools/openapi-generator-cli (global or local)
 * - Or use openapi-typescript for types only
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';

const ROOT_DIR = resolve(dirname(import.meta.url.replace('file://', '')), '..');
const SPEC_URL = process.env.OPENAPI_SPEC_URL || 'http://localhost:3000/api/openapi.json';
const OUTPUT_DIR = resolve(ROOT_DIR, 'packages/api-client/src/generated');
const SPEC_FILE = resolve(ROOT_DIR, 'openapi.json');

interface GeneratorConfig {
  generator: 'typescript-fetch' | 'typescript-axios' | 'openapi-typescript';
  outputDir: string;
  additionalProperties?: Record<string, string>;
}

const config: GeneratorConfig = {
  generator: 'typescript-fetch',
  outputDir: OUTPUT_DIR,
  additionalProperties: {
    supportsES6: 'true',
    typescriptThreePlus: 'true',
    useSingleRequestParameter: 'true',
    withInterfaces: 'true',
  },
};

async function fetchSpec(): Promise<object> {
  console.log(`📥 Fetching OpenAPI spec from ${SPEC_URL}...`);
  
  try {
    const response = await fetch(SPEC_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch spec: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Failed to fetch spec from URL. Trying local file...');
    
    if (existsSync(SPEC_FILE)) {
      const content = readFileSync(SPEC_FILE, 'utf-8');
      return JSON.parse(content);
    }
    
    throw new Error('No OpenAPI spec available. Start the server or provide openapi.json');
  }
}

function saveSpec(spec: object): void {
  writeFileSync(SPEC_FILE, JSON.stringify(spec, null, 2));
  console.log(`💾 Saved spec to ${SPEC_FILE}`);
}

function ensureOutputDir(): void {
  if (!existsSync(config.outputDir)) {
    mkdirSync(config.outputDir, { recursive: true });
    console.log(`📁 Created output directory: ${config.outputDir}`);
  }
}

function generateWithOpenApiGenerator(): void {
  console.log('🔧 Generating client with OpenAPI Generator...');
  
  const additionalProps = Object.entries(config.additionalProperties || {})
    .map(([key, value]) => `${key}=${value}`)
    .join(',');
  
  const command = [
    'npx @openapitools/openapi-generator-cli generate',
    `-i ${SPEC_FILE}`,
    `-g ${config.generator}`,
    `-o ${config.outputDir}`,
    additionalProps ? `--additional-properties=${additionalProps}` : '',
    '--skip-validate-spec',
  ].filter(Boolean).join(' ');
  
  try {
    execSync(command, { stdio: 'inherit' });
    console.log('✅ Client generated successfully!');
  } catch (error) {
    console.error('❌ OpenAPI Generator failed. Trying openapi-typescript...');
    generateWithOpenApiTypescript();
  }
}

function generateWithOpenApiTypescript(): void {
  console.log('🔧 Generating types with openapi-typescript...');
  
  const typesFile = resolve(config.outputDir, 'types.ts');
  
  try {
    execSync(
      `npx openapi-typescript ${SPEC_FILE} -o ${typesFile}`,
      { stdio: 'inherit' }
    );
    
    // Generate a simple fetch client wrapper
    const clientCode = generateSimpleFetchClient();
    writeFileSync(resolve(config.outputDir, 'client.ts'), clientCode);
    
    // Generate index file
    const indexCode = `export * from './types';
export * from './client';
`;
    writeFileSync(resolve(config.outputDir, 'index.ts'), indexCode);
    
    console.log('✅ Types and client generated successfully!');
  } catch (error) {
    throw new Error(`Failed to generate types: ${error}`);
  }
}

function generateSimpleFetchClient(): string {
  return `import type { paths } from './types';

type PathKeys = keyof paths;
type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

interface ClientConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
}

interface RequestOptions {
  params?: Record<string, string | number | boolean>;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private config: ClientConfig;

  constructor(config: ClientConfig) {
    this.config = config;
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean>): string {
    let url = \`\${this.config.baseUrl}\${path}\`;
    
    if (params) {
      // Replace path parameters
      Object.entries(params).forEach(([key, value]) => {
        url = url.replace(\`{\${key}}\`, String(value));
      });
      
      // Add query parameters
      const queryParams = Object.entries(params)
        .filter(([key]) => !url.includes(\`{\${key}}\`))
        .map(([key, value]) => \`\${key}=\${encodeURIComponent(String(value))}\`)
        .join('&');
      
      if (queryParams) {
        url += \`?\${queryParams}\`;
      }
    }
    
    return url;
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    options?: RequestOptions
  ): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    
    const response = await fetch(url, {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        ...options?.headers,
      },
      credentials: this.config.credentials,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || \`HTTP \${response.status}\`);
    }
    
    return response.json();
  }

  get<T>(path: string, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return this.request<T>('get', path, options);
  }

  post<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('post', path, options);
  }

  put<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('put', path, options);
  }

  patch<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('patch', path, options);
  }

  delete<T>(path: string, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return this.request<T>('delete', path, options);
  }
}

export function createApiClient(config: ClientConfig): ApiClient {
  return new ApiClient(config);
}

export type { ClientConfig, RequestOptions };
`;
}

async function main(): Promise<void> {
  console.log('🚀 Starting API client generation...\n');
  
  try {
    // Fetch and save spec
    const spec = await fetchSpec();
    saveSpec(spec);
    
    // Ensure output directory exists
    ensureOutputDir();
    
    // Generate client
    generateWithOpenApiGenerator();
    
    console.log('\n✨ API client generation complete!');
    console.log(`📂 Output: ${config.outputDir}`);
  } catch (error) {
    console.error('\n❌ Generation failed:', error);
    process.exit(1);
  }
}

main();
