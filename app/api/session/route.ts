import { NextResponse } from 'next/server';
import { generateInterviewInstructions } from '@/lib/interview-instructions';

interface SessionRequestBody {
  voice?: string;
  resumeData?: Record<string, unknown> | null;
  jobData?: {
    jobTitle: string;
    companyName: string;
    jobDescription: string;
  } | null;
  interviewerName?: string;
  locale?: string;
}

export async function POST(request: Request) {
    try {        
        if (!process.env.OPENAI_API_KEY){
            throw new Error(`OPENAI_API_KEY is not set`);
        }

        // Parse request body for context (gracefully handle empty body)
        let body: SessionRequestBody = {};
        try {
            body = await request.json();
        } catch (error) {
            // Empty body is fine - we'll use defaults
            console.log("No request body provided, using defaults");
        }
        
        // Extract parameters with defaults
        const voice = body.voice || "alloy";
        const resumeData = body.resumeData;
        const jobData = body.jobData;
        const interviewerName = body.interviewerName || "Alex";
        const locale = body.locale || "en";

        console.log("Creating session with context:", {
          hasResume: !!resumeData,
          hasJob: !!jobData,
          interviewerName,
          voice
        });

        // Generate context-aware interview instructions
        const instructions = generateInterviewInstructions({
          resumeData,
          jobData,
          interviewerName,
          locale
        });

        console.log("Generated instructions length:", instructions.length);

        const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-realtime-preview-2024-12-17",
                voice: voice,
                modalities: ["audio", "text"],
                instructions: instructions + "\n\nCRITICAL INTERRUPTION PREVENTION: Always wait for the user to completely finish speaking before you respond. Never interrupt them mid-sentence. Wait for natural pauses and at least 500ms of silence before asking your next question. Be patient and let them finish their thoughts completely.",
                tool_choice: "auto",
                // Turn-taking configuration to prevent interruptions
                turn_detection: {
                    type: "server_vad",
                    threshold: 0.5,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 500, // Wait 500ms of silence before speaking
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenAI API error:", errorText);
            throw new Error(`OpenAI API request failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // Return the JSON response to the client
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error creating session:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to create session";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}