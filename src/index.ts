#!/usr/bin/env node

/**
 * ASO Copilot CLI v1.0
 * Expo EAS Metadata Generator for iOS App Store
 * 
 * Chat-style interface with slash commands.
 */

import { createRequire } from "module";
import { Command } from "commander";
import { ExitPromptError } from "@inquirer/core";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");
import { confirm } from "@inquirer/prompts";

// ════════════════════════════════════════════════════════════════════════════
// CTRL+C HANDLING
// ════════════════════════════════════════════════════════════════════════════

let lastCtrlCTime = 0;
const DOUBLE_CTRL_C_WINDOW_MS = 1000;

function shouldExitOnCtrlC(): boolean {
  const now = Date.now();
  if (now - lastCtrlCTime < DOUBLE_CTRL_C_WINDOW_MS) {
    return true;
  }
  lastCtrlCTime = now;
  return false;
}

import {
  clearScreen,
  printHeader,
  printAppInfo,
  printStatusBar,
  printInlineStatus,
  printTitles,
  printContent,
  printKeywordScores,
  printHelp,
  printSuccess,
  printError,
  printGoodbye,
  CONTENT_ICONS,
  CONTENT_LABELS,
} from "./ui/display.js";
import {
  promptAppName,
  promptAppDescription,
  promptAppStoreUrl,
  promptModel,
  promptCommand,
  parseCommand,
  getAvailableModels,
  type ContentType,
} from "./ui/prompts.js";
import { 
  CopilotService, 
  checkAuth, 
  startLoginFlow, 
  fetchAvailableModels,
  type ModelId, 
} from "./services/copilot.js";
import { fetchAppStoreMetadata, isAppStoreUrl } from "./utils/appstore.js";
import { exportStoreConfig, extractFirstOption, extractDescription, parseKeywordsFromContent } from "./utils/export.js";
import { copyToClipboard, extractNumberedItems } from "./utils/clipboard.js";
import { c, ICON } from "./ui/themes.js";
import type { AppInfo, GeneratedMetadata } from "./types.js";

const program = new Command();

// ════════════════════════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════════════════════════

interface AppState {
  appInfo: AppInfo;
  model: ModelId;
  service: CopilotService | null;
  lastContent: string;
  lastContentType: ContentType | null;
  generatedMetadata: GeneratedMetadata;
}

const state: AppState = {
  appInfo: {
    name: "",
    description: "",
  },
  model: "gpt-4o",
  service: null,
  lastContent: "",
  lastContentType: null,
  generatedMetadata: {},
};

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

async function handleCtrlC(): Promise<void> {
  if (shouldExitOnCtrlC()) {
    console.log();
    printGoodbye();
    await state.service?.cleanup();
    process.exit(0);
  }
  console.log();
  console.log(c.muted("  Press Ctrl+C again to exit"));
}

function isPremium(model: string): boolean {
  const models = getAvailableModels();
  const info = models.find(m => m.id === model);
  return info?.premium ?? false;
}

function getQuota() {
  const q = state.service?.getQuotaInfo();
  if (!q) return undefined;
  return {
    used: q.usedRequests,
    total: q.totalRequests,
    isUnlimited: q.isUnlimited,
  };
}

function refreshScreen(): void {
  clearScreen();
  printHeader();
  printAppInfo(state.appInfo);
  
  const modelInfo = state.service?.getModelInfo();
  printStatusBar(
    modelInfo?.name || state.model,
    modelInfo?.premium || isPremium(state.model),
    getQuota()
  );
}

function showPromptStatus(): void {
  const modelInfo = state.service?.getModelInfo();
  printInlineStatus(
    modelInfo?.name || state.model,
    modelInfo?.premium || isPremium(state.model),
    state.appInfo.name
  );
}

/**
 * Store generated content for export
 */
