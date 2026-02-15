/**
 * Display module for App Release Copilot TUI
 * Renders the beautiful terminal interface for Expo metadata generation
 */

import { createRequire } from "module";
import { extractNumberedItems } from "../utils/clipboard.js";
import type { AppInfo, CHAR_LIMITS } from "../types.js";
import type { GeneratedImage } from "../services/image.js";
import { formatFileSize } from "../services/image.js";
import { 
  c, 
  BOX, 
  ICON, 
  renderLogo, 
  box, 
  stripAnsi, 
  progressBar, 
  modelBadge,
} from "./themes.js";

const require = createRequire(import.meta.url);
const { version } = require("../../package.json");

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const WIDTH = 84;

// Character limits from Expo schema
const LIMITS = {
  title: 30,
  subtitle: 30,
  description: 4000,
  keywords: 100,
  releaseNotes: 4000,
  promoText: 170,
};

// ════════════════════════════════════════════════════════════════════════════
// SCREEN MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════

/**
 * Clear screen and reset cursor
 */
export function clearScreen(): void {
  console.clear();
}

/**
 * Print the gorgeous header with ASCII art and tagline
 */
export function printHeader(): void {
  console.log();
  
  // Render gradient logo
  const logo = renderLogo();
  for (const line of logo) {
    console.log("  " + line);
  }
  
  // Tagline
  console.log();
  console.log(c.dim("  " + "─".repeat(WIDTH - 4)));
  console.log(c.dim("  ") + c.text("Metadata Generator for iOS App Store") + c.dim(" │ ") + c.brand(`v${version}`));
  console.log(c.dim("  " + "─".repeat(WIDTH - 4)));
  console.log();
}

// ════════════════════════════════════════════════════════════════════════════
// PANELS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Print app info display
 */
export function printAppInfo(appInfo: AppInfo): void {
  const content = [
    c.dim("App: ") + c.text(appInfo.name),
    c.dim("Description: ") + c.text(truncate(appInfo.description, 60)),
  ];
  
  if (appInfo.appStoreUrl) {
    content.push(c.dim("App Store: ") + c.info(appInfo.appStoreUrl));
  }
  
  if (appInfo.currentMetadata) {
    content.push(c.dim("Category: ") + c.text(appInfo.currentMetadata.primaryGenreName));
  }
  
  const panel = box(content, { 
    width: WIDTH, 
    title: `${ICON.app} App`,
    padding: 1,
  });
  
  for (const line of panel) {
    console.log("  " + line);
  }
  console.log();
}

/**
 * Truncate text with ellipsis
 */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 3) + "...";
}

// ════════════════════════════════════════════════════════════════════════════
// STATUS BAR
// ════════════════════════════════════════════════════════════════════════════

/**
 * Print the persistent status bar (full width)
 */
export function printStatusBar(
  model: string,
  isPremium: boolean,
  quota?: { used: number; total: number; isUnlimited: boolean }
): void {
  const innerWidth = WIDTH - 4;
  
  // Build status line components
  const badge = modelBadge(model, isPremium);
  
  let quotaDisplay = "";
  if (quota && !quota.isUnlimited) {
    const remaining = quota.total - quota.used;
    const percent = (remaining / quota.total) * 100;
    const bar = progressBar(percent, 12);
    quotaDisplay = c.dim(" │ ") + bar + " " + c.text(String(remaining)) + c.muted("/" + quota.total);
  } else if (quota?.isUnlimited) {
    quotaDisplay = c.dim(" │ ") + c.success("∞ Unlimited");
  }
  
  const hint = c.dim(" │ ") + c.muted("/help for commands");
  
  // Build the line
  console.log("  " + c.border(BOX.tl + BOX.h.repeat(innerWidth) + BOX.tr));
  
  const statusContent = "  " + badge + quotaDisplay + hint;
  const contentLen = stripAnsi(statusContent).length;
  const padding = innerWidth - contentLen + 2;
  
  console.log("  " + c.border(BOX.v) + statusContent + " ".repeat(Math.max(0, padding)) + c.border(BOX.v));
  console.log("  " + c.border(BOX.bl + BOX.h.repeat(innerWidth) + BOX.br));
  console.log();
}

