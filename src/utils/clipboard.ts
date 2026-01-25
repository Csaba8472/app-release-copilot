/**
 * Clipboard utilities for copying content
 */

import clipboard from "clipboardy";

/**
 * Copy text to system clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await clipboard.write(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract numbered items (like titles) from content
 */
export function extractNumberedItems(content: string): string[] {
  const items: string[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    // Match lines starting with numbers like "1.", "2.", etc.
    const match = line.match(/^\d+\.\s*\*?\*?(.+?)\*?\*?\s*$/);
    if (match) {
      // Clean up the title - remove markdown formatting
      const title = match[1]
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/^\[/, "")
        .replace(/\]$/, "")
        .trim();
      if (title) {
        items.push(title);
      }
    }
  }

  return items;
}
