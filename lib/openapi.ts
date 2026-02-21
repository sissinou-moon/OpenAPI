
export interface OpenAPISpec {
    openapi: string;
    info: {
        title: string;
        description: string;
        version: string;
    };
    servers: { url: string; description?: string }[];
    tags?: { name: string; description?: string }[];
    paths: Record<string, PathItem>;
    components?: {
        schemas?: Record<string, Schema>;
        securitySchemes?: Record<string, any>;
    };
    errors?: Record<string, { description: string }>;
}

export type Method = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';

export interface PathItem {
    summary?: string;
    description?: string;
    servers?: { url: string; description?: string }[];
    parameters?: Parameter[];
    get?: Operation;
    put?: Operation;
    post?: Operation;
    delete?: Operation;
    options?: Operation;
    head?: Operation;
    patch?: Operation;
    trace?: Operation;
    [key: string]: any;
}

export interface Operation {
    tags?: string[];
    summary?: string;
    description?: string;
    externalDocs?: { description?: string; url: string };
    operationId?: string;
    parameters?: Parameter[];
    requestBody?: RequestBody;
    responses: Record<string, Response>;
    deprecated?: boolean;
    security?: Record<string, string[]>[];
    servers?: { url: string; description?: string }[];
}

export interface Parameter {
    name: string;
    in: 'query' | 'header' | 'path' | 'cookie';
    description?: string;
    required?: boolean;
    deprecated?: boolean;
    allowEmptyValue?: boolean;
    style?: string;
    explode?: boolean;
    allowReserved?: boolean;
    schema?: Schema;
    example?: any;
    examples?: Record<string, any>;
}

export interface RequestBody {
    description?: string;
    content: {
        [contentType: string]: MediaType;
    };
    required?: boolean;
}

export interface MediaType {
    schema?: Schema;
    example?: any;
    examples?: Record<string, any>;
    encoding?: Record<string, any>;
}

export interface Schema {
    type?: string;
    properties?: Record<string, Schema>;
    items?: Schema;
    required?: string[];
    description?: string;
    example?: any;
    enum?: any[];
    format?: string;
    $ref?: string;
    default?: any;
    nullable?: boolean;
    readOnly?: boolean;
    writeOnly?: boolean;
    xml?: any;
    externalDocs?: any;
    discriminator?: any;
    allOf?: Schema[];
    oneOf?: Schema[];
    anyOf?: Schema[];
    not?: Schema;
}

export interface Response {
    description: string;
    headers?: Record<string, any>;
    content?: {
        [contentType: string]: MediaType;
    };
    links?: Record<string, any>;
}

export interface BodyRow {
    key: string;
    value: string;
    type: 'string' | 'number' | 'boolean' | 'json';
    enabled: boolean;
}
