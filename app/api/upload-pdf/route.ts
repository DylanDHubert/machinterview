import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    // Better handling for missing session
    if (authError) {
      console.error('Auth error:', authError.message);
      return NextResponse.json(
        { error: 'Authentication error', message: authError.message },
        { status: 401 }
      );
    }
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to continue' },
        { status: 401 }
      );
    }
    
    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.includes('pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${session.user.id}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, file);

    if (uploadError) {
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = await supabase.storage
      .from('resumes')
      .getPublicUrl(filePath);

    // Create database entry
    const { data: resumeData, error: dbError } = await supabase
      .from('resumes')
      .insert({
        user_id: session.user.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        parsed_data: {} // Placeholder for parsed data
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        { error: 'Failed to save resume data' },
        { status: 500 }
      );
    }

    // In a real application, you would process the PDF here
    // and extract relevant information

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        id: resumeData.id,
        filename: resumeData.file_name,
        url: urlData.publicUrl
      }
    });
  } catch (error) {
    console.error('Error processing PDF upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
