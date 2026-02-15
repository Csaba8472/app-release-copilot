/**
 * Interactive prompts for App Release Copilot TUI
 * Chat-style interface with slash commands for Expo metadata generation
 */

import { select, input } from "@inquirer/prompts";
import { c, ICON } from "./themes.js";
import { getAvailableModels, type ModelId, type AvailableModel } from "../services/copilot.js";
import { getAvailableStyles, getStyleDescription, type IconStyle } from "../utils/image-prompt.js";
import { type ImageProvider, getAvailableProviders } from "../services/image.js";

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
  | { type: "icon"; prompt?: string }
  | { type: "feature"; prompt?: string }
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
  
  // Image generation
  "/icon": { type: "icon" },
  "/feature": { type: "feature" },
  "/graphic": { type: "feature" },
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
  
  // Check for /icon <optional prompt> command
  if (lowered.startsWith("/icon ")) {
    const prompt = trimmed.slice(6).trim();
    return { type: "icon", prompt: prompt || undefined };
  }
  
  // Check for /feature <optional prompt> command
  if (lowered.startsWith("/feature ") || lowered.startsWith("/graphic ")) {
    const cmdLen = lowered.startsWith("/feature") ? 9 : 9;
    const prompt = trimmed.slice(cmdLen).trim();
    return { type: "feature", prompt: prompt || undefined };
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

// ════════════════════════════════════════════════════════════════════════════
// IMAGE GENERATION PROMPTS
// ════════════════════════════════════════════════════════════════════════════

export type ImageSubjectMode = "auto" | "custom" | "describe";

/**
 * Prompt user to select an image generation provider
 */
export async function promptImageProvider(): Promise<ImageProvider> {
  const providers = getAvailableProviders();
  
  const choices = providers.map(p => ({
    name: p === "openai" ? "OpenAI (gpt-image-1.5)" : "Google Gemini",
    value: p,
  }));

  return await select({
    message: c.brand("Select image provider"),
    choices,
    loop: true,
    theme: {
      prefix: "  " + c.brand("🎨"),
    },
  });
}

/**
 * Prompt user to choose how the image subject is described
 */
export async function promptImageSubject(imageType: "icon" | "feature", appName: string, appDesc: string): Promise<string> {
  const label = imageType === "icon" ? "App Icon" : "Feature Graphic";
  const autoPrompt = imageType === "icon"
    ? `App icon for "${appName}": ${appDesc}`
    : `Feature graphic for "${appName}": ${appDesc}`;

  const mode = await select<ImageSubjectMode>({
    message: c.brand(`${label} — how do you want to describe it?`),
    choices: [
      {
        name: `Auto ${c.dim("— use app name & description")}`,
        value: "auto" as ImageSubjectMode,
      },
      {
        name: `Describe what to draw ${c.dim("— type a visual description")}`,
        value: "describe" as ImageSubjectMode,
      },
      {
        name: `Full custom prompt ${c.dim("— replace the entire prompt")}`,
        value: "custom" as ImageSubjectMode,
      },
    ],
    theme: {
      prefix: "  " + c.brand("🎨"),
    },
  });

  switch (mode) {
    case "auto":
      return autoPrompt;

    case "describe": {
      const description = await input({
        message: c.brand("Describe what the image should look like"),
        validate: (v) => v.trim().length > 0 || "Please enter a description",
        theme: { prefix: "  " + c.brand("✏️") },
      });
      // Combine user's visual description with app context
      return `${label} for "${appName}": ${description.trim()}`;
    }

    case "custom": {
      const custom = await input({
        message: c.brand("Enter your full custom prompt"),
        validate: (v) => v.trim().length > 5 || "Prompt too short",
        theme: { prefix: "  " + c.brand("✏️") },
      });
      return custom.trim();
    }

    default:
      return autoPrompt;
  }
}

/**
 * Prompt user to optionally select an icon style (grouped by category)
 */
export async function promptImageStyle(): Promise<IconStyle | undefined> {
  // Categorized for easier scanning
  const styleGroups: Array<{ label: string; styles: IconStyle[] }> = [
    { label: "Clean & Modern", styles: ["minimalism", "flat", "gradient", "material"] },
    { label: "Playful & Friendly", styles: ["clay", "cute", "kawaii", "game"] },
    { label: "Premium & Shiny", styles: ["glassy", "neon", "holographic"] },
    { label: "Textured & Crafted", styles: ["woven", "geometric", "pixel"] },
    { label: "Platform-specific", styles: ["ios-classic", "android-material"] },
  ];

  type Choice = { name: string; value: string; disabled?: string };
  const choices: Choice[] = [
    { name: c.success("✦ None") + c.dim(" — let the AI decide"), value: "__none__" },
  ];

  for (const group of styleGroups) {
    // Section separator
    choices.push({ name: c.brand(`── ${group.label} ──`), value: "__sep__", disabled: " " });
    for (const s of group.styles) {
      choices.push({
        name: `  ${s} ${c.dim("— " + getStyleDescription(s))}`,
        value: s,
      });
    }
  }

  const result = await select({
    message: c.brand("Select style"),
    choices,
    loop: true,
    theme: {
      prefix: "  " + c.brand("🎨"),
    },
  });

  return result === "__none__" ? undefined : result as IconStyle;
}

/**
 * Show a summary of what will be generated and ask for confirmation
 */
export async function promptImageConfirm(params: {
  imageType: "icon" | "feature";
  provider: string;
  style: string | undefined;
  promptPreview: string;
}): Promise<"generate" | "edit" | "cancel"> {
  const { imageType, provider, style, promptPreview } = params;
  const label = imageType === "icon" ? "App Icon" : "Feature Graphic";
  const dims = imageType === "icon" ? "1024×1024" : "1024×500";

  console.log();
  console.log("  " + c.whiteBold(`🎨 ${label} — Preview`));
  console.log("  " + c.border("─".repeat(60)));
  console.log("  " + c.dim("Provider: ") + c.text(provider === "openai" ? "OpenAI" : "Gemini"));
  console.log("  " + c.dim("Style:    ") + c.text(style || "auto"));
  console.log("  " + c.dim("Size:     ") + c.text(dims));
  console.log("  " + c.dim("Subject:  ") + c.text(promptPreview.length > 80 ? promptPreview.slice(0, 77) + "..." : promptPreview));
  console.log();

  return await select({
    message: c.brand("Ready?"),
    choices: [
      { name: c.success("✓ Generate"), value: "generate" as const },
      { name: c.info("✏️  Edit settings"), value: "edit" as const },
      { name: c.dim("✗ Cancel"), value: "cancel" as const },
    ],
    theme: {
      prefix: "  " + c.brand("🎨"),
    },
  });
}
