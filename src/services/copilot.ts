/**
 * Copilot client service - manages the AI session lifecycle
 * Configured with MCP server for ASO keyword scoring
 */

import { CopilotClient, type SessionEvent, type ModelInfo } from "@github/copilot-sdk";
import ora, { type Ora } from "ora";
import { spawn } from "child_process";
import type { ContentType } from "../ui/prompts.js";
import type { AppInfo, CHAR_LIMITS } from "../types.js";
import { c } from "../ui/themes.js";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface GenerationResult {
  content: string;
  success: boolean;
  error?: string;
}

export interface QuotaInfo {
  model?: string;
  usedRequests: number;
  totalRequests: number;
  remainingPercentage: number;
  resetDate?: string;
  isUnlimited: boolean;
}

export interface SessionContext {
  appInfo: AppInfo;
  generatedContent: Map<ContentType, string>;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  login?: string;
  authType?: "user" | "env" | "gh-cli" | "hmac" | "api-key" | "token";
  statusMessage?: string;
  host?: string;
}

export interface AvailableModel {
  id: string;
  name: string;
  premium: boolean;
}

export type ModelId = string;

// ════════════════════════════════════════════════════════════════════════════
// MCP SERVER CONFIG
// ════════════════════════════════════════════════════════════════════════════

const MCP_SERVERS = {
  "aso-keywords": {
    type: "http" as const,
    url: "https://aso-mcp.vercel.app/api/mcp",
    tools: ["*"], // All tools from this server
  },
};

// ════════════════════════════════════════════════════════════════════════════
// ASO SYSTEM PROMPT
// ════════════════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT_ASO = `
<role>
You are an iOS App Store Optimization (ASO) expert. Your job is to generate compelling, keyword-rich metadata for Expo apps that maximizes discoverability, conversion rates, and App Store rankings.
</role>

<capabilities>
You have access to a tool:
- get_keyword_scores: Analyze keyword traffic and difficulty scores for App Store keywords. Use this to validate keyword choices.

When generating keywords, you should call get_keyword_scores on the top candidates to provide data-driven recommendations.
</capabilities>

