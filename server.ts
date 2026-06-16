import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON and large file bodies
app.use(express.json({ limit: "15mb" }));

// Lazy initializer for the Gemini SDK Client following best practice
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined. Please configure your key in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. Prepare Notes Endpoint - Generates rich, highly optimized, structured notes and flashcards
app.post("/api/gemini/prepare-notes", async (req, res) => {
  try {
    const {
      url = "",
      title = "",
      transcriptRaw = "",
      skimStyle = "Executive Summary",
      customInstructions = "",
      existingHistory = [],
    } = req.body;

    const googleAi = getGeminiClient();

    // Build the instruction system instructions
    const systemPrompt = `You are an elite study assistant and content summarizer specializing in synthesizing high-retention structured insights and study study guides from video subtitles and transcripts.
Your task is to take a YouTube video's URL, subtitle transcript, or metadata and construct a beautifully rich, accurate, and deeply structured study workspace dataset.

Target Skim Style constraints:
- "Executive Summary": Focus on crisp high-level summaries, core action points, high-impact quotes, and general themes.
- "Action Plan": Focus on prescriptive next steps, tactical assignments, step-by-step instructions, and target checklists.
- "Deep Study Guide": Focus on definitions, chronological lecture notes with granular technical details, complex formulas, and concept breakdowns.
- "Interactive Q&A": Focus on comprehensive quizzes, hypothetical mock questions, FAQs, and flashcards.

Always return valid JSON according to the schema. Make the chapters detailed, informative, and cohesive. Avoid lazy markers like "etc" or "and so on".`;

    // Construct the prompt combining all pieces of content
    let requestPrompt = `Please analyze the following YouTube video content:
`;
    if (url) requestPrompt += `- YouTube URL: ${url}\n`;
    if (title) requestPrompt += `- Video Title: ${title}\n`;
    requestPrompt += `- Targeted Skimming/Study Workspace Style: ${skimStyle}\n`;
    if (customInstructions) {
      requestPrompt += `- Custom Instructions/Focus areas: ${customInstructions}\n`;
    }

    if (existingHistory && existingHistory.length > 0) {
      requestPrompt += `\nExisting AI History in this workspace (use this context to align tone, build on top of previous concepts, and create beautiful, cohesive cross-references if relevant): \n`;
      existingHistory.forEach((item: any, idx: number) => {
        requestPrompt += `- Workspace Draft #${idx + 1}: "${item.title}" [Type: ${item.skimStyle || "General"}] (URL: ${item.url || "N/A"})\n`;
        if (item.keyConcepts && item.keyConcepts.length > 0) {
          requestPrompt += `  Concepts Covered previously in workspace: ${item.keyConcepts.join(", ")}\n`;
        }
      });
      requestPrompt += `Please connect new concepts to previous entries under "Existing AI History" when applicable to construct a unified brain space!\n`;
    }

    if (transcriptRaw.trim()) {
      requestPrompt += `\nRaw subtitle transcript / Notes text to summarize:\n"""\n${transcriptRaw}\n"""\n`;
    } else {
      requestPrompt += `\n(No transcript text was provided. Please look up general knowledge, or use Google Search simulation internally if needed to reconstruct highly accurate and comprehensive chapters, action plan, and concept insights for this video or theme: "${title || url}").\n`;
    }

    requestPrompt += `\nGenerate complete, rigorous results. Your response must fit the defined schema strictly. Create beautiful visual markdown notes for the "formattedMarkdown" field, featuring bullet points, horizontal dividers, quotes, and clear subheaders.`;

    const response = await googleAi.models.generateContent({
      model: "gemini-3.5-flash",
      contents: requestPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            channelName: { type: Type.STRING },
            duration: { type: Type.STRING },
            originalWordCount: { type: Type.INTEGER },
            savedReadingTimeMinutes: { type: Type.INTEGER },
            summaryIntro: { type: Type.STRING },
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  timestamp: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["title", "timestamp", "summary", "keyPoints"]
              }
            },
            actionItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  task: { type: Type.STRING },
                  category: { type: Type.STRING },
                  priority: { type: Type.STRING, description: "Priority level: High, Medium, or Low" }
                },
                required: ["task", "priority"]
              }
            },
            keyConcepts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  concept: { type: Type.STRING },
                  definition: { type: Type.STRING }
                },
                required: ["concept", "definition"]
              }
            },
            quizzes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING }
                },
                required: ["question", "answer"]
              }
            },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING }
                },
                required: ["front", "back"]
              }
            },
            formattedMarkdown: { type: Type.STRING, description: "Drafted markdown summary formatted for clean printing/export." }
          },
          required: [
            "title", "channelName", "duration", "originalWordCount", "savedReadingTimeMinutes",
            "summaryIntro", "chapters", "actionItems", "keyConcepts", "quizzes", "flashcards", "formattedMarkdown"
          ]
        }
      }
    });

    const outputText = response.text || "{}";
    res.setHeader("Content-Type", "application/json");
    res.send(outputText);
  } catch (error: any) {
    console.error("Error in prepare-notes:", error);
    res.status(500).json({
      error: error.message || "An error occurred while generating notes. Please make sure your Gemini API key is configured properly."
    });
  }
});

// 2. Interactive Chat with Video Notes Endpoint
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { query, notesContext, chatHistory = [] } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const googleAi = getGeminiClient();

    const systemPrompt = `You are a helpful YouTube Notes companion. You answer questions directly based on the context of the video's compiled notes provided below.
Provide accurate, friendly, and structured responses. Use markdown bolding and bullet points if necessary.

Context of Video/Lecture Notes:
"""
${notesContext}
"""`;

    // Map history to standard contents structure if provided
    const chat = googleAi.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: systemPrompt,
      }
    });

    // In @google/genai, we can load history or simply call sendMessage with the query.
    // To support chat history, we can pass them first using the normal chats sendMessage mechanism,
    // or simulate history by composing the prompt. Let's compose the prompt to make it reliable:
    let combinedPrompt = "";
    if (chatHistory && chatHistory.length > 0) {
      combinedPrompt += "Here is the previous conversation:\n";
      chatHistory.forEach((msg: any) => {
        combinedPrompt += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.text}\n`;
      });
      combinedPrompt += "\nNew user question details:\n";
    }
    combinedPrompt += query;

    const response = await chat.sendMessage({
      message: combinedPrompt
    });

    res.json({ response: response.text || "No response received." });
  } catch (error: any) {
    console.error("Error in chat:", error);
    res.status(500).json({
      error: error.message || "An error occurred while continuing the chat session."
    });
  }
});

// 3. Mount Vite Middleware / Production Server configuration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on http://0.0.0.0:${PORT}`);
  });
}

startServer();
