import { GoogleGenAI, Modality } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export async function getAIResponse(prompt: string, knowledgeBase: string) {
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [{ text: `
          Knowledge Base (Your primary source):
          ${knowledgeBase}

          User Question: ${prompt}

          Instructions:
          1. Try to answer from the Knowledge Base first.
          2. If the answer is NOT in the Knowledge Base, use Google Search (including public Facebook pages/posts) to find the answer.
          3. If you still cannot find the answer after searching both the Knowledge Base and the web, say ONLY "Ami janina" (which means "I don't know" in Bengali).
          4. Respond in Bengali if the user asks in Bengali, otherwise respond in the user's language.
          5. Keep the response concise and friendly.
        ` }]
      }
    ],
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const response = await model;
  return response.text;
}

export async function getSpeech(text: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    return `data:audio/pcm;base64,${base64Audio}`;
  }
  return null;
}
