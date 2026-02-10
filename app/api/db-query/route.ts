import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { connection, query, page = 1, pageSize = 50 } = body;

        if (!connection || !query) {
            return NextResponse.json(
                { error: 'Missing connection or query' },
                { status: 400 }
            );
        }

        const offset = (page - 1) * pageSize;
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
                    max: 3,
                    connectionTimeoutMillis: 5000,
                });

                // Get total count
                const tableName = query.replace(/^SELECT \* FROM /i, '').trim();
                const countRes = await pool.query(
                    `SELECT COUNT(*) as total FROM ${tableName}`
                );
                const totalCount = parseInt(countRes.rows[0].total);

                // Get rows
                const result = await pool.query(
                    `${query} LIMIT $1 OFFSET $2`,
                    [pageSize, offset]
                );

                await pool.end();

                return NextResponse.json({
                    columns: result.fields.map((f: any) => f.name),
                    rows: result.rows,
                    totalCount,
                    page,
                    pageSize,
                });
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

                const tableName = query.replace(/^SELECT \* FROM /i, '').trim();
                const [countRows] = await conn.query(
                    `SELECT COUNT(*) as total FROM ${tableName}`
                );
                const totalCount = (countRows as any)[0].total;

                const [rows, fields] = await conn.query(
                    `${query} LIMIT ? OFFSET ?`,
                    [pageSize, offset]
                );

                await conn.end();

                return NextResponse.json({
                    columns: (fields as any[]).map((f: any) => f.name),
                    rows,
                    totalCount,
                    page,
                    pageSize,
                });
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
                const tableName = query.replace(/^SELECT \* FROM /i, '').trim();
                const url = `${connection.projectUrl}/rest/v1/${tableName}?select=*&limit=${pageSize}&offset=${offset}`;

                const headers: Record<string, string> = {
                    apikey: connection.serviceRoleKey || connection.anonKey,
                    Authorization: `Bearer ${connection.serviceRoleKey || connection.anonKey}`,
                    'Content-Type': 'application/json',
                    Prefer: 'count=exact',
                };

                const res = await fetch(url, { headers });

                if (!res.ok) {
                    const errText = await res.text();
                    return NextResponse.json(
                        { error: `Supabase error: ${errText}` },
                        { status: 500 }
                    );
                }

                const rows = await res.json();
                const contentRange = res.headers.get('content-range');
                const totalCount = contentRange
                    ? parseInt(contentRange.split('/')[1] || '0')
                    : rows.length;

                const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

                return NextResponse.json({
                    columns,
                    rows,
                    totalCount,
                    page,
                    pageSize,
                });
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
                const collection = query.replace(/^SELECT \* FROM /i, '').trim();
                const url = `${connection.databaseUrl}/${collection}.json?auth=${connection.apiKey}&orderBy="$key"&limitToFirst=${pageSize}`;

                const res = await fetch(url);

                if (!res.ok) {
                    const errText = await res.text();
                    return NextResponse.json(
                        { error: `Firebase error: ${errText}` },
                        { status: 500 }
                    );
                }

                const data = await res.json();
                const entries = data ? Object.entries(data) : [];
                const rows = entries.map(([id, val]: [string, any]) => ({
                    _id: id,
                    ...(typeof val === 'object' && val !== null ? val : { value: val }),
                }));

                const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

                return NextResponse.json({
                    columns,
                    rows,
                    totalCount: rows.length,
                    page: 1,
                    pageSize,
                });
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
