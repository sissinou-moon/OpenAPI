
import yaml from 'js-yaml';
import { OpenAPISpec } from './openapi';

export function parseOpenABI(content: string): OpenAPISpec | null {
    try {
        // Try parsing as JSON first
        try {
            return JSON.parse(content) as OpenAPISpec;
        } catch {
            // If not JSON, try YAML
            return yaml.load(content) as OpenAPISpec;
        }
    } catch (e) {
        console.error("Failed to parse OpenAPI spec:", e);
        return null;
    }
}
