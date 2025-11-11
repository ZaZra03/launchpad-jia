// TODO (Vince) - For Merging

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const useGroq = process.env.USE_GROQ === "true";

const client = new OpenAI({
  apiKey: useGroq ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY,
  baseURL: useGroq ? "https://api.groq.com/openai/v1" : undefined,
});

export async function POST(req: NextRequest) {
  const { chunks } = await req.json();
  const corePrompt = `
    You are a helpful assistant that will extract the following data from the CV:
    
    CV chunks:
    ${chunks.map((chunk: any) => chunk.pageContent).join("\n")}

    Extract the following data from the CV:
      - Name
      - Email
      - Phone
      - Address
      - LinkedIn
      - GitHub
      - Twitter

    JSON template: 
    {
      errorRemarks: <error remarks>,
      digitalCV:
        [
          {name: "Introduction", content: <Introduction content markdown format>},
          {name: "Current Position", content: <Current Position content markdown format>},
          {name: "Contact Info", content: <Contact Info content markdown format>},
          {name: "Skills", content: <Skills content markdown format>},
          {name: "Experience", content: <Experience content markdown format>},
          {name: "Education", content: <Education content markdown format>},
          {name: "Projects", content: <Projects content markdown format>},
          {name: "Certifications", content: <Certifications content markdown format>},
          {name: "Awards", content: <Awards content markdown format>},
        ]
    }

    Processing Instructions:
      - follow the JSON template strictly
      - for contact info content make sure links are formatted as markdown links,
      - give detailed info in the content field.
      - in Awards content field give details of each award.
      - make sure the markdown format is correct, all section headlines are in bold. all paragraphs are in normal text, all lists are in bullet points, etc.
      - make sure all markdown lead text are equivalent to h2 tags in html,
      - for the Error Remarks, give a message if the chunks does seem to be a curriculum vitae, otherwise set it to null,
      - Do not include any other text or comments in the JSON output.
      - Only return the JSON output.
      - DO NOT include \`\`\`json or \`\`\` around the response.
    `;
  
  const completion = await client.chat.completions.create({
    model: useGroq ? "llama-3.3-70b-versatile" : "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: corePrompt,
      },
    ],
    temperature: 0.1,
    max_tokens: 8000,
  });

  return NextResponse.json({
    result: completion.choices[0]?.message?.content || "",
  });
}
