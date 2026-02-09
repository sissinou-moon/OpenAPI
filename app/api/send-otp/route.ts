import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, user_id } = body;

        if (!email || !user_id) {
            return NextResponse.json({ message: "Missing data" }, { status: 403 });
        }

        return NextResponse.json({
            success: true,
            message: "OTP sent successfully"
        });
    } catch (error) {
        return NextResponse.json({ message: "Failed to send OTP" }, { status: 500 });
    }
}
