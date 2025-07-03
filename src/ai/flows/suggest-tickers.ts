'use server';
/**
 * @fileOverview An AI agent for suggesting stock tickers.
 *
 * - suggestTickers - A function that suggests stock tickers based on a query.
 * - TickerSuggestionInput - The input type for the suggestTickers function.
 * - TickerSuggestionOutput - The return type for the suggestTickers function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TickerSuggestionInputSchema = z.object({
  query: z.string().describe('A partial or full company name or stock ticker to search for.'),
});
export type TickerSuggestionInput = z.infer<typeof TickerSuggestionInputSchema>;

const TickerSuggestionOutputSchema = z.array(
    z.object({
        ticker: z.string().describe('The stock ticker symbol.'),
        name: z.string().describe('The full company name.'),
    })
).describe('A list of stock ticker suggestions.');
export type TickerSuggestionOutput = z.infer<typeof TickerSuggestionOutputSchema>;


export async function suggestTickers(input: TickerSuggestionInput): Promise<TickerSuggestionOutput> {
  return suggestTickersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTickersPrompt',
  input: {schema: TickerSuggestionInputSchema},
  output: {schema: TickerSuggestionOutputSchema},
  prompt: `You are a stock market data API. A user is searching for a stock.
Given their search query, provide a list of up to 5 relevant stock tickers and their corresponding company names.
The query could be a company name fragment or a ticker symbol fragment.
Return the data as a JSON array of objects, where each object has a 'ticker' and a 'name' field.
If you have no suggestions, return an empty array.

User Query: {{{query}}}
`,
});

const suggestTickersFlow = ai.defineFlow(
  {
    name: 'suggestTickersFlow',
    inputSchema: TickerSuggestionInputSchema,
    outputSchema: TickerSuggestionOutputSchema,
  },
  async (input) => {
    if (!input.query) {
        return [];
    }
    const {output} = await prompt(input);
    return output || [];
  }
);
