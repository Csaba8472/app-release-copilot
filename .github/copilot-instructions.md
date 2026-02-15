# App Release Copilot - Copilot Instructions

## Project Overview

App Release Copilot v1.0 is a chat-style CLI for generating AI-powered App Store Optimization (ASO) metadata for iOS apps using the GitHub Copilot SDK. It generates metadata compatible with Expo EAS Metadata format.

## Publishing Workflow

When the user says "publish", follow these steps exactly:

1. **Commit any pending changes:**
   ```bash
   git add -A && git commit -m "<descriptive message>"
   ```

2. **Bump version (patch by default, or as specified):**
   ```bash
   npm version patch   # or minor/major if specified
   ```

3. **Push commits and tags to GitHub:**
   ```bash
   git push && git push --tags
   ```

4. **Publish to npm:**
   ```bash
   npm publish
   ```

The `prepublishOnly` script automatically runs `npm run build` before publishing.

**Version is read dynamically** from package.json in `src/index.ts` using `createRequire`, so no manual version updates are needed in code.

## Authentication Flow

1. App starts and calls `checkAuth()` to verify authentication status
2. If not authenticated, prompts user: "Would you like to log in now?"
3. If yes, spawns `gh auth login` interactively for the user
4. After login, re-verifies authentication
5. Once authenticated, fetches available models via `client.listModels()`

### Key Auth Functions (src/services/copilot.ts)

```typescript
// Check if user is authenticated (returns AuthStatus)
export async function checkAuth(): Promise<AuthStatus>

// Start interactive login flow (spawns `gh auth login`)
export async function startLoginFlow(): Promise<boolean>

// Fetch models from SDK (caches result)
export async function fetchAvailableModels(): Promise<AvailableModel[]>

// Get cached models (with fallback)
export function getAvailableModels(): AvailableModel[]
```

### Ctrl+C / Exit Handling

- **Double Ctrl+C to exit** - Single Ctrl+C shows "Press Ctrl+C again to exit" hint
- **1 second window** - Two Ctrl+C presses within 1 second triggers graceful exit
- **ExitPromptError handling** - All @inquirer/prompts calls wrapped with try/catch
- **Graceful cleanup** - On exit, calls `state.service?.cleanup()` and `printGoodbye()`
- **Setup phase** - During initial prompts (app name, description, model), single Ctrl+C exits gracefully

## Interface Design

The interface uses **slash commands** for a chat-like experience:

```
/title      Generate title options (30 chars)
/subtitle   Generate subtitles (30 chars)
/desc       Generate App Store description (4000 chars)
/keywords   Generate keywords with scoring (100 chars)
/release    Generate What's New content
/promo      Generate promo text (170 chars)
/full       Generate complete ASO package

/score <kw> Score a specific keyword
/research   Find good keywords (popularity > 40, difficulty < 60)
/export     Export store.config.json
/copy       Copy last content to clipboard
/model      Switch AI model
/url        Import App Store competitor
/help       Show available commands
/quit       Exit the app
```

## Visual Components

- **ASCII Art Header** - Gradient-colored "ARC COPILOT" block letter logo (blue to purple)
- **App Info Panel** - Box showing current app name, description, App Store URL
- **Status Bar** - Model badge, quota display, "/help for commands" hint
- **Content Panels** - Generated content displayed in styled sections
- **Character Counts** - Color-coded character count indicators (green ≤80%, yellow ≤100%, red >100%)

## Key Architecture

### Main Entry Point

- **`src/index.ts`** - Main CLI with:
  - State management via `AppState` object (includes lastContent, generatedMetadata)
  - `refreshScreen()` for consistent redraws
  - Chat loop with `promptCommand()` → `parseCommand()` → handlers
  - Commander.js argument parsing
  - `storeMetadata()` for accumulating generated content for export

### UI Components

- **`src/ui/themes.ts`** - Theme system:
  - `COLORS` - Color palette (blue-to-purple App Store gradient)
  - `c` - Chalk color shortcuts
  - `BOX` - Box-drawing characters
  - `ICON` - Emoji icons for ASO (📱, 🎯, 🔑, etc.)
  - `renderLogo()`, `box()`, `progressBar()`, `modelBadge()`

