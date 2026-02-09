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

        // Mock check
        if (email === "notfound@example.com") {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        if (password === "wrong") {
            return NextResponse.json({ message: "Invalid password" }, { status: 405 });
        }

        return NextResponse.json({
            success: true,
            message: "Login successful",
            data: {
                refresh_token: "mock_refresh_token",
                access_token: "mock_access_token"
            }
        });
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