<expo_metadata_limits>
CRITICAL: All content must fit within Expo EAS Metadata character limits:
- title: 2-30 characters (app name in store)
- subtitle: max 30 characters (appears below title)
- description: 10-4000 characters (main store description)
- keywords: max 100 characters TOTAL including commas (comma-separated list)
- releaseNotes: max 4000 characters (what's new)
- promoText: max 170 characters (short tagline, can be updated without app review)
</expo_metadata_limits>

<aso_best_practices>
TITLE:
- Front-load the most important keyword
- Keep it memorable and brandable
- Don't keyword stuff - it hurts conversion

SUBTITLE:
- Use for secondary keywords or value proposition
- Complement the title, don't repeat it
- Should make sense when read with title

DESCRIPTION:
- First 3 lines are critical (visible before "Read More")
- Use bullet points for features (•)
- Include social proof if available
- Natural keyword integration, not stuffing
- Strong call-to-action at the end

KEYWORDS:
- No spaces after commas (saves characters)
- Don't repeat words from title/subtitle (Apple already indexes them)
- Include common misspellings
- Mix high-traffic and low-competition keywords
- Use singular forms (Apple matches plurals automatically)

PROMO TEXT:
- Great for seasonal updates or feature highlights
- Can be changed without app review
- Use for A/B testing messaging
</aso_best_practices>

<output_rules>
CRITICAL: Output ONLY the formatted content. No preamble, no explanations, no "here's what I generated" text. Start directly with the content.

When generating keyword lists, always include character count: "Keywords (87/100 chars)"
</output_rules>
`;

// ════════════════════════════════════════════════════════════════════════════
// CONTENT PROMPTS
// ════════════════════════════════════════════════════════════════════════════

function getContentPrompt(
  contentType: ContentType,
  appInfo: AppInfo
): string {
  const { name, description, currentMetadata } = appInfo;
  
  const competitorContext = currentMetadata 
    ? `\nCurrent App Store listing for reference:\n- Title: ${currentMetadata.trackName}\n- Description: ${currentMetadata.description?.substring(0, 500)}...\n- Category: ${currentMetadata.primaryGenreName}`
    : "";

  const prompts: Record<ContentType, string> = {
    title: `
Generate 5 App Store title options for this app:

App Name: "${name}"
App Description: ${description}
${competitorContext}

Requirements:
- Each title must be 2-30 characters
- Front-load important keywords
- Make it memorable and brandable

## 🎯 Title Options

1. [Title] (X chars)
2. [Title] (X chars)
3. [Title] (X chars)
4. [Title] (X chars)
5. [Title] (X chars)
`,

    subtitle: `
Generate 5 App Store subtitle options for this app:

App Name: "${name}"
App Description: ${description}
${competitorContext}

Requirements:
- Each subtitle must be max 30 characters
- Complement the title, don't repeat keywords from it
- Highlight key value proposition or feature

## 📝 Subtitle Options

1. [Subtitle] (X chars)
2. [Subtitle] (X chars)
3. [Subtitle] (X chars)
4. [Subtitle] (X chars)
5. [Subtitle] (X chars)
`,

    description: `
Generate an App Store description for this app:

App Name: "${name}"
App Description: ${description}
${competitorContext}

Requirements:
- 10-4000 characters (aim for 1500-2500 for readability)
- First 3 lines are CRITICAL - visible before "Read More"
- Use bullet points (•) for features
- Natural keyword integration
- End with strong call-to-action

## 📱 App Store Description

[Hook paragraph - compelling opening]

[Features with bullet points]

[Social proof or differentiators]

[Call-to-action]

(Character count: X/4000)
`,

    keywords: `
Generate optimized App Store keywords for this app:

App Name: "${name}"
App Description: ${description}
${competitorContext}

Requirements:
- MAX 100 characters total including commas
- NO spaces after commas
- Don't repeat words already in title/subtitle
- Mix high-traffic and niche keywords
- Use singular forms

First, identify 10-15 potential keywords, then call get_keyword_scores on the top candidates to validate traffic/difficulty.

## 🔑 Keywords

**Analysis:**
[List keywords with their scores]

**Final Keyword String (X/100 chars):**
\`keyword1,keyword2,keyword3,...\`
`,

    releaseNotes: `
Generate "What's New" release notes for this app:

App Name: "${name}"
App Description: ${description}
${competitorContext}

Requirements:
- Max 4000 characters
- Highlight new features, improvements, bug fixes
- Use bullet points for clarity
- Keep it scannable and user-friendly

## 🆕 What's New

[Version X.X release notes]

(Character count: X/4000)
`,

    promoText: `
Generate 5 promotional text options for this app:

App Name: "${name}"
App Description: ${description}
${competitorContext}

Requirements:
- Each promoText must be max 170 characters
- Can be seasonal, feature-focused, or value-driven
- Great for A/B testing different messages

## ✨ Promo Text Options

1. [Promo text] (X chars)
2. [Promo text] (X chars)
3. [Promo text] (X chars)
4. [Promo text] (X chars)
5. [Promo text] (X chars)
`,

    full: `
Generate a COMPLETE Expo store.config.json metadata package for this app:

App Name: "${name}"
App Description: ${description}
${competitorContext}

Generate ALL of the following:

# Complete ASO Package

## 🎯 Title Options (5 options, 2-30 chars each)

## 📝 Subtitle Options (5 options, max 30 chars each)

## 📱 App Store Description (10-4000 chars)

## 🔑 Keywords (max 100 chars total)
First analyze with get_keyword_scores, then provide final string.

## 🆕 What's New (max 4000 chars)

## ✨ Promo Text Options (5 options, max 170 chars each)
`,
  };

  return prompts[contentType];
}

function getRefinementPrompt(
  contentType: ContentType,
  currentContent: string,
  feedback: string,
  appInfo: AppInfo
): string {
  const contentLabels: Record<ContentType, string> = {
    title: "title options",
    subtitle: "subtitle options",
    description: "description",
    keywords: "keywords",
    releaseNotes: "release notes",
    promoText: "promo text options",
    full: "metadata package",
  };

  const label = contentLabels[contentType];

  return `
The user wants to refine the ${label}. Here is the current content:

---
${currentContent}
---

App Name: "${appInfo.name}"
App Description: ${appInfo.description}

USER FEEDBACK: "${feedback}"

Based on this feedback, generate an improved version of the ${label}.
Remember to respect character limits and ASO best practices.

Output the refined ${label} using the same format as before.
`;
}

// ════════════════════════════════════════════════════════════════════════════
// CACHED MODELS
// ════════════════════════════════════════════════════════════════════════════

