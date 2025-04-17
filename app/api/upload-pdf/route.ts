import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  console.log('📄 PDF UPLOAD: Starting to process request');
  try {
    // ✅ ENV check
    if (!process.env.OPENAI_API_KEY) {
      console.error('📄 PDF UPLOAD: Missing OpenAI API key');
      return NextResponse.json(
        { success: false, error: 'OPENAI_API_KEY is not set' },
        { status: 500 }
      );
    }

    // ✅ Content-Type check
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      console.error('📄 PDF UPLOAD: Wrong content type:', contentType);
      return NextResponse.json(
        { success: false, error: 'Content type must be multipart/form-data' },
        { status: 400 }
      );
    }

    // ✅ Parse form data
    console.log('📄 PDF UPLOAD: Parsing form data');
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      console.error('📄 PDF UPLOAD: No file found in request');
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      console.error('📄 PDF UPLOAD: File is not a PDF:', file.name);
      return NextResponse.json(
        { success: false, error: 'Uploaded file must be a PDF' },
        { status: 400 }
      );
    }

    console.log('📄 PDF UPLOAD: Valid PDF received -', file.name, 'Size:', Math.round(file.size / 1024), 'KB');
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // ✅ Upload to OpenAI
    console.log('📄 PDF UPLOAD: Uploading PDF to OpenAI');
    const pdfFile = new File([fileBuffer], file.name, { 
      type: 'application/pdf',
      lastModified: file.lastModified
    });
    
    const openaiFile = await openai.files.create({
      file: pdfFile,
      purpose: 'assistants',
    });
    console.log('📄 PDF UPLOAD: File uploaded to OpenAI, ID:', openaiFile.id);

    // ✅ Create Assistant
    console.log('📄 PDF UPLOAD: Creating OpenAI assistant');
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
    console.log('📄 PDF UPLOAD: Assistant created, ID:', assistant.id);

    // ✅ Create thread
    console.log('📄 PDF UPLOAD: Creating thread');
    const thread = await openai.beta.threads.create();
    console.log('📄 PDF UPLOAD: Thread created, ID:', thread.id);

    // ✅ Add message referencing the uploaded PDF
    console.log('📄 PDF UPLOAD: Adding message to thread with file attachment');
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
    console.log('📄 PDF UPLOAD: Starting assistant run');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
    });
    console.log('📄 PDF UPLOAD: Run created, ID:', run.id);

    // ✅ Poll for completion
    console.log('📄 PDF UPLOAD: Polling for run completion');
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    const startTime = Date.now();
    const timeoutMs = 30000; // Increased timeout to 30 seconds

    console.log('📄 PDF UPLOAD: Initial run status:', runStatus.status);
    while (
      ['queued', 'in_progress', 'requires_action'].includes(runStatus.status) &&
      Date.now() - startTime < timeoutMs
    ) {
      console.log('📄 PDF UPLOAD: Run in progress, status:', runStatus.status, '- waiting...');
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Check every 2 seconds
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }
    
    console.log('📄 PDF UPLOAD: Run completed with status:', runStatus.status);
    
    if (runStatus.status !== 'completed') {
      console.warn('📄 PDF UPLOAD: Run did not complete successfully. Final status:', runStatus.status);
    }

    // ✅ Get final messages
    console.log('📄 PDF UPLOAD: Retrieving messages');
    const messages = await openai.beta.threads.messages.list(thread.id);
    console.log('📄 PDF UPLOAD: Retrieved', messages.data.length, 'messages');
    
    const assistantMessages = messages.data.filter((m) => m.role === 'assistant');
    console.log('📄 PDF UPLOAD: Found', assistantMessages.length, 'assistant messages');

    if (assistantMessages.length > 0) {
      const lastMessage = assistantMessages[0];
      console.log('📄 PDF UPLOAD: Processing latest assistant message');
      
      if (lastMessage.content && lastMessage.content.length > 0) {
        const contentBlock = lastMessage.content[0];
        console.log('📄 PDF UPLOAD: Content type:', contentBlock.type);

        if (contentBlock.type === 'text') {
          const rawText = contentBlock.text.value;
          console.log('📄 PDF UPLOAD: Raw Assistant Response:');
          console.log(rawText);

          // ✅ Try parsing the JSON from GPT output
          try {
            console.log('📄 PDF UPLOAD: Attempting to extract JSON');
            const jsonMatch = rawText.match(/({[\s\S]*})/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              console.log('📄 PDF UPLOAD: Successfully parsed JSON:');
              console.log(JSON.stringify(parsed, null, 2));
            } else {
              console.warn('📄 PDF UPLOAD: No JSON object found in assistant response.');
            }
          } catch (error) {
            console.warn('📄 PDF UPLOAD: Could not parse JSON from assistant response:', error);
          }
        } else {
          console.warn('📄 PDF UPLOAD: Unexpected content type:', contentBlock.type);
        }
      } else {
        console.warn('📄 PDF UPLOAD: Assistant message has no content');
      }
    } else {
      console.warn('📄 PDF UPLOAD: No assistant messages found');
    }

    // ✅ Clean up OpenAI file
    console.log('📄 PDF UPLOAD: Cleaning up OpenAI file');
    try {
      await openai.files.del(openaiFile.id);
      console.log('📄 PDF UPLOAD: Successfully deleted file from OpenAI');
    } catch (cleanupErr) {
      console.warn('📄 PDF UPLOAD: Could not delete uploaded file from OpenAI:', cleanupErr);
    }

    console.log('📄 PDF UPLOAD: Processing completed successfully');
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('📄 PDF UPLOAD: Error processing resume:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}