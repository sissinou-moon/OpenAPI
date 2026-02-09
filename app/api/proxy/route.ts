import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { url, method, headers, body } = await request.json();

        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.json().catch(() => null);

        return NextResponse.json({
            status: response.status,
            statusText: response.statusText,
            body: data,
        });
    } catch (error) {
        return NextResponse.json({
            status: 0,
            statusText: 'Proxy Error',
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
