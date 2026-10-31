import { ENVIRONMENT } from "@/config/environment";
import { GoogleGenAI } from "@google/genai";

// Server-only: importing this from a client component would ship the API key to the browser.
export const ai = new GoogleGenAI({ apiKey: ENVIRONMENT.googleGenAIKey });
