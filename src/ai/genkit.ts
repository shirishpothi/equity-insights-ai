import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Configure the API key for Google AI
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

export const ai = genkit({
  plugins: [googleAI({
    apiKey: apiKey,
  })],
  model: 'googleai/gemini-2.0-flash',
});
