import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request: NextRequest) {
  const threadId = request.nextUrl.searchParams.get('threadId');
  const runId = request.nextUrl.searchParams.get('runId');

  if (!threadId || !runId) {
    return NextResponse.json({ success: false, error: 'Missing threadId or runId' }, { status: 400 });
  }

  try {
    const run = await openai.beta.threads.runs.retrieve(threadId, runId);

    if (run.status !== 'completed') {
      return NextResponse.json({ success: true, done: false, status: run.status });
    }

    const messages = await openai.beta.threads.messages.list(threadId);
    const assistantMessages = messages.data.filter((m) => m.role === 'assistant');

    if (assistantMessages.length === 0) {
      return NextResponse.json({ success: true, done: false, status: 'no assistant message' });
    }

    const contentBlock = assistantMessages[0].content[0];
    const rawText = contentBlock.type === 'text' ? contentBlock.text.value : '';

    let parsed = null;
    try {
      const match = rawText.match(/({[\s\S]*})/);
      parsed = match ? JSON.parse(match[0]) : null;
    } catch {
      parsed = null;
    }

    return NextResponse.json({
      success: true,
      done: true,
      raw: rawText,
      parsed,
    });
  } catch (err) {
    console.error('Check run error:', err);
    return NextResponse.json({ success: false, error: 'Failed to check run' }, { status: 500 });
  }
}
