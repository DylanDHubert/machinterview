import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const pdfFile = new File([fileBuffer], file.name, {
      type: 'application/pdf',
      lastModified: file.lastModified,
    });

    const openaiFile = await openai.files.create({
      file: pdfFile,
      purpose: 'assistants',
    });

    const assistant = await openai.beta.assistants.create({
      name: 'Resume Parser',
      instructions: `You are a resume parsing assistant. Extract the following information from the resume:
      - Full Name
      - Email
      - Phone Number
      - Education (institution, degree, dates)
      - Work Experience (company, title, dates, description)
      - Skills
      Format your response as a JSON object with these fields.`,
      model: 'gpt-4-turbo',
      tools: [{ type: 'file_search' }],
    });

    const thread = await openai.beta.threads.create();

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: 'Please extract structured information from this resume. Return all the information in JSON format.',
      attachments: [
        {
          file_id: openaiFile.id,
          tools: [{ type: 'file_search' }],
        },
      ],
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
    });

    return NextResponse.json({
      success: true,
      threadId: thread.id,
      runId: run.id,
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
