// Static version of actions for GitHub Pages deployment
// This file provides mock implementations when Server Actions are not available

import { z } from 'zod';

const formSchema = z.object({
  ticker: z.string().min(1, 'Ticker is required.'),
  investmentThesis: z.string().min(10, 'Investment thesis is required.'),
  goal: z.string().min(5, 'Investment goal is required.'),
});

type AnalysisResult = {
  success: true;
  data: Record<string, unknown>;
} | {
  success: false;
  error: string;
};

export async function handleStockAnalysis(
  values: z.infer<typeof formSchema>
): Promise<AnalysisResult> {
  // Validate the input to maintain consistency
  try {
    formSchema.parse(values);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input. Please check your data.' };
    }
  }

  // Return a message explaining that AI functionality is not available in static mode
  return { 
    success: false, 
    error: 'AI analysis is not available in this static demo. This is a demonstration of the user interface. For full AI-powered stock analysis, please visit the live application or run it locally with proper API keys configured.' 
  };
}

type SuggestionResult = {
  success: true;
  data: Array<Record<string, unknown>>;
} | {
  success: false;
  error: string;
};

export async function handleTickerSuggest(): Promise<SuggestionResult> {
  // Return empty suggestions in static mode
  return { success: true, data: [] };
}
