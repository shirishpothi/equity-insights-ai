import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/lib/feature-flags';

// Configure the API key for Google AI
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

// Check if Gemini API integration is enabled
const isGeminiEnabled = isFeatureEnabled(FEATURE_FLAGS.DATA_GEMINI_API);

export const ai = genkit({
  plugins: isGeminiEnabled ? [googleAI({
    apiKey: apiKey,
  })] : [],
  model: isGeminiEnabled ? 'googleai/gemini-2.0-flash' : undefined,
});