/**
 * Print compact inline status (shows before each prompt)
 */
export function printInlineStatus(
  model: string,
  isPremium: boolean,
  appName: string
): void {
  const badge = modelBadge(model, isPremium);
  const appInfo = c.dim("app:") + c.muted(truncate(appName, 20));
  const hint = c.muted("/help");
  
  console.log();
  console.log("  " + c.border("─".repeat(WIDTH - 4)));
  console.log("  " + badge + c.dim(" │ ") + appInfo + c.dim(" │ ") + hint);
}

// ════════════════════════════════════════════════════════════════════════════
// HELP DISPLAY
// ════════════════════════════════════════════════════════════════════════════

/**
 * Print available commands
 */
export function printHelp(): void {
  console.log();
  console.log("  " + c.whiteBold(ICON.sparkle + " Commands"));
  console.log("  " + c.border("─".repeat(WIDTH - 4)));
  console.log();
  
  const commands = [
    { cmd: "/title", desc: "Generate titles (30 chars)" },
    { cmd: "/subtitle", desc: "Generate subtitles (30 chars)" },
    { cmd: "/desc", desc: "Generate description (4000 chars)" },
    { cmd: "/keywords", desc: "Generate keywords (100 chars)" },
    { cmd: "/release", desc: "Generate what's new" },
    { cmd: "/promo", desc: "Generate promo text (170 chars)" },
    { cmd: "/full", desc: "Generate complete package" },
  ];
  
  const imageCommands = [
    { cmd: "/icon", desc: "Generate app icon (interactive)" },
    { cmd: "/icon <desc>", desc: "Icon with custom subject" },
    { cmd: "/feature", desc: "Generate feature graphic (interactive)" },
    { cmd: "/feature <desc>", desc: "Feature graphic with custom subject" },
  ];
  
  const utilCommands = [
    { cmd: "/score <kw>", desc: "Score a keyword" },
    { cmd: "/export", desc: "Export store.config.json" },
    { cmd: "/copy", desc: "Copy to clipboard" },
    { cmd: "/model", desc: "Switch model" },
    { cmd: "/quit", desc: "Exit" },
  ];
  
  // Commands in a compact grid
  console.log("  " + c.brand("Generate Metadata"));
  let row = "   ";
  for (const { cmd, desc } of commands) {
    row += c.info(cmd) + c.dim(` ${desc}`) + "  ";
    if (row.length > 70) {
      console.log(row);
      row = "   ";
    }
  }
  if (row.trim()) console.log(row);
  
  console.log();
  console.log("  " + c.brand("Image Generation"));
  row = "   ";
  for (const { cmd, desc } of imageCommands) {
    row += c.info(cmd) + c.dim(` ${desc}`) + "  ";
  }
  console.log(row);
  
  console.log();
  console.log("  " + c.brand("Tools"));
  row = "   ";
  for (const { cmd, desc } of utilCommands) {
    row += c.info(cmd) + c.dim(` ${desc}`) + "  ";
  }
  console.log(row);
  
  console.log();
  console.log("  " + c.border("─".repeat(WIDTH - 4)));
  console.log("  " + c.dim("💬 Refine with: ") + c.muted("\"make it shorter\" • \"more keywords\" • \"focus on feature X\""));
  console.log();
}

// ════════════════════════════════════════════════════════════════════════════
// CHARACTER COUNT DISPLAY
// ════════════════════════════════════════════════════════════════════════════

/**
 * Format character count with color coding
 * Green: ≤80%, Yellow: ≤100%, Red: >100%
 */
