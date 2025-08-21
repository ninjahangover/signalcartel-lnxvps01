import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        apiKeysVerified: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Admin and super_admin always have access
    const hasAccess = user.role === "admin" || 
                     user.role === "super_admin" ||
                     (user.subscriptionStatus === "active" && 
                      user.subscriptionTier !== "none" && 
                      (!user.subscriptionEndsAt || user.subscriptionEndsAt > new Date()));

    return NextResponse.json({
      hasAccess,
      user: {
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEndsAt: user.subscriptionEndsAt,
        apiKeysVerified: user.apiKeysVerified,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to check subscription" }, { status: 500 });
  }
}