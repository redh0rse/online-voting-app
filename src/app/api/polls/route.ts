import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { dbConnect } from "@/lib/db";
import Poll from "@/models/Poll";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET all polls or filter by query params
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const isActive = url.searchParams.get("active");
    
    await dbConnect();
    
    let query = {};
    
    // Filter for active polls if specified
    if (isActive === "true") {
      query = { 
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() }
      };
    }
    
    const polls = await Poll.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json({ polls }, { status: 200 });
  } catch (error) {
    console.error("Error fetching polls:", error);
    return NextResponse.json(
      { error: "Failed to fetch polls" },
      { status: 500 }
    );
  }
}

// POST to create a new poll
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is an admin
    if (!session || !session.user || (session.user as any).role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Only admins can create polls" },
        { status: 403 }
      );
    }
    
    // Parse the request body
    const body = await req.json();
    const { title, description, startDate, endDate, candidates } = body;
    
    // Validate required fields
    if (!title || !description || !startDate || !endDate || !candidates || candidates.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // Create the poll
    const poll = await Poll.create({
      title,
      description,
      startDate,
      endDate,
      candidates,
      createdBy: (session.user as any).id
    });
    
    return NextResponse.json({ poll }, { status: 201 });
  } catch (error) {
    console.error("Error creating poll:", error);
    return NextResponse.json(
      { error: "Failed to create poll" },
      { status: 500 }
    );
  }
} 