import { OpenAPIGenerator } from '@asteasolutions/zod-to-openapi';
import { openApiDocument, registry } from './config';

// Import all schemas to register them
import './schemas';

/**
 * Generate the complete OpenAPI specification document
 */
export function generateOpenApiSpec() {
  const generator = new OpenAPIGenerator(registry.definitions, '3.1.0');
  return generator.generateDocument(openApiDocument);
}

/**
 * Get OpenAPI spec as JSON string
 */
export function getOpenApiSpecJson(): string {
  const spec = generateOpenApiSpec();
  return JSON.stringify(spec, null, 2);
}

/**
 * Get OpenAPI spec as YAML string (requires js-yaml)
 */
export async function getOpenApiSpecYaml(): Promise<string> {
  const yaml = await import('js-yaml');
  const spec = generateOpenApiSpec();
  return yaml.dump(spec);
}
