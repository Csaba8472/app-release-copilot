/**
 * Interactive prompts for ASO Copilot TUI
 * Chat-style interface with slash commands for Expo metadata generation
 */

import { select, input } from "@inquirer/prompts";
import { c, ICON } from "./themes.js";
import { getAvailableModels, type ModelId, type AvailableModel } from "../services/copilot.js";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type ContentType = 
  | "title" 
  | "subtitle" 
  | "description" 
  | "keywords" 
  | "releaseNotes" 
  | "promoText"
  | "full";

export type Command = 
  | { type: "content"; contentType: ContentType }
  | { type: "model" }
  | { type: "copy" }
  | { type: "last" }
  | { type: "clear" }
  | { type: "help" }
  | { type: "quit" }
  | { type: "export" }
  | { type: "score"; keyword: string }
  | { type: "url" }
  | { type: "chat"; message: string };

// Re-export for consumers
export { getAvailableModels, type ModelId, type AvailableModel };

// ════════════════════════════════════════════════════════════════════════════
// COMMAND PARSING
// ════════════════════════════════════════════════════════════════════════════

const COMMAND_MAP: Record<string, Command> = {
  // Content generation
  "/title": { type: "content", contentType: "title" },
  "/subtitle": { type: "content", contentType: "subtitle" },
  "/sub": { type: "content", contentType: "subtitle" },
  "/description": { type: "content", contentType: "description" },
  "/desc": { type: "content", contentType: "description" },
  "/keywords": { type: "content", contentType: "keywords" },
  "/kw": { type: "content", contentType: "keywords" },
  "/release": { type: "content", contentType: "releaseNotes" },
  "/whatsnew": { type: "content", contentType: "releaseNotes" },
  "/promo": { type: "content", contentType: "promoText" },
  "/tagline": { type: "content", contentType: "promoText" },
  "/full": { type: "content", contentType: "full" },
  "/all": { type: "content", contentType: "full" },
  
  // Utility
  "/model": { type: "model" },
  "/copy": { type: "copy" },
  "/last": { type: "last" },
  "/back": { type: "last" },
  "/clear": { type: "clear" },
  "/cls": { type: "clear" },
  "/help": { type: "help" },
  "/h": { type: "help" },
  "/?": { type: "help" },
  "/quit": { type: "quit" },
  "/exit": { type: "quit" },
  "/q": { type: "quit" },
  
  // ASO-specific
  "/export": { type: "export" },
  "/save": { type: "export" },
  "/url": { type: "url" },
  "/import": { type: "url" },
};

export function parseCommand(input: string): Command {
  const trimmed = input.trim();
  const lowered = trimmed.toLowerCase();
  
  // Check for /score <keyword> command
  if (lowered.startsWith("/score ")) {
    const keyword = trimmed.slice(7).trim();
    if (keyword) {
      return { type: "score", keyword };
    }
  }
  
  // Check for slash commands
  if (COMMAND_MAP[lowered]) {
    return COMMAND_MAP[lowered];
  }
  
  // Empty input - do nothing
  if (!trimmed) {
    return { type: "chat", message: "" };
  }
  
  // Unknown slash command
  if (trimmed.startsWith("/")) {
    // Try to help with typos
    return { type: "chat", message: trimmed };
  }
  
  // Non-slash input is a chat message for refinement
  return { type: "chat", message: trimmed };
}

// ════════════════════════════════════════════════════════════════════════════
// PROMPTS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Prompt for app name
 */
export async function promptAppName(): Promise<string> {
  return await input({
    message: c.brand("Enter your app name"),
    validate: (value) => {
      if (!value.trim()) return "App name is required";
      return true;
    },
    theme: {
      prefix: "  " + c.brand(ICON.app),
    },
  });
}

/**
 * Prompt for app description
 */
export async function promptAppDescription(): Promise<string> {
  return await input({
    message: c.brand("Describe your app (what it does, key features)"),
    validate: (value) => {
      if (!value.trim()) return "Description is required";
      if (value.trim().length < 20) return "Please provide more details (at least 20 characters)";
      return true;
    },
    theme: {
      prefix: "  " + c.brand(ICON.description),
    },
  });
}

/**
 * Prompt for optional App Store URL
 */
export async function promptAppStoreUrl(): Promise<string> {
  return await input({
    message: c.dim("App Store URL (optional, for competitor analysis)"),
    theme: {
      prefix: "  " + c.muted(ICON.link),
    },
  });
}

/**
 * Prompt for model selection
 */
export async function promptModel(currentModel?: string): Promise<ModelId> {
  const models = getAvailableModels();
  const choices = models.map(m => {
    const isCurrent = m.id === currentModel;
    const premiumBadge = m.premium ? c.premium(" " + ICON.bolt) : "";
    const currentBadge = isCurrent ? c.success(" (current)") : "";
    
    return {
      name: `${m.name}${premiumBadge}${currentBadge}`,
      value: m.id,
    };
  });

  return await select({
    message: c.brand("Select AI Model"),
    choices,
    loop: true,
    theme: {
      prefix: "  " + c.brand(ICON.model),
    },
  });
}

/**
 * Main chat prompt - accepts slash commands
 */
export async function promptCommand(): Promise<string> {
  return await input({
    message: "",
    theme: {
      prefix: c.brand("  ❯"),
    },
  });
}