- **`src/ui/display.ts`** - Screen rendering:
  - `printHeader()` - ASCII art + tagline
  - `printAppInfo()` - App info box
  - `printStatusBar()` - Model + quota + "/help for commands" hint
  - `printHelp()` - Available commands list
  - `printTitles()`, `printContent()`, `printKeywordScores()` - Content display
  - `formatCharCount()` - Character count with color coding

- **`src/ui/prompts.ts`** - Interactive prompts:
  - `promptAppName()` - App name input
  - `promptAppDescription()` - App description input
  - `promptAppStoreUrl()` - Optional App Store URL for competitor analysis
  - `promptModel()` - Model selection
  - `promptCommand()` - Main chat input
  - `parseCommand()` - Parse slash commands into Command type

### Types (src/types.ts)

```typescript
// App information
interface AppInfo {
  name: string;
  description: string;
  appStoreUrl?: string;
  currentMetadata?: AppStoreMetadata;
}

// Expo store.config.json format
interface ExpoStoreConfig {
  configVersion: 0;
  apple: {
    info: { "en-US": ExpoAppleInfo }
  }
}

// Character limits from Expo schema
const CHAR_LIMITS = {
  title: 30,
  subtitle: 30,
  description: 4000,
  keywords: 100,
  releaseNotes: 4000,
  promoText: 170,
}
```

### Command Types

```typescript
type Command = 
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
```

### Services

- **`src/services/copilot.ts`** - Copilot client:
  - ASO-specific system prompt with character limits and best practices
  - MCP server integration for keyword scoring (`aso-keywords`)
  - Content generation with streaming
  - `scoreKeyword()` for individual keyword analysis
  - Authentication check and login flow

### Utilities

- **`src/utils/appstore.ts`** - App Store metadata fetching:
  - `fetchAppStoreMetadata()` - iTunes Lookup API integration
  - `extractAppStoreId()` - Parse App Store URLs
  - `isAppStoreUrl()` - Validate URL format

- **`src/utils/export.ts`** - Export utilities:
  - `buildStoreConfig()` - Build Expo store.config.json
  - `exportStoreConfig()` - Write to dated folder
  - `parseKeywordsFromContent()` - Extract keyword arrays
  - `extractFirstOption()` - Get first numbered item

- **`src/utils/clipboard.ts`** - Clipboard utilities:
  - `copyToClipboard()` - System clipboard access
  - `extractNumberedItems()` - Parse numbered lists

## Content Types

```typescript
ContentType = "title" | "subtitle" | "description" | "keywords" 
            | "releaseNotes" | "promoText" | "full"
```

## MCP Server Integration

The app connects to an ASO keyword scoring MCP server:

```typescript
const MCP_SERVERS = {
  "aso-keywords": {
    type: "http",
    url: "https://aso-mcp.vercel.app/api/mcp",
    tools: ["*"],
  },
};
```

This provides the `get_keyword_scores` tool for analyzing keyword traffic and difficulty.

## UI/UX Principles

1. **Chat-Style Interface** - Type slash commands naturally
2. **Natural Language Refinement** - Type without slash to refine content
3. **Character Limit Awareness** - Color-coded counts for App Store limits
4. **Persistent Layout** - Header, app panel, status bar always visible
5. **Last Content Tracking** - `/copy` copies most recently generated content
6. **Export Ready** - Generate Expo-compatible store.config.json
7. **Brand Colors** - Blue-to-purple gradient (App Store vibes)
8. **Graceful Exit** - Double Ctrl+C required to exit

## Natural Language Chat

After generating content, users can refine it by typing naturally:

```
❯  /title                     # Generate 5 titles
❯  more like 3                # Get variations of title #3
❯  make them shorter          # Refine all titles
❯  focus on productivity      # Apply feedback
❯  /export                    # Export to store.config.json
```
