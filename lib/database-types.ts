// ─── Database YAML Schema Types ──────────────────────────────────────

export interface ColumnDef {
    type: string;
    primary_key?: boolean;
    nullable?: boolean;
    unique?: boolean;
    sensitive?: boolean;
    default?: any;
    description?: string;
    enum_name?: string;
}

export interface RelationDef {
    type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
    table: string;
    foreign_key: string;
}

export interface TableDef {
    description?: string;
    columns: Record<string, ColumnDef>;
    relations?: Record<string, RelationDef>;
}

export interface DatabaseMeta {
    name: string;
    engine: string;
    schema?: string;
}

export interface DatabaseSchema {
    database: DatabaseMeta;
    tables: Record<string, TableDef>;
}

// ─── Database Provider / Connection Types ────────────────────────────

export type DatabaseProvider = 'postgresql' | 'mysql' | 'supabase' | 'firebase';

export interface PostgresConnection {
    provider: 'postgresql';
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
}

export interface MySQLConnection {
    provider: 'mysql';
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
}

export interface SupabaseConnection {
    provider: 'supabase';
    projectUrl: string;
    anonKey: string;
    serviceRoleKey: string;
}

export interface FirebaseConnection {
    provider: 'firebase';
    projectId: string;
    apiKey: string;
    databaseUrl: string;
}

export type ConnectionConfig =
    | PostgresConnection
    | MySQLConnection
    | SupabaseConnection
    | FirebaseConnection;

// ─── Query Result Types ──────────────────────────────────────────────

export interface QueryResult {
    columns: string[];
    rows: Record<string, any>[];
    totalCount: number;
    page: number;
    pageSize: number;
}

export interface ProviderInfo {
    id: DatabaseProvider;
    name: string;
    icon: string;
    description: string;
    color: string;
}

export const DATABASE_PROVIDERS: ProviderInfo[] = [
    {
        id: 'postgresql',
        name: 'PostgreSQL',
        icon: '🐘',
        description: 'Advanced open-source relational database',
        color: '#336791',
    },
    {
        id: 'mysql',
        name: 'MySQL',
        icon: '🐬',
        description: 'Popular open-source relational database',
        color: '#00758F',
    },
    {
        id: 'supabase',
        name: 'Supabase',
        icon: '⚡',
        description: 'Open-source Firebase alternative with Postgres',
        color: '#3ECF8E',
    },
    {
        id: 'firebase',
        name: 'Firebase',
        icon: '🔥',
        description: 'Google\'s real-time NoSQL cloud database',
        color: '#FFCA28',
    },
];
