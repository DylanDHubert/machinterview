import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Helper function to create OpenAI client lazily
// Initialize lazily to avoid build-time errors when env vars aren't available
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const openai = getOpenAIClient();

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const pdfFile = new File([fileBuffer], file.name, {
      type: 'application/pdf',
      lastModified: file.lastModified,
    });

    // Upload PDF to OpenAI Files API
    const openaiFile = await openai.files.create({
      file: pdfFile,
      purpose: 'assistants',
    });

    // Single chat completion call with file attachment
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `Extract structured information from this resume PDF. Return a JSON object with the following fields:
- fullName (string)
- email (string)
- phone (string)
- skills (array of strings)
- experience (array of objects with: title, company, dates, description)
- education (array of objects with: degree, school, year)

Extract all available information and return ONLY valid JSON.`,
          attachments: [
            {
              file_id: openaiFile.id,
              tools: [{ type: 'file_search' }],
            },
          ],
        },
      ],
      response_format: { type: 'json_object' }, // Force JSON response
    });

    // Parse and return JSON immediately
    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    const parsedData = JSON.parse(content);

    return NextResponse.json({
      success: true,
      parsed: parsedData,
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