export function formatCharCount(current: number, limit: number): string {
  const percent = (current / limit) * 100;
  const display = `${current}/${limit}`;
  
  if (percent <= 80) {
    return c.success(display);
  } else if (percent <= 100) {
    return c.warning(display);
  } else {
    return c.error(display + " ⚠");
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CONTENT DISPLAY
// ════════════════════════════════════════════════════════════════════════════

/**
 * Print numbered items in a consistent format
 */
export function printNumberedList(items: string[], title: string, icon: string): void {
  console.log();
  console.log("  " + c.whiteBold(`${icon} ${title}`));
  console.log("  " + c.border("─".repeat(WIDTH - 4)));
  console.log();
  
  items.forEach((item, i) => {
    const num = c.number(`  ${i + 1}.`);
    
    // Word wrap long items to fit in panel
    const maxWidth = WIDTH - 10;
    const words = item.split(" ");
    let currentLine = "";
    const wrappedLines: string[] = [];
    
    for (const word of words) {
      if ((currentLine + " " + word).trim().length <= maxWidth) {
        currentLine = (currentLine + " " + word).trim();
      } else {
        if (currentLine) wrappedLines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) wrappedLines.push(currentLine);
    
    // Print first line with number
    console.log(`  ${num} ${c.text(wrappedLines[0] || "")}`);
    
    // Print continuation lines indented
    for (let j = 1; j < wrappedLines.length; j++) {
      console.log(`       ${c.text(wrappedLines[j])}`);
    }
    console.log();
  });
}

/**
 * Print generated titles as a beautiful list
 */
export function printTitles(titles: string[]): void {
  printNumberedList(titles, "Title Options", ICON.title);
}

/**
 * Print generated content - detects numbered items and formats appropriately
 */
export function printContent(content: string, title: string, icon: string): void {
  // Check if content has numbered items (at least 3)
  const numberedItems = extractNumberedItems(content);
  
  if (numberedItems.length >= 3) {
    // Use numbered list format
    printNumberedList(numberedItems, title, icon);
    
    // Check for additional content after the list
    const lines = content.split("\n");
    const lastNumberedLine = lines.findIndex(l => l.match(/^\d+\.\s/));
    let afterList = false;
    let additionalContent: string[] = [];
    
    for (let i = lastNumberedLine + 1; i < lines.length; i++) {
      const line = lines[i];
      if (!afterList && !line.trim()) continue;
      if (line.match(/^\d+\.\s/)) continue;
      if (line.includes("---") || line.includes("**") || line.includes("Analysis") || line.includes("Final")) {
        afterList = true;
      }
      if (afterList) {
        additionalContent.push(line);
      }
    }
    
    if (additionalContent.length > 0 && additionalContent.some(l => l.trim())) {
      console.log("  " + c.border("─".repeat(WIDTH - 4)));
      console.log();
      for (const line of additionalContent) {
        if (line.trim()) {
          const cleanLine = line.replace(/\*\*([^*]+)\*\*/g, (_, text) => c.whiteBold(text));
          console.log("  " + cleanLine);
        }
      }
      console.log();
    }
  } else {
    // Use standard panel format for non-list content
    console.log();
    
    const lines = content.split("\n").map(l => c.text(l));
    
    if (lines.length > 15) {
      console.log("  " + c.whiteBold(`${icon} ${title}`));
      console.log("  " + c.border("─".repeat(WIDTH - 4)));
      console.log();
      for (const line of lines) {
        console.log("  " + line);
      }
      console.log();
      console.log("  " + c.border("─".repeat(WIDTH - 4)));
    } else {
      const panel = box(lines, {
        width: WIDTH,
        title: `${icon} ${title}`,
        padding: 1,
      });
      
      for (const line of panel) {
        console.log("  " + line);
      }
    }
    console.log();
  }
  
  console.log("  " + c.dim("Type /copy to copy, /export to save, or another command"));
  console.log();
}

/**
 * Print keyword scores in a formatted table
 */
export function printKeywordScores(content: string): void {
  console.log();
  console.log("  " + c.whiteBold(`${ICON.score} Keyword Analysis`));
  console.log("  " + c.border("─".repeat(WIDTH - 4)));
  console.log();
  
  // Just print the content formatted nicely
  const lines = content.split("\n");
  for (const line of lines) {
    if (line.trim()) {
      // Highlight scores
      const formatted = line
        .replace(/Traffic Score[:\s]+(\d+)/gi, (_, n) => `Traffic: ${scoreColor(Number(n), 10)}`)
        .replace(/Difficulty Score[:\s]+(\d+)/gi, (_, n) => `Difficulty: ${scoreColor(10 - Number(n), 10)}`)
        .replace(/Difficulty Index[:\s]+(\d+)/gi, (_, n) => `Index: ${scoreColor(100 - Number(n), 100)}`)
        .replace(/\*\*([^*]+)\*\*/g, (_, text) => c.whiteBold(text));
      console.log("  " + formatted);
    }
  }
  console.log();
}

/**
 * Color a score based on value (higher is better for traffic, lower for difficulty)
 */
function scoreColor(value: number, max: number): string {
  const percent = (value / max) * 100;
  if (percent >= 70) return c.success(String(value));
  if (percent >= 40) return c.warning(String(value));
  return c.error(String(value));
}

// ════════════════════════════════════════════════════════════════════════════
// MESSAGES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Print success message
 */
export function printSuccess(message: string): void {
  console.log();
  console.log("  " + c.success(ICON.check) + " " + c.successBold(message));
  console.log();
}

/**
 * Print error message
 */
export function printError(message: string): void {
  console.log();
  console.log("  " + c.error(ICON.cross) + " " + c.errorBold(message));
  console.log();
}

// ════════════════════════════════════════════════════════════════════════════
// IMAGE RESULT DISPLAY
// ════════════════════════════════════════════════════════════════════════════

/**
 * Print image generation result
 */
export function printImageResult(image: GeneratedImage, imageType: "icon" | "feature"): void {
  const label = imageType === "icon" ? "App Icon" : "Feature Graphic";
  const icon = imageType === "icon" ? "🎨" : "🖼️";
  
  console.log();
  console.log("  " + c.whiteBold(`${icon} ${label} Generated`));
  console.log("  " + c.border("─".repeat(WIDTH - 4)));
  console.log();
  console.log("  " + c.dim("File: ") + c.info(image.filePath));
  console.log("  " + c.dim("Size: ") + c.text(`${image.width}×${image.height}`) + c.dim(" px"));
  console.log("  " + c.dim("Format: ") + c.text(image.format.toUpperCase()));
  console.log("  " + c.dim("File size: ") + c.text(formatFileSize(image.fileSize)));
  console.log();
  console.log("  " + c.dim("Type /export to include in your store.config.json export"));
  console.log();
}

// ════════════════════════════════════════════════════════════════════════════
// GOODBYE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Print goodbye message
 */
export function printGoodbye(): void {
  console.log();
  console.log("  " + c.brand(ICON.sparkle) + " " + c.dim("Thanks for using App Release Copilot!"));
  console.log();
}

// ════════════════════════════════════════════════════════════════════════════
// CONTENT ICONS & LABELS
// ════════════════════════════════════════════════════════════════════════════

export const CONTENT_ICONS: Record<string, string> = {
  title: ICON.title,
  subtitle: ICON.subtitle,
  description: ICON.description,
  keywords: ICON.keywords,
  releaseNotes: ICON.release,
  promoText: ICON.promo,
  full: ICON.rocket,
  icon: "🎨",
  feature: "🖼️",
};

export const CONTENT_LABELS: Record<string, string> = {
  title: "Title Options",
  subtitle: "Subtitle Options",
  description: "App Description",
  keywords: "Keywords",
  releaseNotes: "What's New",
  promoText: "Promo Text Options",
  full: "Full ASO Package",
  icon: "App Icon",
  feature: "Feature Graphic",
};
