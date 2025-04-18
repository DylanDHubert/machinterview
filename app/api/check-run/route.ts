import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { saveResumeData } from '@/lib/resume-utils';
import { supabase } from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');
    const runId = searchParams.get('runId');

    if (!threadId || !runId) {
      return NextResponse.json(
        { success: false, error: 'Missing threadId or runId' },
        { status: 400 }
      );
    }

    const run = await openai.beta.threads.runs.retrieve(threadId, runId);

    if (run.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(threadId);
      const assistantMessages = messages.data.filter(
        (message) => message.role === 'assistant'
      );

      if (assistantMessages.length > 0) {
        const lastMessage = assistantMessages[0];
        const content = lastMessage.content[0];

        if (content.type === 'text') {
          try {
            let parsed;
            // Try to extract JSON from the text response
            const jsonMatch = content.text.value.match(/```json\n([\s\S]*?)```/) || 
                              content.text.value.match(/{[\s\S]*}/);
            
            if (jsonMatch) {
              parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            } else {
              parsed = JSON.parse(content.text.value);
            }

            // Get current user if authenticated
            const { data: { user } } = await supabase.auth.getUser();
            
            // If user is authenticated, save resume to the database
            if (user) {
              try {
                await saveResumeData(parsed, user.id);
                console.log('Resume saved to Supabase for user:', user.id);
              } catch (error) {
                console.error('Error saving to Supabase:', error);
                // Continue even if save fails - we'll still return the data to the client
              }
            } else {
              console.log('No authenticated user, resume data will be temporary');
            }

            return NextResponse.json({
              success: true,
              done: true,
              parsed,
            });
          } catch (error) {
            console.error('Error parsing JSON:', error, content.text.value);
            return NextResponse.json(
              { success: false, error: 'Failed to parse resume data' },
              { status: 500 }
            );
          }
        }
      }

      return NextResponse.json(
        { success: false, error: 'No assistant message found' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      done: false,
      status: run.status,
    });
  } catch (error) {
    console.error('Check run error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
