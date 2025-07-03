import { z } from 'zod';
import type { AnalyzeStockOutput } from '@/ai/flows/analyze-stock';
import type { TickerSuggestionOutput } from '@/ai/flows/suggest-tickers';

export const formSchema = z.object({
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

type SuggestionResult = {
  success: true;
  data: TickerSuggestionOutput;
} | {
  success: false;
  error: string;
};

export async function handleStockAnalysis(
  values: z.infer<typeof formSchema>
): Promise<AnalysisResult> {
  try {
    const response = await fetch('/api/analyze-stock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error during stock analysis:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: `Network error: ${errorMessage}` };
  }
}

export async function handleTickerSuggest(query: string): Promise<SuggestionResult> {
  if (!query) {
    return { success: true, data: [] };
  }

  try {
    const response = await fetch('/api/suggest-tickers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error during ticker suggestion:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: `Network error: ${errorMessage}` };
  }
}
