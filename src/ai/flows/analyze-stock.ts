'use server';

/**
 * @fileOverview An AI agent that analyzes a stock based on user inputs.
 *
 * - analyzeStock - A function that handles the stock analysis process.
 * - AnalyzeStockInput - The input type for the analyzeStock function.
 * - AnalyzeStockOutput - The return type for the analyzeStock function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeStockInputSchema = z.object({
  ticker: z.string().describe('The stock ticker symbol (e.g., AAPL).'),
  investmentThesis: z
    .string()
    .describe(
      'The user investment thesis, outlining the rationale behind considering this stock.'
    ),
  goal: z
    .string()
    .describe(
      'The user investment goal (e.g., long-term growth, dividend income).'
    ),
});
export type AnalyzeStockInput = z.infer<typeof AnalyzeStockInputSchema>;

const AnalyzeStockOutputSchema = z.object({
  fundamentalAnalysis: z.string().describe('A detailed fundamental analysis of the stock.'),
  thesisValidation: z
    .string()
    .describe(
      'An evaluation of how well the stock aligns with the provided investment thesis.'
    ),
  sectorAndMacroView: z
    .string()
    .describe(
      'An overview of the stock sector and relevant macroeconomic factors.'
    ),
  catalystWatch: z
    .string()
    .describe('Potential catalysts that could affect the stock price.'),
  investmentSummary: z.string().describe('A concise summary of the investment potential.'),
});
export type AnalyzeStockOutput = z.infer<typeof AnalyzeStockOutputSchema>;

export async function analyzeStock(input: AnalyzeStockInput): Promise<AnalyzeStockOutput> {
  return analyzeStockFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeStockPrompt',
  input: {schema: AnalyzeStockInputSchema},
  output: {schema: AnalyzeStockOutputSchema},
  prompt: `You are a highly skilled financial analyst. Analyze the stock with ticker symbol {{ticker}}, incorporating both fundamental and macroeconomic perspectives based on the user's investment thesis and goal. Provide the analysis in the following sections:

Fundamental Analysis:
[Detailed fundamental analysis of the stock]

Thesis Validation:
[An evaluation of how well the stock aligns with the provided investment thesis: {{investmentThesis}}]

Sector & Macro View:
[An overview of the stock sector and relevant macroeconomic factors]

Catalyst Watch:
[Potential catalysts that could affect the stock price]

Investment Summary:
[A concise summary of the investment potential, taking into account the user's goal: {{goal}}]
`,
});

const analyzeStockFlow = ai.defineFlow(
  {
    name: 'analyzeStockFlow',
    inputSchema: AnalyzeStockInputSchema,
    outputSchema: AnalyzeStockOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
