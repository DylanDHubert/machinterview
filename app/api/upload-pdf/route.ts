import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // ✅ ENV check
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OPENAI_API_KEY is not set' },
        { status: 500 }
      );
    }

    // ✅ Content-Type check
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json(
        { success: false, error: 'Content type must be multipart/form-data' },
        { status: 400 }
      );
    }

    // ✅ Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, error: 'Uploaded file must be a PDF' },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // ✅ Upload to OpenAI
    // Create a File object for OpenAI upload
    const pdfFile = new File([fileBuffer], file.name, { 
      type: 'application/pdf',
      lastModified: file.lastModified
    });
    
    const openaiFile = await openai.files.create({
      file: pdfFile,
      purpose: 'assistants',
    });

    // ✅ Create Assistant
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

    // ✅ Create thread
    const thread = await openai.beta.threads.create();

    // ✅ Add message referencing the uploaded PDF
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: 'Please extract structured information from this resume. Return all the information in JSON format.',
      attachments: [
        {
          file_id: openaiFile.id,
          tools: [{ type: 'file_search' }]
        }
      ],
    });
    

    // ✅ Start assistant run
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
    });

    // ✅ Poll for completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    const startTime = Date.now();
    const timeoutMs = 15000;

    while (
      ['queued', 'in_progress', 'requires_action'].includes(runStatus.status) &&
      Date.now() - startTime < timeoutMs
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    // ✅ Get final messages
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessages = messages.data.filter((m) => m.role === 'assistant');

    if (assistantMessages.length > 0) {
      const lastMessage = assistantMessages[0];
      const contentBlock = lastMessage.content[0];

      if (contentBlock.type === 'text') {
        const rawText = contentBlock.text.value;
        console.log('Raw Assistant Response:\n', rawText);

        // ✅ Try parsing the JSON from GPT output
        try {
          const jsonMatch = rawText.match(/({[\s\S]*})/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            console.log('Parsed Resume JSON:\n', parsed);
          } else {
            console.warn('No JSON object found in assistant response.');
          }
        } catch (error) {
          console.warn('Could not parse JSON from assistant response:', error);
        }
      }
    }

    // ✅ Clean up OpenAI file
    try {
      await openai.files.del(openaiFile.id);
    } catch (cleanupErr) {
      console.warn('Could not delete uploaded file from OpenAI:', cleanupErr);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing resume:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