let cachedModels: AvailableModel[] | null = null;

/**
 * Check if the user is authenticated with GitHub Copilot.
 */
export async function checkAuth(): Promise<AuthStatus> {
  const client = new CopilotClient({
    autoStart: true,
    autoRestart: false,
  });

  try {
    await client.start();
    const status = await client.getAuthStatus();
    await client.stop();
    return {
      isAuthenticated: status.isAuthenticated,
      login: status.login,
      authType: status.authType,
      statusMessage: status.statusMessage,
      host: status.host,
    };
  } catch {
    try {
      await client.forceStop();
    } catch {
      // Ignore cleanup errors
    }
    return { isAuthenticated: false };
  }
}

/**
 * Start the interactive login flow using GitHub CLI.
 */
export async function startLoginFlow(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn("gh", ["auth", "login"], {
      stdio: "inherit",
      shell: true,
    });

    child.on("close", (code) => {
      resolve(code === 0);
    });

    child.on("error", () => {
      resolve(false);
    });
  });
}

/**
 * Fetch available models from the Copilot SDK.
 */
export async function fetchAvailableModels(): Promise<AvailableModel[]> {
  if (cachedModels) {
    return cachedModels;
  }

  const client = new CopilotClient({
    autoStart: true,
    autoRestart: false,
  });

  try {
    await client.start();
    
    const authStatus = await client.getAuthStatus();
    if (!authStatus.isAuthenticated) {
      throw new Error("Not authenticated");
    }

    const models = await client.listModels();
    await client.stop();

    cachedModels = models.map((m: ModelInfo) => ({
      id: m.id,
      name: m.name,
      premium: m.billing?.multiplier ? m.billing.multiplier > 1 : false,
    }));

    return cachedModels;
  } catch {
    try {
      await client.forceStop();
    } catch {
      // Ignore cleanup errors
    }
    return getFallbackModels();
  }
}

/**
 * Get cached models or fallback
 */
export function getAvailableModels(): AvailableModel[] {
  return cachedModels ?? getFallbackModels();
}

function getFallbackModels(): AvailableModel[] {
  return [
    { id: "gpt-4o", name: "GPT-4o", premium: false },
    { id: "gpt-4.1", name: "GPT-4.1", premium: false },
    { id: "claude-sonnet-4", name: "Claude Sonnet 4", premium: true },
  ];
}

// ════════════════════════════════════════════════════════════════════════════
// COPILOT SERVICE CLASS
// ════════════════════════════════════════════════════════════════════════════

export class CopilotService {
  private client: CopilotClient | null = null;
  private session!: Awaited<ReturnType<CopilotClient["createSession"]>>;
  private spinner: Ora;
  private context: SessionContext;
  private currentModel: ModelId;
  private quotaInfo: QuotaInfo | null = null;

  constructor(appInfo: AppInfo, model: ModelId = "gpt-4o") {
    this.spinner = ora();
    this.currentModel = model;
    this.context = {
      appInfo,
      generatedContent: new Map(),
    };
  }

  getModel(): ModelId {
    return this.currentModel;
  }

  getQuotaInfo(): QuotaInfo | null {
    return this.quotaInfo;
  }

  getModelInfo(): AvailableModel | undefined {
    const models = getAvailableModels();
    return models.find(m => m.id === this.currentModel);
  }

  /**
   * Switch to a different model
   */
  async switchModel(newModel: ModelId): Promise<void> {
    if (newModel === this.currentModel) {
      return;
    }

    const models = getAvailableModels();
    this.spinner.start(`Switching to ${models.find(m => m.id === newModel)?.name || newModel}...`);

    try {
      if (this.session) {
        try {
          await this.session.destroy();
        } catch {
          // Ignore destroy errors
        }
      }

      this.currentModel = newModel;
      
      if (!this.client) {
        throw new Error("Service not initialized. Call initialize() first.");
      }
      
      this.session = await this.client.createSession({
        model: this.currentModel,
        streaming: true,
        mcpServers: MCP_SERVERS,
        systemMessage: {
          mode: "append",
          content: SYSTEM_PROMPT_ASO,
        },
      });

      const modelInfo = models.find(m => m.id === this.currentModel);
      const modelDisplay = modelInfo ? modelInfo.name : this.currentModel;
      this.spinner.succeed(c.success(`Switched to ${modelDisplay}`));
    } catch (error) {
      this.spinner.fail(c.error("Failed to switch model"));
      throw error;
    }
  }

