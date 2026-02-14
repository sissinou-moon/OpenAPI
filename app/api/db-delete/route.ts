import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { connection, tableName, primaryKey, primaryKeyValues } = body;

        if (!connection || !tableName || !primaryKey || !primaryKeyValues || !Array.isArray(primaryKeyValues)) {
            return NextResponse.json(
                { error: 'Missing required deletion parameters' },
                { status: 400 }
            );
        }

        if (primaryKeyValues.length === 0) {
            return NextResponse.json({ success: true, deletedCount: 0 });
        }

        const provider = connection.provider;

        // ── PostgreSQL ──────────────────────────────────────────────
        if (provider === 'postgresql') {
            try {
                const { Pool } = await import('pg');
                const pool = new Pool({
                    host: connection.host,
                    port: connection.port,
                    database: connection.database,
                    user: connection.username,
                    password: connection.password,
                    ssl: connection.ssl ? { rejectUnauthorized: false } : false,
                    max: 1,
                    connectionTimeoutMillis: 5000,
                });

                const placeholders = primaryKeyValues.map((_, i) => `$${i + 1}`).join(', ');
                const query = `DELETE FROM ${tableName} WHERE ${primaryKey} IN (${placeholders})`;
                const result = await pool.query(query, primaryKeyValues);
                await pool.end();

                return NextResponse.json({ success: true, deletedCount: result.rowCount });
            } catch (err: any) {
                return NextResponse.json(
                    { error: `PostgreSQL error: ${err.message}` },
                    { status: 500 }
                );
            }
        }

        // ── MySQL ───────────────────────────────────────────────────
        if (provider === 'mysql') {
            try {
                const mysql = await import('mysql2/promise');
                const conn = await mysql.createConnection({
                    host: connection.host,
                    port: connection.port,
                    database: connection.database,
                    user: connection.username,
                    password: connection.password,
                    ssl: connection.ssl ? {} : undefined,
                    connectTimeout: 5000,
                });

                const query = `DELETE FROM ${tableName} WHERE ${primaryKey} IN (?)`;
                const [result] = await conn.query(query, [primaryKeyValues]);
                await conn.end();

                return NextResponse.json({ success: true, deletedCount: (result as any).affectedRows });
            } catch (err: any) {
                return NextResponse.json(
                    { error: `MySQL error: ${err.message}` },
                    { status: 500 }
                );
            }
        }

        // ── Supabase ──────────────────────────────────────────────
        if (provider === 'supabase') {
            try {
                const url = `${connection.projectUrl}/rest/v1/${tableName}?${primaryKey}=in.(${primaryKeyValues.map(v => typeof v === 'string' ? `"${v}"` : v).join(',')})`;

                const headers: Record<string, string> = {
                    apikey: connection.serviceRoleKey || connection.anonKey,
                    Authorization: `Bearer ${connection.serviceRoleKey || connection.anonKey}`,
                    'Content-Type': 'application/json',
                    Prefer: 'return=representation',
                };

                const res = await fetch(url, {
                    method: 'DELETE',
                    headers,
                });

                if (!res.ok) {
                    const errText = await res.text();
                    return NextResponse.json(
                        { error: `Supabase error: ${errText}` },
                        { status: 500 }
                    );
                }

                const data = await res.json();
                return NextResponse.json({ success: true, deletedCount: data.length });
            } catch (err: any) {
                return NextResponse.json(
                    { error: `Supabase error: ${err.message}` },
                    { status: 500 }
                );
            }
        }

        // ── Firebase ─────────────────────────────────────────────
        if (provider === 'firebase') {
            try {
                for (const id of primaryKeyValues) {
                    const url = `${connection.databaseUrl}/${tableName}/${id}.json?auth=${connection.apiKey}`;
                    await fetch(url, { method: 'DELETE' });
                }
                return NextResponse.json({ success: true, deletedCount: primaryKeyValues.length });
            } catch (err: any) {
                return NextResponse.json(
                    { error: `Firebase error: ${err.message}` },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json(
            { error: `Unsupported provider: ${provider}` },
            { status: 400 }
        );
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
