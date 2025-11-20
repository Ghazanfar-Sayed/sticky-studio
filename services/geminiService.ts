import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ScriptAnalysisResponse } from '../types';

const apiKey = process.env.API_KEY || '';

// Initialize the client. 
// Note: We create a new instance in functions if needed to ensure fresh config, 
// but for this simple app, a single instance or function-scoped instance works.
const getAIClient = () => new GoogleGenAI({ apiKey });

/**
 * Analyzes a script text and breaks it down into scenes with visual prompts suitable for stick figures.
 * Uses gemini-3-pro-preview.
 */
export const analyzeScript = async (script: string): Promise<ScriptAnalysisResponse> => {
  const ai = getAIClient();
  
  const prompt = `
    You are a storyboard artist specializing in simple, expressive stick-figure comics.
    Break down the following script into a sequence of distinct scenes (minimum 3, maximum 8).
    For each scene, provide:
    1. A short description of the action.
    2. A "visual_prompt" describing the distinct action and subjects in the scene for a stick figure drawing. 
       Focus on poses, objects, and interactions. Do not include style instructions like "pencil sketch" or "drawing", as the style is applied automatically.
    
    Script:
    "${script}"
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                scene_number: { type: Type.INTEGER },
                description: { type: Type.STRING },
                visual_prompt: { type: Type.STRING },
              },
              required: ['scene_number', 'description', 'visual_prompt'],
            },
          },
        },
        required: ['scenes'],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  
  try {
    return JSON.parse(text) as ScriptAnalysisResponse;
  } catch (e) {
    console.error("Failed to parse JSON", text);
    throw new Error("Failed to parse AI response");
  }
};

/**
 * Generates an image using imagen-4.0-generate-001 based on the prompt.
 */
export const generateStickFigureImage = async (prompt: string): Promise<string> => {
  const ai = getAIClient();

  // Enforce the style in the prompt sent to Imagen
  // Style based on Zdeněk Šašek (zdeneksasek) - known for iconic flash animations.
  // Key features: Round heads, bold thick lines, dynamic posing, clean vector look.
  const enhancedPrompt = `A high-quality stick figure drawing in the iconic style of Zdeněk Šašek (zdeneksasek). 
  Subject: ${prompt}. 
  Style details: Minimalist vector illustration, black and white line art style. The characters have no torsos, with limbs extending directly from their round heads, and with thin line body. Use clean, uniform black lines on a white background with no shading or color. The style is friendly and modern. 
  Aesthetic: Classic 2000s flash animation style, minimalist, clean vector-like lines, expressive and dynamic pose.`;

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: enhancedPrompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
        outputMimeType: 'image/jpeg',
      },
    });

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64ImageBytes) {
      throw new Error("No image generated");
    }
    return `data:image/jpeg;base64,${base64ImageBytes}`;
  } catch (error) {
    console.error("Image generation error", error);
    throw error;
  }
};

/**
 * Sends a chat message to Gemini 3 Pro Preview.
 */
export const sendChatMessage = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string
): Promise<string> => {
  const ai = getAIClient();
  
  // Construct chat history in the format expected by the SDK if we were using ai.chats.create,
  // or just manually manage history and send a generateContent request.
  // For simplicity and statelessness here, we'll use a chat session.
  
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    history: history,
    config: {
        systemInstruction: "You are a helpful screenwriting assistant. Help the user write scripts for stick-figure storyboards. Keep responses concise and helpful."
    }
  });

  const response: GenerateContentResponse = await chat.sendMessage({
    message: newMessage
  });

  return response.text || "I couldn't generate a response.";
};