  /**
   * Initialize the Copilot client and create a session with MCP server
   */
  async initialize(): Promise<void> {
    this.spinner.start("Connecting to GitHub Copilot...");

    try {
      this.client = new CopilotClient({
        autoStart: true,
        autoRestart: true,
      });
      await this.client.start();

      this.spinner.text = "Checking authentication...";
      const authStatus = await this.client.getAuthStatus();
      if (!authStatus.isAuthenticated) {
        throw new Error(
          "Not authenticated with GitHub Copilot.\n\n" +
          "  Run 'copilot auth' in your terminal to log in."
        );
      }

      this.spinner.text = "Creating AI session with ASO tools...";

      this.session = await this.client.createSession({
        model: this.currentModel,
        streaming: true,
        mcpServers: MCP_SERVERS,
        systemMessage: {
          mode: "append",
          content: SYSTEM_PROMPT_ASO,
        },
      });

      const models = getAvailableModels();
      const modelInfo = models.find(m => m.id === this.currentModel);
      const modelDisplay = modelInfo ? modelInfo.name : this.currentModel;
      this.spinner.succeed(c.success(`Connected to GitHub Copilot (${modelDisplay})`));
    } catch (error) {
      this.spinner.fail(c.error("Failed to connect"));
      throw error;
    }
  }

