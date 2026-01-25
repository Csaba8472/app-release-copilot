/**
 * Export utilities for generating Expo store.config.json
 */

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import type { ExpoStoreConfig, GeneratedMetadata } from "../types.js";

/**
 * Convert app name to URL-safe slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 30);
}

/**
 * Get current date in YYYY-MM-DD format
 */
function getDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Build Expo store.config.json from generated metadata
 */
export function buildStoreConfig(metadata: GeneratedMetadata): ExpoStoreConfig {
  return {
    configVersion: 0,
    apple: {
      info: {
        "en-US": {
          title: metadata.title,
          subtitle: metadata.subtitle,
          description: metadata.description,
          keywords: metadata.keywords,
          releaseNotes: metadata.releaseNotes,
          promoText: metadata.promoText,
        },
      },
    },
  };
}

/**
 * Export store.config.json to a dated folder
 * Creates: ./aso-export-{app-name}-YYYY-MM-DD/store.config.json
 * 
 * @returns The path to the created folder
 */
export async function exportStoreConfig(
  metadata: GeneratedMetadata,
  appName: string
): Promise<string> {
  const slug = slugify(appName);
  const date = getDateString();
  const folderName = `aso-export-${slug}-${date}`;
  const folderPath = join(process.cwd(), folderName);
  
  // Create the folder
  await mkdir(folderPath, { recursive: true });
  
  // Build and write the config
  const config = buildStoreConfig(metadata);
  const configPath = join(folderPath, "store.config.json");
  
  await writeFile(
    configPath,
    JSON.stringify(config, null, 2),
    "utf-8"
  );
  
  return folderPath;
}

/**
 * Parse keywords from generated content
 * Extracts the keyword string from formats like:
 * `keyword1,keyword2,keyword3`
 * or inline backticks
 */
export function parseKeywordsFromContent(content: string): string[] {
  // Look for backtick-wrapped keyword list
  const backtickMatch = content.match(/`([^`]+)`/);
  if (backtickMatch) {
    return backtickMatch[1]
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 0);
  }
  
  // Look for "Final Keyword String:" line
  const finalMatch = content.match(/Final Keyword String[^:]*:\s*\n?\s*`?([^`\n]+)`?/i);
  if (finalMatch) {
    return finalMatch[1]
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 0);
  }
  
  return [];
}

/**
 * Extract the first option from numbered list content
 * Used for title, subtitle, promoText which generate multiple options
 */
export function extractFirstOption(content: string): string | undefined {
  // Match "1. [content]" or "1. **content**"
  const match = content.match(/^\s*1\.\s*\*?\*?([^*\n]+)\*?\*?\s*\(?/m);
  if (match) {
    // Remove character count like "(28 chars)"
    return match[1]
      .replace(/\*\*/g, "")
      .replace(/\s*\(\d+\s*chars?\)\s*$/i, "")
      .trim();
  }
  return undefined;
}

/**
 * Extract description from generated content
 * Strips markdown headings and extracts the main body
 */
export function extractDescription(content: string): string | undefined {
  // Remove markdown headings
  const lines = content.split("\n");
  const bodyLines: string[] = [];
  let inBody = false;
  
  for (const line of lines) {
    // Skip headings
    if (line.startsWith("#")) {
      inBody = true;
      continue;
    }
    // Skip character count lines
    if (line.match(/^\s*\(Character count:/i)) {
      continue;
    }
    if (inBody) {
      bodyLines.push(line);
    }
  }
  
  const body = bodyLines.join("\n").trim();
  return body.length > 10 ? body : undefined;
}
