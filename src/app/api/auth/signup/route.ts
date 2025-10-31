import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * User signup endpoint using Supabase Auth
 * This properly leverages Supabase's built-in authentication system
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Use Supabase Auth to create user
    const { data, error } = await supabaseServer.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || null,
        },
      },
    });

    if (error) {
      console.error("Supabase signup error:", error);
      
      // Handle specific error cases
      if (error.message.includes("already registered")) {
        return NextResponse.json(
          { error: "User already exists" },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: error.message || "Failed to create user" },
        { status: 500 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Create entry in custom users table with additional data
    const { error: dbError } = await supabaseServer
      .from('users')
      .insert({
        id: data.user.id,
        name: name || null,
        email: data.user.email,
        email_verified: null,
        password: '', // Managed by Supabase Auth
        image: null,
      });

    if (dbError) {
      console.error("Error creating user profile:", dbError);
      // User is created in auth but profile failed - still return success
      // The profile will be created on first login
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: data.user.id,
          email: data.user.email,
          name: name,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected signup error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
