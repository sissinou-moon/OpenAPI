import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { connection, tableName, primaryKey, primaryKeyValue, column, newValue } = body;

        if (!connection || !tableName || !primaryKey || !primaryKeyValue || !column) {
            return NextResponse.json(
                { error: 'Missing required update parameters' },
                { status: 400 }
            );
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

                const query = `UPDATE ${tableName} SET ${column} = $1 WHERE ${primaryKey} = $2`;
                await pool.query(query, [newValue, primaryKeyValue]);
                await pool.end();

                return NextResponse.json({ success: true });
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

                const query = `UPDATE ${tableName} SET ?? = ? WHERE ?? = ?`;
                await conn.query(query, [column, newValue, primaryKey, primaryKeyValue]);
                await conn.end();

                return NextResponse.json({ success: true });
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
                const url = `${connection.projectUrl}/rest/v1/${tableName}?${primaryKey}=eq.${primaryKeyValue}`;

                const headers: Record<string, string> = {
                    apikey: connection.serviceRoleKey || connection.anonKey,
                    Authorization: `Bearer ${connection.serviceRoleKey || connection.anonKey}`,
                    'Content-Type': 'application/json',
                    Prefer: 'return=minimal',
                };

                const res = await fetch(url, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({ [column]: newValue }),
                });

                if (!res.ok) {
                    const errText = await res.text();
                    return NextResponse.json(
                        { error: `Supabase error: ${errText}` },
                        { status: 500 }
                    );
                }

                return NextResponse.json({ success: true });
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
                // For Firebase, primaryKeyValue is the document ID (key)
                // If the value is a boolean or primitive, we might need to handle it differently
                // but usually it's an object update
                const url = `${connection.databaseUrl}/${tableName}/${primaryKeyValue}/${column}.json?auth=${connection.apiKey}`;

                const res = await fetch(url, {
                    method: 'PUT',
                    body: JSON.stringify(newValue),
                });

                if (!res.ok) {
                    const errText = await res.text();
                    return NextResponse.json(
                        { error: `Firebase error: ${errText}` },
                        { status: 500 }
                    );
                }

                return NextResponse.json({ success: true });
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
