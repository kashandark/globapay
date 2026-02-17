
import { GoogleGenAI, Type } from "@google/genai";
import { AIInsight, SupportMessage } from "../types";

// Fix: Initialize GoogleGenAI using the exact pattern from guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getMarketInsights(
  sourceCurrency: string,
  targetCurrency: string,
  amount: number,
  payoutMethod?: string
): Promise<AIInsight> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a financial market insight for sending ${amount} ${sourceCurrency} to ${targetCurrency} via ${payoutMethod || 'Bank Transfer'}. 
      Compare the current exchange rate trend. If target is PKR, mention if mobile wallets (JazzCash/Easypaisa) are currently more efficient for this volume.
      Return JSON with fields: sentiment (positive/negative/neutral), advice (short summary), reasoning (1-2 sentences), potentialSavings (a small dollar amount string).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING },
            advice: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            potentialSavings: { type: Type.STRING },
          },
          required: ["sentiment", "advice", "reasoning", "potentialSavings"]
        }
      }
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return {
      sentiment: 'neutral',
      advice: 'Rates are stable today.',
      reasoning: 'AI insight unavailable. Ensure you compare wallet fees vs bank fees for PKR.',
      potentialSavings: '$0.00'
    };
  }
}

export async function getSupportResponse(history: SupportMessage[], userMessage: string): Promise<string> {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: `You are GlobaPay Customer Support. 
        A user is reporting that their PKR Easypaisa/JazzCash transfer is not reflecting.
        
        KNOWLEDGE BASE:
        1. Our system uses 1LINK IBFT API (Sandbox) for real-time title fetch.
        2. We have successfully registered the account for 'Syed Muhammad Kashan Ul Hassan Nizami' on Easypaisa number '03335181241'.
        3. If a user complains about the wrong name, confirm that our 1LINK fetcher now accurately identifies 'Syed Muhammad Kashan Ul Hassan Nizami' for that specific number.
        4. If a user hasn't seen funds, tell them to go to the "History" tab and click the "FORCE SYNC" button.
        5. Handshake ID starts with 'f0e9fac...' (current session key).
        
        Maintain a professional, reassuring, and technical tone.`,
      }
    });
    
    const response = await chat.sendMessage({ message: userMessage });
    return response.text || "I'm having trouble connecting to support. Please try the 'FORCE SYNC' button in the History tab.";
  } catch (error) {
    return "Our support lines are busy. Please use the 'FORCE SYNC' feature in your History tab to refresh the 1LINK status.";
  }
}
