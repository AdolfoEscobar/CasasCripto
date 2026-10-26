import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

// Prevent caching
export const dynamic = "force-dynamic";

// GET /api/admin/users/[id]
export async function GET(req, { params }) {
  try {
    console.log("🔍 Fetching user...");
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
      console.log("❌ Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Next.js 16: `params` es una Promise en route handlers dinámicos.
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    await connectMongo();
    console.log("📡 MongoDB connected");

    const user = await User.findById(id)
      .select("name email role createdAt lastLogin")
      .lean();

    if (!user) {
      console.log("❌ User not found:", id);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("✅ User found:", user._id);
    return NextResponse.json(user);
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    return NextResponse.json({ error: "Error fetching user" }, { status: 500 });
  }
}

// PUT /api/admin/users/[id]
export async function PUT(req, { params }) {
  try {
    console.log("📝 Updating user...");
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
      console.log("❌ Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Next.js 16: `params` es una Promise en route handlers dinámicos.
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, role } = body;

    // Basic validations
    if (!name) {
      console.log("❌ Missing required fields");
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Validate role
    const validRoles = ["user", "admin", "editor", "moderator"];
    if (role && !validRoles.includes(role)) {
      console.log("❌ Invalid role:", role);
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    await connectMongo();
    console.log("📡 MongoDB connected");

    const user = await User.findById(id);
    if (!user) {
      console.log("❌ User not found:", id);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user
    user.name = name;
    if (role) user.role = role;
    await user.save();

    console.log("✅ User updated successfully:", user._id);
    return NextResponse.json(user);
  } catch (error) {
    console.error("❌ Error updating user:", error);
    return NextResponse.json({ error: "Error updating user" }, { status: 500 });
  }
}
