/**
 * Theme system for ASO Copilot TUI
 * Beautiful terminal styling with gradients and box drawing
 */

import chalk from "chalk";

// ════════════════════════════════════════════════════════════════════════════
// COLOR PALETTE
// ════════════════════════════════════════════════════════════════════════════

export const COLORS = {
  // Brand gradient (blue to purple - App Store vibes)
  brand1: "#007AFF",
  brand2: "#5856D6",
  brand3: "#AF52DE",
  
  // UI colors
  bg: "#0d1117",
  bgLight: "#161b22",
  bgPanel: "#21262d",
  
  // Text hierarchy
  text: "#e6edf3",
  textDim: "#8b949e",
  textMuted: "#484f58",
  
  // Semantic
  success: "#3fb950",
  warning: "#d29922",
  error: "#f85149",
  info: "#58a6ff",
  premium: "#a371f7",
  
  // Borders
  border: "#30363d",
  borderFocus: "#58a6ff",
};

// ════════════════════════════════════════════════════════════════════════════
// CHALK SHORTCUTS
// ════════════════════════════════════════════════════════════════════════════

export const c = {
  // Brand
  brand: chalk.hex(COLORS.brand1),
  brandBold: chalk.hex(COLORS.brand1).bold,
  
  // Text
  text: chalk.hex(COLORS.text),
  dim: chalk.hex(COLORS.textDim),
  muted: chalk.hex(COLORS.textMuted),
  white: chalk.white,
  whiteBold: chalk.white.bold,
  
  // Semantic
  success: chalk.hex(COLORS.success),
  successBold: chalk.hex(COLORS.success).bold,
  warning: chalk.hex(COLORS.warning),
  warningBold: chalk.hex(COLORS.warning).bold,
  error: chalk.hex(COLORS.error),
  errorBold: chalk.hex(COLORS.error).bold,
  info: chalk.hex(COLORS.info),
  infoBold: chalk.hex(COLORS.info).bold,
  premium: chalk.hex(COLORS.premium),
  premiumBold: chalk.hex(COLORS.premium).bold,
  
  // Special
  border: chalk.hex(COLORS.border),
  number: chalk.yellow,
  key: chalk.cyan,
  
  // Backgrounds
  bgSuccess: chalk.bgHex(COLORS.success).hex(COLORS.bg).bold,
  bgError: chalk.bgHex(COLORS.error).hex(COLORS.bg).bold,
  bgInfo: chalk.bgHex(COLORS.info).hex(COLORS.bg).bold,
  bgPremium: chalk.bgHex(COLORS.premium).hex(COLORS.bg).bold,
  bgBrand: chalk.bgHex(COLORS.brand1).hex(COLORS.bg).bold,
};

// ════════════════════════════════════════════════════════════════════════════
// BOX DRAWING CHARACTERS
// ════════════════════════════════════════════════════════════════════════════

export const BOX = {
  // Rounded corners
  tl: "╭", tr: "╮", bl: "╰", br: "╯",
  // Lines
  h: "─", v: "│",
  // T-junctions
  lt: "├", rt: "┤", tt: "┬", bt: "┴",
  // Cross
  x: "┼",
  // Double lines
  dh: "═", dv: "║",
  dtl: "╔", dtr: "╗", dbl: "╚", dbr: "╝",
};

// ════════════════════════════════════════════════════════════════════════════
// ICONS
// ════════════════════════════════════════════════════════════════════════════

export const ICON = {
  // Content types (ASO)
  app: "📱",
  title: "🎯",
  subtitle: "📝",
  description: "📄",
  keywords: "🔑",
  release: "🆕",
  promo: "✨",
  
  // Actions
  copy: "📋",
  export: "💾",
  score: "📊",
  link: "🔗",
  
  // Status
  check: "✓",
  cross: "✗",
  warn: "⚠",
  info: "ℹ",
  spinner: "◌",
  
  // Misc
  rocket: "🚀",
  sparkle: "✨",
  bolt: "⚡",
  model: "🤖",
};

// ════════════════════════════════════════════════════════════════════════════
// ASCII ART HEADER
// ════════════════════════════════════════════════════════════════════════════

