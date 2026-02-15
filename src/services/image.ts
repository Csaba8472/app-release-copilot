/**
 * Unified image generation service for App Release Copilot
 * Wraps OpenAI and Gemini providers with sharp post-processing
 */

import { writeFile, mkdir } from "fs/promises";
import { join, basename } from "path";
import { stat } from "fs/promises";
import sharp from "sharp";
import { generateWithOpenAI, isOpenAIAvailable, type ImageSize } from "./image-openai.js";
import { generateWithGemini, isGeminiAvailable } from "./image-gemini.js";
import { buildIconPrompt, buildFeatureGraphicPrompt, type IconStyle } from "../utils/image-prompt.js";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type ImageProvider = "openai" | "gemini";
export type ImageType = "icon" | "feature";

export interface ImageGenerationOptions {
  type: ImageType;
  prompt: string;
  provider: ImageProvider;
  style?: IconStyle;
  outputDir?: string;
}

export interface GeneratedImage {
  filePath: string;
  width: number;
  height: number;
  format: string;
  fileSize: number;
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const ICON_SIZE = { width: 1024, height: 1024 };
const FEATURE_SIZE = { width: 1024, height: 500 };

// OpenAI supports landscape generation, we use closest size
const OPENAI_FEATURE_SIZE: ImageSize = "1536x1024";

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get the list of available image providers based on env vars
 */
export function getAvailableProviders(): ImageProvider[] {
  const providers: ImageProvider[] = [];
  if (isOpenAIAvailable()) providers.push("openai");
  if (isGeminiAvailable()) providers.push("gemini");
  return providers;
}

/**
 * Check if any image provider is available
 */
export function hasImageProvider(): boolean {
  return isOpenAIAvailable() || isGeminiAvailable();
}

/**
 * Ensure output directory exists
 */
async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

/**
 * Save a base64-encoded image to disk with optional resizing via sharp
 */
async function saveAndResize(
  base64Data: string,
  outputPath: string,
  targetWidth: number,
  targetHeight: number,
  format: "png" | "jpeg" = "png",
): Promise<GeneratedImage> {
  const buffer = Buffer.from(base64Data, "base64");

  let pipeline = sharp(buffer);

  // Get original metadata
  const metadata = await sharp(buffer).metadata();
  const origWidth = metadata.width || targetWidth;
  const origHeight = metadata.height || targetHeight;

  // Only resize if dimensions don't match the target
  if (origWidth !== targetWidth || origHeight !== targetHeight) {
    pipeline = pipeline.resize(targetWidth, targetHeight, {
      fit: "cover",
      position: "center",
    });
  }

  // Output format
  if (format === "jpeg") {
    pipeline = pipeline.jpeg({ quality: 95 });
  } else {
    pipeline = pipeline.png();
  }

  await pipeline.toFile(outputPath);

  // Get final file size
  const fileInfo = await stat(outputPath);

  return {
    filePath: outputPath,
    width: targetWidth,
    height: targetHeight,
    format,
    fileSize: fileInfo.size,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN GENERATION FUNCTION
// ════════════════════════════════════════════════════════════════════════════

/**
 * Generate an image (icon or feature graphic) using the specified provider.
 *
 * For icons: generates 1024×1024 directly.
 * For feature graphics + OpenAI: generates at 1536×1024 then resizes to 1024×500.
 * For feature graphics + Gemini: generates square then crops/resizes to 1024×500.
 */
export async function generateImage(options: ImageGenerationOptions): Promise<GeneratedImage> {
  const {
    type,
    prompt,
    provider,
    style,
    outputDir = process.cwd(),
  } = options;

  // Build the enhanced prompt
  const enhancedPrompt = type === "icon"
    ? buildIconPrompt({ prompt, style })
    : buildFeatureGraphicPrompt({ prompt, style });

  // Determine target dimensions
  const target = type === "icon" ? ICON_SIZE : FEATURE_SIZE;

  // Determine output filename
  const timestamp = Date.now();
  const ext = "png";
  const filename = type === "icon"
    ? `icon-${timestamp}.${ext}`
    : `feature-${timestamp}.${ext}`;
  
  await ensureDir(outputDir);
  const outputPath = join(outputDir, filename);

  let base64Data: string;

  if (provider === "openai") {
    // OpenAI generation
    const size: ImageSize = type === "feature" ? OPENAI_FEATURE_SIZE : "1024x1024";
    const results = await generateWithOpenAI({
      prompt: enhancedPrompt,
      size,
      outputFormat: "png",
      numImages: 1,
    });
    base64Data = results[0];
  } else {
    // Gemini generation (always square)
    const results = await generateWithGemini({
      prompt: enhancedPrompt,
      pro: true,
      numImages: 1,
      quality: "1k",
    });
    base64Data = results[0].base64;
  }

  // Save with resizing if needed
  const result = await saveAndResize(
    base64Data,
    outputPath,
    target.width,
    target.height,
    ext,
  );

  return result;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
