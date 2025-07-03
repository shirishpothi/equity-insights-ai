import { NextRequest, NextResponse } from 'next/server';
import { suggestTickers } from '@/ai/flows/suggest-tickers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;
    
    if (!query) {
      return NextResponse.json({ success: true, data: [] });
    }
    
    // Check if we have the required API key
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENAI_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'AI service is not configured. Please ensure the GEMINI_API_KEY is set.' 
        },
        { status: 500 }
      );
    }
    
    const results = await suggestTickers({ query });
    return NextResponse.json({ success: true, data: results });
    
  } catch (error) {
    console.error('Error during ticker suggestion:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json(
      { success: false, error: `An unexpected error occurred during suggestions: ${errorMessage}` },
      { status: 500 }
    );
  }
}
