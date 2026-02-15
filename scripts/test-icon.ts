#!/usr/bin/env npx tsx
/**
 * Icon Generation Test Bench
 * 
 * Usage:
 *   npx tsx scripts/test-icon.ts                          # defaults (CalAI, minimalism)
 *   npx tsx scripts/test-icon.ts --style clay             # pick a style
 *   npx tsx scripts/test-icon.ts --style all              # generate ALL styles
 *   npx tsx scripts/test-icon.ts --prompt "custom prompt" # override prompt entirely
 *   npx tsx scripts/test-icon.ts --dry                    # just print the prompt, no API call
 *   npx tsx scripts/test-icon.ts --list-styles            # list available styles
 *   npx tsx scripts/test-icon.ts --provider openai        # use OpenAI instead of Gemini
 *   npx tsx scripts/test-icon.ts --quality 2k             # Gemini quality (1k, 2k, 4k)
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import {
  buildIconPrompt,
  getAvailableStyles,
  getStyleDescription,
  type IconStyle,
} from "../src/utils/image-prompt.js";
import { generateImage, getAvailableProviders, type ImageProvider } from "../src/services/image.js";

// ════════════════════════════════════════════════════════════════════════════
// DEFAULT APP INFO (CalAI)
// ════════════════════════════════════════════════════════════════════════════

const DEFAULT_APP_NAME = "CalAI";
const DEFAULT_APP_DESC =
  `AI-powered calorie & nutrition tracker. ` +
  `Snap a photo of your meal, AI identifies ingredients and estimates calories, protein, carbs, fat. ` +
  `Smart calorie pacing ring, daily/weekly/monthly stats, visual charts. ` +
  `Clean minimal design, green/white palette, health & wellness category.`;

// ════════════════════════════════════════════════════════════════════════════
// CLI ARGUMENT PARSING
// ════════════════════════════════════════════════════════════════════════════

interface TestConfig {
  prompt: string;
  style?: IconStyle;
  allStyles: boolean;
  dryRun: boolean;
  listStyles: boolean;
  provider: ImageProvider;
  quality: "1k" | "2k" | "4k";
  outputDir: string;
}

function parseArgs(): TestConfig {
  const args = process.argv.slice(2);
  const config: TestConfig = {
    prompt: `App icon for "${DEFAULT_APP_NAME}": ${DEFAULT_APP_DESC}`,
    style: undefined,
    allStyles: false,
    dryRun: false,
    listStyles: false,
    provider: "gemini",
    quality: "1k",
    outputDir: join(process.cwd(), "test-icons"),
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--prompt":
      case "-p":
        config.prompt = args[++i];
        break;
      case "--style":
      case "-s":
        const styleVal = args[++i];
        if (styleVal === "all") {
          config.allStyles = true;
        } else {
          config.style = styleVal as IconStyle;
        }
        break;
      case "--dry":
      case "-d":
        config.dryRun = true;
        break;
      case "--list-styles":
      case "-l":
        config.listStyles = true;
        break;
      case "--provider":
        config.provider = args[++i] as ImageProvider;
        break;
      case "--quality":
      case "-q":
        config.quality = args[++i] as "1k" | "2k" | "4k";
        break;
      case "--output":
      case "-o":
        config.outputDir = args[++i];
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }
  return config;
}

function printHelp() {
  console.log(`
Icon Generation Test Bench
==========================

Usage:
  npx tsx scripts/test-icon.ts [options]

Options:
  --prompt, -p <text>     Custom prompt (default: CalAI app description)
  --style, -s <style>     Style preset (e.g. minimalism, clay, gradient)
                          Use "all" to generate every style
  --dry, -d               Dry run: print the built prompt without calling API
  --list-styles, -l       List all available styles and exit
  --provider <name>       openai | gemini (default: gemini)
  --quality, -q <level>   Gemini quality: 1k | 2k | 4k (default: 1k)
  --output, -o <dir>      Output directory (default: ./test-icons)
  --help, -h              Show this help

Examples:
  npx tsx scripts/test-icon.ts --dry                   # preview prompt
  npx tsx scripts/test-icon.ts --style clay --dry      # preview clay prompt  
  npx tsx scripts/test-icon.ts --style gradient        # generate with gradient style
  npx tsx scripts/test-icon.ts --style all             # generate ALL 16 styles
  npx tsx scripts/test-icon.ts --prompt "A camera lens with a leaf growing out of it, representing AI food photography"
`);
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function separator(label?: string) {
  const line = "─".repeat(72);
  if (label) {
    console.log(`\n${"═".repeat(72)}`);
    console.log(`  ${label}`);
    console.log(`${"═".repeat(72)}`);
  } else {
    console.log(line);
  }
}

function savePromptToFile(prompt: string, style: string, outputDir: string) {
  mkdirSync(outputDir, { recursive: true });
  const filename = `prompt-${style || "default"}.txt`;
  const filepath = join(outputDir, filename);
  writeFileSync(filepath, prompt, "utf-8");
  console.log(`  📝 Prompt saved to: ${filepath}`);
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

async function generateSingleIcon(
  prompt: string,
  style: IconStyle | undefined,
  config: TestConfig,
): Promise<void> {
  const styleName = style || "no-style";
  separator(`🎨  Style: ${styleName}`);

  // Build the prompt
  const builtPrompt = buildIconPrompt({ prompt, style });

  // Print prompt stats
  console.log(`\n  Prompt length: ${builtPrompt.length} chars`);
  console.log(`  Style: ${style ? `${style} — ${getStyleDescription(style)}` : "(none / default look)"}`);
  console.log(`  Provider: ${config.provider}`);

  if (config.dryRun) {
    console.log(`\n--- BUILT PROMPT START ---`);
    console.log(builtPrompt);
    console.log(`--- BUILT PROMPT END ---\n`);
    savePromptToFile(builtPrompt, styleName, config.outputDir);
    return;
  }

  // Actually generate
  console.log(`\n  ⏳ Generating...`);
  const startTime = Date.now();

  try {
    const result = await generateImage({
      type: "icon",
      prompt,
      provider: config.provider,
      style,
      outputDir: config.outputDir,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const sizeKB = (result.fileSize / 1024).toFixed(0);

    console.log(`  ✅ Generated in ${elapsed}s`);
    console.log(`  📁 ${result.filePath}`);
    console.log(`  📐 ${result.width}×${result.height} ${result.format.toUpperCase()}`);
    console.log(`  💾 ${sizeKB} KB`);

    // Rename to include style in filename for easy comparison
    const newName = `icon-${styleName}-${Date.now()}.png`;
    const newPath = join(config.outputDir, newName);
    const { renameSync } = await import("fs");
    renameSync(result.filePath, newPath);
    console.log(`  📎 Renamed to: ${newName}`);
  } catch (error) {
    console.error(`  ❌ FAILED: ${error instanceof Error ? error.message : error}`);
  }
}

async function main() {
  const config = parseArgs();

  // List styles mode
  if (config.listStyles) {
    console.log("\nAvailable Icon Styles:");
    separator();
    for (const style of getAvailableStyles()) {
      console.log(`  ${style.padEnd(20)} ${getStyleDescription(style)}`);
    }
    console.log();
    return;
  }

  // Header
  console.log("\n🔬 Icon Generation Test Bench");
  separator();
  console.log(`  App: ${DEFAULT_APP_NAME}`);
  console.log(`  Provider: ${config.provider}`);
  console.log(`  Quality: ${config.quality}`);
  console.log(`  Output: ${config.outputDir}`);
  console.log(`  Dry run: ${config.dryRun}`);

  // Check provider availability
  if (!config.dryRun) {
    const available = getAvailableProviders();
    if (!available.includes(config.provider)) {
      console.error(`\n❌ Provider "${config.provider}" not available.`);
      console.error(`   Available: ${available.length ? available.join(", ") : "none (set GEMINI_API_KEY or OPENAI_API_KEY)"}`);
      process.exit(1);
    }
  }

  mkdirSync(config.outputDir, { recursive: true });

  if (config.allStyles) {
    // Generate all styles
    const styles = getAvailableStyles();
    console.log(`\n  Generating ${styles.length} styles...`);

    for (const style of styles) {
      await generateSingleIcon(config.prompt, style, config);
    }

    // Also generate with no style (default)
    await generateSingleIcon(config.prompt, undefined, config);

    separator("📊 Summary");
    console.log(`  Total: ${styles.length + 1} icons (${styles.length} styles + default)`);
    console.log(`  Output: ${config.outputDir}`);
  } else {
    // Single style
    await generateSingleIcon(config.prompt, config.style, config);
  }

  console.log();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
