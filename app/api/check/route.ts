import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { refresh_token } = body;

        if (!refresh_token) {
            return NextResponse.json({ message: "Missing refresh token" }, { status: 403 });
        }

        if (refresh_token === "invalid") {
            return NextResponse.json({ message: "Refresh token is invalid or expired" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Refresh token is valid"
        });
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
