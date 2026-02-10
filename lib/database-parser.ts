import yaml from 'js-yaml';
import { DatabaseSchema } from './database-types';

export function parseDatabaseYaml(content: string): DatabaseSchema | null {
    try {
        const parsed = yaml.load(content) as any;

        if (!parsed || !parsed.database || !parsed.tables) {
            return null;
        }

        return parsed as DatabaseSchema;
    } catch {
        return null;
    }
}
