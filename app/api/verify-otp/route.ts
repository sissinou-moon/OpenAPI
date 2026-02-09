import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, user_id, otp } = body;

        if (!email || !user_id || !otp) {
            return NextResponse.json({ message: "Missing data" }, { status: 403 });
        }

        if (otp === "000000") {
            return NextResponse.json({ message: "OTP expired or verification failed" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "OTP verified successfully"
        });
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
