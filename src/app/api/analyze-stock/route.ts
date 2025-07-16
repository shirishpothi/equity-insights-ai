import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeStock } from '@/ai/flows/analyze-stock';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/lib/feature-flags';

const formSchema = z.object({
  ticker: z.string().min(1, 'Ticker is required.'),
  investmentThesis: z.string().min(10, 'Investment thesis is required.'),
  goal: z.string().min(5, 'Investment goal is required.'),
});

export async function POST(request: NextRequest) {
  try {
    // Check if AI stock analysis is enabled
    if (!isFeatureEnabled(FEATURE_FLAGS.AI_STOCK_ANALYSIS)) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI stock analysis is currently disabled.'
        },
        { status: 503 }
      );
    }

    // Check if Gemini API integration is enabled
    if (!isFeatureEnabled(FEATURE_FLAGS.DATA_GEMINI_API)) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI service integration is currently disabled.'
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validatedData = formSchema.parse(body);

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
    
    const result = await analyzeStock(validatedData);
    return NextResponse.json({ success: true, data: result });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input. Please check your data.' },
        { status: 400 }
      );
    }
    
    console.error('Error during stock analysis:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json(
      { success: false, error: `An unexpected error occurred during analysis: ${errorMessage}` },
      { status: 500 }
    );
  }
}
