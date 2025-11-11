import { NextResponse } from "next/server";
import OpenAI from "openai";

const useGroq = process.env.USE_GROQ === "true";

const client = new OpenAI({
  apiKey: useGroq ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY,
  baseURL: useGroq ? "https://api.groq.com/openai/v1" : undefined,
});

export async function POST(request: Request) {
  try {
    const { systemPrompt, prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const completion = await client.chat.completions.create({
      model: useGroq ? "llama-3.3-70b-versatile" : "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
            ? systemPrompt
            : "You are a helpful assistant that can answer questions and help with tasks.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: useGroq ? 8000 : 1000,
    });

    return NextResponse.json({
      result: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error in LLM engine:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
