import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, device_name, os, user_id, ip } = body;

        if (!email || !device_name || !os || !user_id || !ip) {
            return NextResponse.json({ message: "Missing required data" }, { status: 403 });
        }

        return NextResponse.json({
            success: true,
            message: "Device session set or updated successfully"
        });
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
