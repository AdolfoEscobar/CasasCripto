import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import Lead from "@/models/Lead";

// This route stores the leads generated from the landing page: early users,
// property owners/agents joining the waitlist, and prospective investors.
// The API call is initiated by the <ButtonLead /> component (Hero, Invest section).
// Duplicate emails just return 200 OK.
export async function POST(req) {
  await connectMongo();

  const body = await req.json();

  if (!body.email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const lead = await Lead.findOne({ email: body.email });

    if (!lead) {
      await Lead.create({ email: body.email, source: body.source });
    }

    return NextResponse.json({});
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
