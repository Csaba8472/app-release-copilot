/**
 * Google Gemini image generation service
 * Adapted from SnapAI (https://github.com/betomoedano/snapai)
 */

import { GoogleGenAI } from "@google/genai";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type GeminiQuality = "1k" | "2k" | "4k";

export interface GeminiImageOptions {
  prompt: string;
  pro?: boolean;
  numImages?: number;
  quality?: GeminiQuality;
}

export interface GeneratedBinaryImage {
  base64: string;
  extension: string;
  mimeType?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const NORMAL_MODEL = "gemini-2.5-flash-image";
const PRO_MODEL = "gemini-3-pro-image-preview";

function mapQualityToImageSize(q: GeminiQuality): "1K" | "2K" | "4K" {
  if (q === "2k") return "2K";
  if (q === "4k") return "4K";
  return "1K";
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

interface ChunkImageData {
  data: string;
  mimeType: string;
}

function extractImageFromChunk(chunk: Record<string, unknown>): ChunkImageData | null {
  const candidates = chunk?.candidates as Array<{
    content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
  }> | undefined;
  const parts = candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  for (const part of parts) {
    const inlineData = part?.inlineData;
    if (inlineData?.data) {
      return { data: inlineData.data, mimeType: inlineData.mimeType || "image/png" };
    }
  }
  return null;
}

function getExtensionFromMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
  };
  return map[mimeType] || "png";
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICE
// ════════════════════════════════════════════════════════════════════════════

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Google Gemini API key not configured.\n" +
      "Set the GEMINI_API_KEY environment variable to use Gemini image generation."
    );
  }
  return new GoogleGenAI({ apiKey });
}

async function generateStream(
  ai: GoogleGenAI,
  model: string,
  prompt: string,
  quality?: GeminiQuality
): Promise<GeneratedBinaryImage[]> {
  const config: Record<string, unknown> = {
    responseModalities: ["IMAGE", "TEXT"],
  };

  if (model === PRO_MODEL && quality) {
    config.imageConfig = {
      imageSize: mapQualityToImageSize(quality),
    };
  }

  const contents = [
    {
      role: "user" as const,
      parts: [{ text: prompt }],
    },
  ];

  const stream = await (ai as unknown as {
    models: {
      generateContentStream: (params: {
        model: string;
        config: Record<string, unknown>;
        contents: typeof contents;
      }) => AsyncIterable<Record<string, unknown>>;
    };
  }).models.generateContentStream({
    model,
    config,
    contents,
  });

  const images: GeneratedBinaryImage[] = [];

  for await (const chunk of stream) {
    const imageData = extractImageFromChunk(chunk);
    if (imageData) {
      images.push({
        base64: imageData.data,
        extension: getExtensionFromMimeType(imageData.mimeType),
        mimeType: imageData.mimeType,
      });
    }
  }

  return images;
}

/**
 * Generate images using Google Gemini.
 * Returns an array of GeneratedBinaryImage (base64 + extension).
 */
export async function generateWithGemini(options: GeminiImageOptions): Promise<GeneratedBinaryImage[]> {
  const ai = getClient();
  const { prompt, pro = false, numImages = 1, quality = "1k" } = options;

  if (!pro) {
    return await generateStream(ai, NORMAL_MODEL, prompt);
  }

  if (numImages <= 1) {
    return await generateStream(ai, PRO_MODEL, prompt, quality);
  }

  // Multiple images with Pro: run in parallel
  const results = await Promise.all(
    Array.from({ length: numImages }, async () => {
      const imgs = await generateStream(ai, PRO_MODEL, prompt, quality);
      return imgs[0];
    })
  );

  return results.filter(Boolean);
}

/**
 * Check if a Gemini API key is available in the environment.
 */
export function isGeminiAvailable(): boolean {
  return !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
}
