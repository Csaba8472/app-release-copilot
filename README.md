# app-release-copilot

An interactive CLI for generating AI-powered App Store Optimization (ASO) metadata for iOS apps using the GitHub Copilot SDK.

## Features

- **Title Options** - Generate 5 compelling app titles (30 char limit)
- **Subtitles** - Generate subtitles that complement your title (30 char limit)
- **App Description** - SEO-optimized descriptions with hooks and features (4000 chars)
- **Keywords** - AI-analyzed keywords with traffic/difficulty scores (100 char limit)
- **Release Notes** - What's New content for updates (4000 chars)
- **Promo Text** - Short promotional taglines (170 chars)
- **App Icon** - Generate a SnapAI-backed 1024×1024 app icon image
- **Feature Graphic** - Generate a SnapAI-backed Android-ready 1024×500 PNG/JPEG
- **Full Package** - Generate all metadata at once
- **Keyword Scoring** - Analyze any keyword for traffic & competition
- **Export** - Generate Expo `store.config.json` for EAS Metadata

### Model Selection

- **Dynamic models:** Available models are fetched from the Copilot API at startup
- **Change anytime:** Use `/model` command to switch models
- **Premium indicators:** Models marked with lightning bolt consume premium requests

## Prerequisites

1. **GitHub Copilot** - Active subscription (individual, business, or enterprise)
2. **GitHub CLI** - Install from [cli.github.com](https://cli.github.com)
3. **ASO Keywords MCP Server** - The app connects to my MCP server for keyword traffic/difficulty scoring

### Authentication

The app checks authentication on startup. If not authenticated, it will prompt you to log in interactively via `gh auth login`.

## Installation

From source:

```bash
git clone https://github.com/Csaba8472/app-release-copilot
cd app-release-copilot
npm install
npm run build
npm link
```

## Usage

```bash
# Start interactive mode
app-release-copilot
```

You'll be prompted to enter:
1. Your app name
2. A description of what your app does
3. (Optional) An App Store URL for competitor analysis

## Chat-Style Interface

App Release Copilot uses a chat-style interface with slash commands:

### Content Commands

| Command | Description |
|---------|-------------|
| `/title` | Generate titles (30 chars) |
| `/subtitle` | Generate subtitles (30 chars) |
| `/desc` | Generate App Store description |
| `/keywords` | Generate keywords with scoring |
| `/release` | Generate What's New content |
| `/promo` | Generate promo text (170 chars) |
| `/icon` | Generate SnapAI app icon |
| `/feature` | Generate SnapAI Android feature graphic |
| `/full` | Generate complete ASO package |

### Utility Commands

| Command | Description |
|---------|-------------|
| `/score <kw>` | Score a specific keyword |
| `/research` | Find good keywords (popularity > 40, difficulty < 60) |
| `/export` | Export store.config.json |
| `/apikey` | Show/set/reset SnapAI API key (`/apikey set`, `/apikey reset`) |
| `/copy` | Copy last content to clipboard |
| `/last` | Show last generated content |
| `/model` | Switch AI model |
| `/url` | Import App Store competitor |
| `/clear` | Clear screen |
| `/help` | Show available commands |
| `/quit` | Exit the app |

`/icon` and `/feature` are backed by SnapAI. If no key is configured, the CLI prompts for your SnapAI API key and stores it in your user config directory (`%APPDATA%\app-release-copilot` on Windows, `~/.app-release-copilot` otherwise). You can also onboard manually with `/apikey set`, check with `/apikey`, and clear with `/apikey reset`. Environment variables `SNAPAI_API_KEY` and `OPENAI_API_KEY` are still supported as fallback.

### Natural Language Refinement

After generating content, type naturally to refine it:

```
> /title              # Generate 5 titles
> more like 3         # Get variations of title #3
> make them shorter   # Refine all titles
> focus on feature X  # Apply feedback
> /copy               # Copy the result
```

## Available AI Models

Models are fetched dynamically from the GitHub Copilot API at startup. Common models include:

- **GPT-4o** - Fast, high-quality responses (typically default)
- **Claude Sonnet** - Anthropic's latest model
- **o-series** - Advanced reasoning models

Premium models (billing multiplier > 1) display a lightning bolt indicator.

## Expo EAS Metadata Integration

The `/export` command generates a `store.config.json` file compatible with Expo EAS Metadata:

```json
{
  "configVersion": 0,
  "apple": {
    "info": {
      "en-US": {
        "title": "Your App Title",
        "subtitle": "Your Subtitle",
        "description": "Full description...",
        "keywords": ["keyword1", "keyword2"],
        "releaseNotes": "What's new...",
        "promoText": "Short promo text"
      }
    }
  }
}
```

## Tech Stack

- **@github/copilot-sdk** - AI orchestration via GitHub Copilot
- **@inquirer/prompts** - Beautiful interactive prompts
- **commander** - CLI argument parsing
- **chalk + ora** - Terminal styling and spinners
- **clipboardy** - System clipboard access

## Acknowledgments

Special thanks to [video-promo](https://github.com/burkeholland/video-promo) by Burke Holland, which was the starting point for this project.

## License

MIT