function storeMetadata(contentType: ContentType, content: string): void {
  switch (contentType) {
    case "title":
      state.generatedMetadata.title = extractFirstOption(content);
      break;
    case "subtitle":
      state.generatedMetadata.subtitle = extractFirstOption(content);
      break;
    case "description":
      state.generatedMetadata.description = extractDescription(content);
      break;
    case "keywords":
      state.generatedMetadata.keywords = parseKeywordsFromContent(content);
      break;
    case "releaseNotes":
      state.generatedMetadata.releaseNotes = extractDescription(content);
      break;
    case "promoText":
      state.generatedMetadata.promoText = extractFirstOption(content);
      break;
    case "full":
      // Full package - try to extract all
      state.generatedMetadata.title = extractFirstOption(content);
      state.generatedMetadata.description = extractDescription(content);
      state.generatedMetadata.keywords = parseKeywordsFromContent(content);
      break;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN FLOW
// ════════════════════════════════════════════════════════════════════════════

async function run(): Promise<void> {
  // Show header
  clearScreen();
  printHeader();

  // Check authentication first
  console.log();
  console.log(`  ${c.muted(ICON.spinner)} Checking authentication...`);
  const authStatus = await checkAuth();

  if (!authStatus.isAuthenticated) {
    console.log();
    console.log(c.warning("  You are not logged in to GitHub Copilot."));
    console.log();
    
    let shouldLogin: boolean;
    try {
      shouldLogin = await confirm({
        message: c.brand("Would you like to log in now?"),
        default: true,
        theme: {
          prefix: "  " + c.brand(ICON.model),
        },
      });
    } catch (error) {
      if (error instanceof ExitPromptError) {
        console.log();
        printGoodbye();
        process.exit(0);
      }
      throw error;
    }

    if (shouldLogin) {
      console.log();
      console.log(c.muted("  Starting login flow..."));
      console.log();
      
      const loginSuccess = await startLoginFlow();
      
      if (!loginSuccess) {
        console.log();
        printError("Login failed or was cancelled.");
        console.log(c.muted("  You can try again by running: gh auth login"));
        console.log();
        process.exit(1);
      }
      
      const recheck = await checkAuth();
      if (!recheck.isAuthenticated) {
        printError("Still not authenticated after login attempt.");
        process.exit(1);
      }
      
      console.log();
      printSuccess(`Logged in as ${recheck.login || "GitHub user"}`);
    } else {
      console.log();
      console.log(c.muted("  To log in later, run: gh auth login"));
      console.log();
      process.exit(0);
    }
  } else {
    console.log(`  ${c.success(ICON.check)} Logged in as ${c.brand(authStatus.login || "GitHub user")}`);
  }

  // Fetch available models dynamically
  console.log(`  ${c.muted(ICON.spinner)} Loading available models...`);
  await fetchAvailableModels();
  console.log(`  ${c.success(ICON.check)} Models loaded`);

  // Get app info
  console.log();
  
  try {
    state.appInfo.name = await promptAppName();
  } catch (error) {
    if (error instanceof ExitPromptError) {
      console.log();
      printGoodbye();
      process.exit(0);
    }
    throw error;
  }

  try {
    state.appInfo.description = await promptAppDescription();
  } catch (error) {
    if (error instanceof ExitPromptError) {
      console.log();
      printGoodbye();
      process.exit(0);
    }
    throw error;
  }

  // Optional: App Store URL for competitor analysis
  try {
    const appStoreUrl = await promptAppStoreUrl();
    if (appStoreUrl && isAppStoreUrl(appStoreUrl)) {
      console.log(`  ${c.muted(ICON.spinner)} Fetching App Store metadata...`);
      const metadata = await fetchAppStoreMetadata(appStoreUrl);
      if (metadata) {
        state.appInfo.appStoreUrl = appStoreUrl;
        state.appInfo.currentMetadata = metadata;
        console.log(`  ${c.success(ICON.check)} Found: ${metadata.trackName}`);
      } else {
        console.log(`  ${c.warning(ICON.warn)} Could not fetch app metadata`);
      }
    }
  } catch (error) {
    if (error instanceof ExitPromptError) {
      console.log();
      printGoodbye();
      process.exit(0);
    }
    throw error;
  }

  // Select model
  console.log();
  try {
    state.model = await promptModel() as ModelId;
  } catch (error) {
    if (error instanceof ExitPromptError) {
      console.log();
      printGoodbye();
      process.exit(0);
    }
    throw error;
  }

  // Initialize Copilot
  state.service = new CopilotService(state.appInfo, state.model);
  
  try {
    await state.service.initialize();
  } catch (error) {
    printError(error instanceof Error ? error.message : "Failed to connect");
    process.exit(1);
  }

  // Show initial screen with help
  refreshScreen();
  printHelp();

  // Chat loop
  while (true) {
    showPromptStatus();
    
    let input: string;
    try {
      input = await promptCommand();
    } catch (error) {
      if (error instanceof ExitPromptError) {
        await handleCtrlC();
        continue;
      }
      throw error;
    }
    
    const command = parseCommand(input);

    switch (command.type) {
      case "quit":
        printGoodbye();
        await state.service?.cleanup();
        process.exit(0);
        break;

      case "help":
        console.log();
        printHelp();
        break;

      case "clear":
        refreshScreen();
        break;

      case "last":
        if (state.lastContent && state.lastContentType) {
          console.log();
          displayLastContent();
        } else {
          printError("No content generated yet.");
        }
        break;

      case "model":
        try {
          const newModel = await promptModel(state.model) as ModelId;
          if (newModel !== state.model) {
            await state.service.switchModel(newModel);
            state.model = newModel;
            printSuccess(`Switched to ${newModel}`);
          }
        } catch (error) {
          if (error instanceof ExitPromptError) {
            await handleCtrlC();
            break;
          }
          throw error;
        }
        break;

      case "copy":
        if (state.lastContent) {
          const copied = await copyToClipboard(state.lastContent);
          if (copied) {
            printSuccess("Copied to clipboard!");
          }
        } else {
          printError("Nothing to copy yet. Generate some content first.");
        }
        break;

      case "export":
        await handleExport();
        break;

      case "score":
        await handleScore(command.keyword);
        break;

      case "url":
        await handleImportUrl();
        break;

      case "content":
        await handleContent(command.contentType);
        break;

      case "chat":
        if (command.message) {
          await handleChat(command.message);
        }
        break;
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CONTENT HANDLERS
// ════════════════════════════════════════════════════════════════════════════

async function handleContent(type: ContentType): Promise<void> {
  console.log();
  
  const result = await state.service!.generate(type);

  if (!result.success) {
    printError(result.error || "Generation failed");
    return;
  }

  state.lastContent = result.content;
  state.lastContentType = type;
  
  // Store for export
  storeMetadata(type, result.content);

  displayLastContent();
}

function displayLastContent(): void {
  if (!state.lastContent || !state.lastContentType) return;
  
  const type = state.lastContentType;

  if (type === "title" || type === "subtitle" || type === "promoText") {
    const items = extractNumberedItems(state.lastContent);
    if (items.length > 0) {
      printTitles(items);
    } else {
      printContent(state.lastContent, CONTENT_LABELS[type], CONTENT_ICONS[type]);
    }
  } else if (type === "keywords") {
    printKeywordScores(state.lastContent);
  } else {
    printContent(state.lastContent, CONTENT_LABELS[type], CONTENT_ICONS[type]);
  }
}

async function handleChat(message: string): Promise<void> {
  if (!state.lastContent || !state.lastContentType) {
    printError("Generate some content first, then you can refine it with natural language.");
    console.log("  " + "Try /title or /desc to get started.");
    console.log();
    return;
  }

  console.log();
  
  const result = await state.service!.refineContent(
    state.lastContentType,
    state.lastContent,
    message
  );

  if (!result.success) {
    printError(result.error || "Refinement failed");
    return;
  }

  state.lastContent = result.content;
  storeMetadata(state.lastContentType, result.content);
  displayLastContent();
}

async function handleScore(keyword: string): Promise<void> {
  console.log();
  
  const result = await state.service!.scoreKeyword(keyword);

  if (!result.success) {
    printError(result.error || "Scoring failed");
    return;
  }

  printKeywordScores(result.content);
}

async function handleExport(): Promise<void> {
  // Check if we have any metadata to export
  const hasMetadata = Object.values(state.generatedMetadata).some(v => v !== undefined);
  
  if (!hasMetadata) {
    printError("No metadata generated yet. Generate some content first with /title, /desc, etc.");
    return;
  }

  try {
    const folderPath = await exportStoreConfig(state.generatedMetadata, state.appInfo.name);
    printSuccess(`Exported to ${folderPath}/store.config.json`);
  } catch (error) {
    printError(error instanceof Error ? error.message : "Export failed");
  }
}

async function handleImportUrl(): Promise<void> {
  try {
    const url = await promptAppStoreUrl();
    if (!url) {
      return;
    }
    
    if (!isAppStoreUrl(url)) {
      printError("Please enter a valid App Store URL or app ID");
      return;
    }

    console.log(`  ${c.muted(ICON.spinner)} Fetching App Store metadata...`);
    const metadata = await fetchAppStoreMetadata(url);
    
    if (metadata) {
      state.appInfo.appStoreUrl = url;
      state.appInfo.currentMetadata = metadata;
      printSuccess(`Imported: ${metadata.trackName} (${metadata.primaryGenreName})`);
      refreshScreen();
    } else {
      printError("Could not fetch app metadata from that URL");
    }
  } catch (error) {
    if (error instanceof ExitPromptError) {
      await handleCtrlC();
      return;
    }
    throw error;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CLI SETUP
// ════════════════════════════════════════════════════════════════════════════

program
  .name("aso-copilot")
  .description("Expo EAS Metadata Generator for iOS App Store")
  .version(version);

program
  .action(async () => {
    await run();
  });

program.parse();