const LOGO_LINES = [
  " █████╗ ███████╗ ██████╗      ██████╗ ██████╗ ██████╗ ██╗██╗      ██████╗ ████████╗",
  "██╔══██╗██╔════╝██╔═══██╗    ██╔════╝██╔═══██╗██╔══██╗██║██║     ██╔═══██╗╚══██╔══╝",
  "███████║███████╗██║   ██║    ██║     ██║   ██║██████╔╝██║██║     ██║   ██║   ██║   ",
  "██╔══██║╚════██║██║   ██║    ██║     ██║   ██║██╔═══╝ ██║██║     ██║   ██║   ██║   ",
  "██║  ██║███████║╚██████╔╝    ╚██████╗╚██████╔╝██║     ██║███████╗╚██████╔╝   ██║   ",
  "╚═╝  ╚═╝╚══════╝ ╚═════╝      ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝ ╚═════╝    ╚═╝   ",
];

const GRADIENT_COLORS = [
  "#007AFF", "#2687FF", "#4C94FF", "#5856D6", "#8944AB", "#AF52DE",
];

export function renderLogo(): string[] {
  return LOGO_LINES.map((line, i) => {
    const color = GRADIENT_COLORS[i] || GRADIENT_COLORS[GRADIENT_COLORS.length - 1];
    return chalk.hex(color)(line);
  });
}

// ════════════════════════════════════════════════════════════════════════════
// BOX HELPERS
// ════════════════════════════════════════════════════════════════════════════

export function stripAnsi(str: string): string {
  return str.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ""
  );
}

/**
 * Draw a box around content
 */
export function box(content: string[], options: {
  width?: number;
  title?: string;
  titleAlign?: "left" | "center" | "right";
  padding?: number;
  borderColor?: typeof c.border;
} = {}): string[] {
  const {
    width = 80,
    title,
    titleAlign = "left",
    padding = 1,
    borderColor = c.border,
  } = options;

  const innerWidth = width - 2;
  const result: string[] = [];
  const pad = " ".repeat(padding);
  
  // Top border with optional title
  if (title) {
    const titleText = ` ${title} `;
    let topLine: string;
    
    if (titleAlign === "center") {
      const leftPad = Math.floor((innerWidth - titleText.length) / 2);
      const rightPad = innerWidth - leftPad - titleText.length;
      topLine = borderColor(BOX.tl + BOX.h.repeat(leftPad)) + 
                c.whiteBold(titleText) + 
                borderColor(BOX.h.repeat(rightPad) + BOX.tr);
    } else if (titleAlign === "right") {
      const leftPad = innerWidth - titleText.length - 2;
      topLine = borderColor(BOX.tl + BOX.h.repeat(leftPad)) + 
                c.whiteBold(titleText) + 
                borderColor(BOX.h.repeat(2) + BOX.tr);
    } else {
      topLine = borderColor(BOX.tl + BOX.h.repeat(2)) + 
                c.whiteBold(titleText) + 
                borderColor(BOX.h.repeat(innerWidth - titleText.length - 2) + BOX.tr);
    }
    result.push(topLine);
  } else {
    result.push(borderColor(BOX.tl + BOX.h.repeat(innerWidth) + BOX.tr));
  }
  
  // Empty line for top padding
  for (let i = 0; i < padding; i++) {
    result.push(borderColor(BOX.v) + " ".repeat(innerWidth) + borderColor(BOX.v));
  }
  
  // Content lines
  for (const line of content) {
    const stripped = stripAnsi(line);
    const contentWidth = innerWidth - padding * 2;
    const rightPadding = contentWidth - stripped.length;
    result.push(
      borderColor(BOX.v) + pad + line + " ".repeat(Math.max(0, rightPadding)) + pad + borderColor(BOX.v)
    );
  }
  
  // Empty line for bottom padding
  for (let i = 0; i < padding; i++) {
    result.push(borderColor(BOX.v) + " ".repeat(innerWidth) + borderColor(BOX.v));
  }
  
  // Bottom border
  result.push(borderColor(BOX.bl + BOX.h.repeat(innerWidth) + BOX.br));
  
  return result;
}

/**
 * Create a progress bar
 */
export function progressBar(percent: number, width = 20): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  
  let color = c.success;
  if (percent < 25) color = c.error;
  else if (percent < 50) color = c.warning;
  
  return color("█".repeat(filled)) + c.muted("░".repeat(empty));
}

/**
 * Create a model badge
 */
export function modelBadge(name: string, isPremium: boolean): string {
  if (isPremium) {
    return c.bgPremium(` ${name} `) + " " + c.premium(ICON.bolt);
  }
  return chalk.bgHex(COLORS.border).hex(COLORS.text)(` ${name} `);
}
