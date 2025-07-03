'use server';

import { z } from 'zod';
import { analyzeStock, type AnalyzeStockOutput } from '@/ai/flows/analyze-stock';
import { suggestTickers, type TickerSuggestionOutput } from '@/ai/flows/suggest-tickers';

const formSchema = z.object({
  ticker: z.string().min(1, 'Ticker is required.'),
  investmentThesis: z.string().min(10, 'Investment thesis is required.'),
  goal: z.string().min(5, 'Investment goal is required.'),
});

type AnalysisResult = {
  success: true;
  data: AnalyzeStockOutput;
} | {
  success: false;
  error: string;
};

export async function handleStockAnalysis(
  values: z.infer<typeof formSchema>
): Promise<AnalysisResult> {
  try {
    const validatedData = formSchema.parse(values);
    const result = await analyzeStock(validatedData);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input. Please check your data.' };
    }
    console.error('Error during stock analysis:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: `An unexpected error occurred during analysis: ${errorMessage}` };
  }
}

type SuggestionResult = {
  success: true;
  data: TickerSuggestionOutput;
} | {
  success: false;
  error: string;
};

export async function handleTickerSuggest(query: string): Promise<SuggestionResult> {
  if (!query) {
    return { success: true, data: [] };
  }
  try {
    const results = await suggestTickers({ query });
    return { success: true, data: results };
  } catch (error) {
    console.error('Error during ticker suggestion:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: `An unexpected error occurred during suggestions: ${errorMessage}` };
  }
}
