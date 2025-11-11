import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongoDB/mongoDB";
import { guid } from "@/lib/Utils";
import { ObjectId } from "mongodb";

// Sanitize string input to prevent XSS
function sanitizeString(str: string): string {
  if (typeof str !== "string") return str;
  return str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// Recursively sanitize objects and arrays
function sanitizeInput(input: any): any {
  if (typeof input === "string") {
    return sanitizeString(input);
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (input && typeof input === "object") {
    const sanitized: any = {};
    for (const key in input) {
      sanitized[key] = sanitizeInput(input[key]);
    }
    return sanitized;
  }
  return input;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Sanitize all string inputs to prevent XSS
    const sanitizedBody = sanitizeInput(body);
    
    const {
      jobTitle,
      description,
      questions,
      lastEditedBy,
      createdBy,
      screeningSetting,
      orgID,
      requireVideo,
      location,
      workSetup,
      workSetupRemarks,
      status,
      salaryNegotiable,
      minimumSalary,
      maximumSalary,
      country,
      province,
      employmentType,
      cvSecretPrompt,
      aiInterviewSecretPrompt,
      preScreeningQuestions,
      teamMembers,
    } = sanitizedBody;
    
    // Validate required fields
    if (!jobTitle || !description || !questions || !workSetup) {
      return NextResponse.json(
        {
          error:
            "Job title, description, questions and work setup are required",
        },
        { status: 400 }
      );
    }
    
    // Additional validation for data types
    if (typeof jobTitle !== "string" || jobTitle.length > 200) {
      return NextResponse.json(
        { error: "Invalid job title" },
        { status: 400 }
      );
    }
    
    if (typeof description !== "string" || description.length > 10000) {
      return NextResponse.json(
        { error: "Invalid job description" },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { error: "Invalid questions format" },
        { status: 400 }
      );
    }
    
    // Validate status is from allowed values
    const allowedStatuses = ["active", "draft", "closed"];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const { db } = await connectMongoDB();
    
    // Match orgID - try ObjectId first, fallback to string
    let query: { _id: any };
    try {
      query = { _id: new ObjectId(String(orgID)) };
    } catch (e) {
      query = { _id: orgID };
    }
    
    const orgDetails = await db.collection("organizations").aggregate([
      {
        $match: query
      },
      {
        $lookup: {
            from: "organization-plans",
            let: { planId: "$planId" },
            pipeline: [
                {
                    $addFields: {
                        _id: { $toString: "$_id" }
                    }
                },
                {
                    $match: {
                        $expr: { $eq: ["$_id", "$$planId"] }
                    }
                }
            ],
            as: "plan"
        }
      },
      {
        $unwind: {
          path: "$plan",
          preserveNullAndEmptyArrays: true
        }
      },
    ]).toArray();

    
    if (!orgDetails || orgDetails.length === 0) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Check job limit if plan exists
    if (orgDetails[0].plan && orgDetails[0].plan.jobLimit !== undefined) {
      const totalActiveCareers = await db.collection("careers").countDocuments({ orgID, status: "active" });
      const jobLimit = orgDetails[0].plan.jobLimit + (orgDetails[0].extraJobSlots || 0);
      
      if (totalActiveCareers >= jobLimit) {
        return NextResponse.json({ error: "You have reached the maximum number of jobs for your plan" }, { status: 400 });
      }
    }

    const career = {
      id: guid(),
      jobTitle,
      description,
      questions,
      location,
      workSetup,
      workSetupRemarks,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastEditedBy,
      createdBy,
      status: status || "active",
      screeningSetting,
      orgID,
      requireVideo,
      lastActivityAt: new Date(),
      salaryNegotiable,
      minimumSalary,
      maximumSalary,
      country,
      province,
      employmentType,
      cvSecretPrompt,
      aiInterviewSecretPrompt,
      preScreeningQuestions: preScreeningQuestions || [],
      teamMembers: teamMembers || [],
    };

    await db.collection("careers").insertOne(career);

    return NextResponse.json({
      message: "Career added successfully",
      career,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add career" },
      { status: 500 }
    );
  }
}
