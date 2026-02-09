import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: "Missing email or password" },
                { status: 403 }
            );
        }

        // Mock success response
        return NextResponse.json({
            success: true,
            message: "User Created Successfully!",
            data: {
                refresh_token: "mock_refresh_token_" + Math.random().toString(36).substring(7),
                access_token: "mock_access_token_" + Math.random().toString(36).substring(7),
                user: {
                    email,
                    id: "user_" + Math.random().toString(36).substring(7),
                    created_at: new Date().toISOString()
                }
            }
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