  /**
   * Generate specific content type
   */
  async generate(
    contentType: ContentType,
    options: { regenerate?: boolean } = {}
  ): Promise<GenerationResult> {
    const { regenerate = false } = options;

    if (regenerate) {
      this.context.generatedContent.delete(contentType);
    }

    const cached = this.context.generatedContent.get(contentType);
    if (cached && !regenerate) {
      return { content: cached, success: true };
    }

    const prompt = getContentPrompt(contentType, this.context.appInfo);

    this.spinner.start(getSpinnerText(contentType));

    try {
      let content = await this.streamGeneration(prompt, contentType);
      content = cleanOutput(content);
      
      this.context.generatedContent.set(contentType, content);

      this.spinner.succeed(c.success(getSuccessText(contentType)));
      return { content, success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.spinner.fail(c.error(`Failed to generate ${contentType}`));
      return { content: "", success: false, error: errorMessage };
    }
  }

  /**
   * Score a keyword using the MCP tool
   */
  async scoreKeyword(keyword: string): Promise<GenerationResult> {
    const prompt = `
Call the get_keyword_scores tool to analyze this App Store keyword: "${keyword}"

Country: us (United States)

After getting the scores, provide a brief analysis:
- Traffic Score (1-10): How much search volume
- Difficulty Score (1-10): How hard to rank
- Difficulty Index (0-100): Industry-standard metric
- Recommendation: Is this keyword worth targeting?
`;

    this.spinner.start(`Analyzing keyword: "${keyword}"...`);

    try {
      let content = await this.streamGeneration(prompt, "keywords");
      content = cleanOutput(content);

      this.spinner.succeed(c.success(`Keyword "${keyword}" analyzed!`));
      return { content, success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.spinner.fail(c.error(`Failed to score keyword`));
      return { content: "", success: false, error: errorMessage };
    }
  }

  /**
   * Stream generation with event handling
   */
  private async streamGeneration(
    prompt: string,
    contentType: ContentType
  ): Promise<string> {
    let output = "";
    let isGeneratingContent = false;
    let toolsCompleted = 0;
    const contentLabel = getContentLabel(contentType);

    const done = new Promise<void>((resolve, reject) => {
      this.session.on((event: SessionEvent) => {
        switch (event.type) {
          case "assistant.message_delta":
            if ("deltaContent" in event.data && event.data.deltaContent) {
              output += event.data.deltaContent;
              
              if (!isGeneratingContent) {
                isGeneratingContent = true;
                this.spinner.text = `✨ Writing ${contentLabel}...`;
              }
              
              const lines = output.split("\n").length;
              if (lines > 3) {
                this.spinner.text = `✨ Writing ${contentLabel}... (${lines} lines)`;
              }
            }
            break;

          case "tool.execution_start":
            if ("toolName" in event.data) {
              const friendlyName = getToolFriendlyName(event.data.toolName);
              this.spinner.text = `${friendlyName.emoji} ${friendlyName.action}`;
            }
            break;

          case "tool.execution_complete":
            if ("success" in event.data && event.data.success) {
              toolsCompleted++;
              this.spinner.text = `${c.success("✓")} Tool completed (${toolsCompleted})`;
            }
            break;

          case "assistant.usage":
            if ("quotaSnapshots" in event.data && event.data.quotaSnapshots) {
              const snapshots = event.data.quotaSnapshots as Record<string, {
                isUnlimitedEntitlement: boolean;
                entitlementRequests: number;
                usedRequests: number;
                remainingPercentage: number;
                resetDate?: string;
              }>;
              const firstKey = Object.keys(snapshots)[0];
              if (firstKey) {
                const snapshot = snapshots[firstKey];
                this.quotaInfo = {
                  model: "model" in event.data ? String(event.data.model) : this.currentModel,
                  usedRequests: snapshot.usedRequests,
                  totalRequests: snapshot.entitlementRequests,
                  remainingPercentage: snapshot.remainingPercentage,
                  resetDate: snapshot.resetDate,
                  isUnlimited: snapshot.isUnlimitedEntitlement,
                };
              }
            }
            break;

          case "session.idle":
            resolve();
            break;

          case "session.error":
            if ("message" in event.data) {
              reject(new Error(event.data.message));
            } else {
              reject(new Error("Session error occurred"));
            }
            break;
        }
      });
    });

    await this.session.send({ prompt });
    await done;

    return output;
  }

  /**
   * Refine content based on user feedback
   */
  async refineContent(
    contentType: ContentType,
    currentContent: string,
    feedback: string
  ): Promise<GenerationResult> {
    const prompt = getRefinementPrompt(
      contentType,
      currentContent,
      feedback,
      this.context.appInfo
    );

    const label = getContentLabel(contentType);

    this.spinner.start(`Refining ${label}...`);

    try {
      let content = await this.streamGeneration(prompt, contentType);
      content = cleanOutput(content);

      this.context.generatedContent.set(contentType, content);

      this.spinner.succeed(c.success(`${label} refined!`));
      return { content, success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.spinner.fail(c.error(`Failed to refine ${label}`));
      return { content: "", success: false, error: errorMessage };
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.session) {
      try {
        await this.session.destroy();
      } catch {
        // Ignore destroy errors
      }
    }
    if (this.client) {
      try {
        await this.client.stop();
      } catch {
        try {
          await this.client.forceStop();
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function getSpinnerText(contentType: ContentType): string {
  const texts: Record<ContentType, string> = {
    title: "🎯 Crafting app titles...",
    subtitle: "📝 Writing subtitles...",
    description: "📱 Generating App Store description...",
    keywords: "🔑 Researching keywords...",
    releaseNotes: "🆕 Writing release notes...",
    promoText: "✨ Creating promo text...",
    full: "🚀 Generating complete ASO package...",
  };
  return texts[contentType];
}

function getContentLabel(contentType: ContentType): string {
  const labels: Record<ContentType, string> = {
    title: "title options",
    subtitle: "subtitle options",
    description: "description",
    keywords: "keywords",
    releaseNotes: "release notes",
    promoText: "promo text",
    full: "ASO package",
  };
  return labels[contentType];
}

function getSuccessText(contentType: ContentType): string {
  const texts: Record<ContentType, string> = {
    title: "Titles generated!",
    subtitle: "Subtitles ready!",
    description: "Description ready!",
    keywords: "Keywords optimized!",
    releaseNotes: "Release notes done!",
    promoText: "Promo text ready!",
    full: "Full ASO package complete!",
  };
  return texts[contentType];
}

function getToolFriendlyName(toolName: string): { emoji: string; action: string } {
  const toolMap: Record<string, { emoji: string; action: string }> = {
    get_keyword_scores: { emoji: "📊", action: "Analyzing keyword scores..." },
  };
  
  const normalizedName = toolName.toLowerCase().replace(/-/g, "_");
  
  if (normalizedName.includes("keyword")) {
    return toolMap.get_keyword_scores;
  }
  
  return { emoji: "⚙️", action: `Running ${toolName}...` };
}

function cleanOutput(text: string): string {
  const headingMatch = text.match(/(#{1,2}\s+[^\n]+)/);
  
  if (headingMatch && headingMatch.index !== undefined) {
    const fromHeading = text.substring(headingMatch.index).trim();
    return fromHeading;
  }
  
  return text.trim();
}
