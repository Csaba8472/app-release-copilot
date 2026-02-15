/**
 * Image prompt builders for ASO Copilot
 * Icon prompt adapted from SnapAI (https://github.com/betomoedano/snapai)
 * Feature graphic prompt is original for ASO Copilot
 */

// ════════════════════════════════════════════════════════════════════════════
// STYLE TYPES & DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

export type IconStyle =
  | "minimalism"
  | "glassy"
  | "woven"
  | "geometric"
  | "neon"
  | "gradient"
  | "flat"
  | "material"
  | "ios-classic"
  | "android-material"
  | "pixel"
  | "game"
  | "clay"
  | "holographic"
  | "kawaii"
  | "cute";

interface StyleDefinition {
  id: IconStyle;
  systemName: string;
  summary: string;
  culturalDna?: readonly string[];
  description: string;
  visualTraits?: readonly string[];
  mandatory?: readonly string[];
  forbidden?: readonly string[];
  avoid?: readonly string[];
  checklist?: readonly string[];
  includeBaseRules: boolean;
}

const STYLE_DEFINITIONS: Record<IconStyle, StyleDefinition> = {
  minimalism: {
    id: "minimalism",
    systemName: "MINIMALISM",
    summary: "Extreme reduction: single dominant symbol, max 3 colors, must work in monochrome.",
    culturalDna: ["Swiss design", "Apple", "Braun", "Dieter Rams"],
    description: "Extreme reduction focused on clarity and function.",
    visualTraits: ["max 3 colors", "simple primary silhouettes", "large negative space"],
    mandatory: ["Must be readable at very small sizes", "Must work in monochrome", "Single dominant symbol"],
    forbidden: ["Gradients", "Shadows", "3D effects", "Decorative details", "Textures"],
    avoid: ["Over-design", "Complex metaphors", "Visual noise"],
    checklist: ["Can it be drawn in under 5 strokes?", "Is it clear without color?", "Is it recognizable at 24px?"],
    includeBaseRules: true,
  },
  glassy: {
    id: "glassy",
    systemName: "GLASSY",
    summary: "Glassmorphism (iOS 15+/VisionOS): translucent, layered, rounded glass.",
    culturalDna: ["iOS 15+", "VisionOS", "Glassmorphism"],
    description: "Translucent, layered, glass-like appearance.",
    visualTraits: ["transparency: true", "blur: soft background blur", "edges: rounded", "layers: floating"],
    mandatory: ["Blur must be subtle", "Icon must interact with background", "Maintain legibility through contrast"],
    forbidden: ["Flat opacity without blur", "Harsh shadows", "No reflections"],
    avoid: ["Over-blurring", "Heavy solid colors"],
    checklist: ["Does it feel like glass?", "Does it float above the background?"],
    includeBaseRules: true,
  },
  woven: {
    id: "woven",
    systemName: "WOVEN",
    summary: "Handmade textile craft: braided/woven rhythm with tactile fabric texture.",
    culturalDna: ["Textile craft", "Handmade culture", "Organic design"],
    description: "Interlaced, tactile, handcrafted visual language.",
    visualTraits: ["patterns: woven or braided", "lines: organic", "texture: fabric-like"],
    mandatory: ["Must feel handmade", "Visible weaving rhythm", "Tactile appearance"],
    forbidden: ["Perfect geometry", "Hard symmetry", "Ultra-clean digital look"],
    avoid: ["Sterile vector perfection", "Hard shadows"],
    includeBaseRules: true,
  },
  geometric: {
    id: "geometric",
    systemName: "GEOMETRIC",
    summary: "Bauhaus/system geometry: strict grid, measurable shapes, exact symmetry.",
    culturalDna: ["Bauhaus", "Mathematics", "System design"],
    description: "Strict geometry governed by grids and proportions.",
    visualTraits: ["shapes: circles, squares, triangles", "alignment: grid-based", "symmetry: exact"],
    mandatory: ["All elements must follow a grid", "Everything must be measurable", "Consistent geometry"],
    forbidden: ["Organic curves", "Textures", "Hand-drawn irregularities"],
    includeBaseRules: true,
  },
  neon: {
    id: "neon",
    systemName: "NEON",
    summary: "Cyberpunk nightlife glow: high saturation, extreme contrast, dark background.",
    culturalDna: ["Cyberpunk", "Nightlife", "Gaming"],
    description: "High-energy glowing visuals designed for dark environments.",
    visualTraits: ["colors: high saturation", "glow: strong and visible", "background: dark"],
    mandatory: ["Glow is required", "Dark background assumed", "High contrast"],
    forbidden: ["Muted colors", "White background", "Weak glow"],
    includeBaseRules: true,
  },
  gradient: {
    id: "gradient",
    systemName: "GRADIENT",
    summary: "Modern social-app gradients: smooth clean color flow (max 4 colors).",
    culturalDna: ["Modern social apps", "Instagram-era UI"],
    description: "Smooth color transitions used as a primary design element.",
    visualTraits: ["max 4 colors", "smooth transitions", "intentional direction/flow"],
    mandatory: ["Clean gradient transitions", "Clear gradient direction", "No banding"],
    forbidden: ["Dirty gradients", "Too many colors", "Textures over gradients"],
    includeBaseRules: true,
  },
  flat: {
    id: "flat",
    systemName: "FLAT",
    summary: "Pure flat corporate clarity: solid colors, zero depth, zero shadows.",
    culturalDna: ["Microsoft design", "Corporate clarity"],
    description: "Purely flat, functional, neutral icons.",
    visualTraits: ["depth: none", "colors: solid", "effects: false"],
    mandatory: ["No depth", "No shadows", "Clear contrast"],
    forbidden: ["Gradients", "Shadows", "3D effects"],
    includeBaseRules: true,
  },
  material: {
    id: "material",
    systemName: "MATERIAL",
    summary: "Material Design layering: subtle depth with soft directional shadows.",
    culturalDna: ["Google Material Design"],
    description: "Layered design simulating physical materials.",
    visualTraits: ["layers: true", "shadows: soft and directional", "depth: subtle"],
    mandatory: ["Consistent elevation", "Clear hierarchy", "Soft shadows"],
    forbidden: ["Harsh shadows", "Extreme realism"],
    includeBaseRules: true,
  },
  "ios-classic": {
    id: "ios-classic",
    systemName: "IOS-CLASSIC",
    summary: "Pre-iOS7 skeuomorphism: high detail, realistic materials, explicit lighting.",
    culturalDna: ["Pre-iOS7 Apple", "Skeuomorphism"],
    description: "Highly detailed, realistic icons mimicking physical objects.",
    visualTraits: ["detail: high", "materials: realistic", "lighting: explicit"],
    forbidden: ["Flat design", "Extreme minimalism"],
    includeBaseRules: false,
  },
  "android-material": {
    id: "android-material",
    systemName: "ANDROID-MATERIAL",
    summary: "Android Material 3: modern shapes, dynamic color, gentle depth cues.",
    culturalDna: ["Android Material 3"],
    description: "Material 3-inspired icons with modern geometry and gentle depth cues.",
    visualTraits: ["clean geometry", "dynamic color", "subtle depth cues"],
    mandatory: ["Clear hierarchy", "Gentle depth cues", "Clean shapes"],
    forbidden: ["Photoreal textures", "Messy realism", "Harsh shadows"],
    includeBaseRules: true,
  },
  pixel: {
    id: "pixel",
    systemName: "PIXEL",
    summary: "8-bit pixel grid icons: strict pixel alignment, low-resolution look.",
    culturalDna: ["8-bit gaming", "Retro computing"],
    description: "Icons built on strict pixel grids.",
    visualTraits: ["grid: pixel-based", "edges: hard", "resolution: low"],
    mandatory: ["Pixel grid alignment", "No blur", "No anti-aliasing"],
    forbidden: ["Smooth curves", "Gradients", "Soft edges"],
    includeBaseRules: false,
  },
  game: {
    id: "game",
    systemName: "GAME",
    summary: "Game UI icons: expressive, high-impact, fantasy/action energy.",
    culturalDna: ["Video game UI", "Fantasy and exaggeration"],
    description: "Expressive, high-impact icons designed for gameplay interfaces.",
    visualTraits: ["contrast: high", "style: expressive", "theme: fantasy or action"],
    forbidden: ["Corporate neutrality", "Over-minimalism"],
    includeBaseRules: true,
  },
  clay: {
    id: "clay",
    systemName: "CLAY",
    summary: "Claymorphism: soft rounded volumetric forms, pastel palette, diffuse shadows.",
    culturalDna: ["Claymorphism", "Friendly UI"],
    description: "Soft, rounded, clay-like volumetric icons.",
    visualTraits: ["volume: soft", "colors: pastel", "shadows: diffuse"],
    forbidden: ["Hard edges", "Aggressive colors"],
    includeBaseRules: true,
  },
  holographic: {
    id: "holographic",
    systemName: "HOLOGRAPHIC",
    summary: "Iridescent hologram visuals: visible color-shift and dynamic light interaction.",
    culturalDna: ["Sci-fi", "Futurism", "Iridescent materials"],
    description: "Light-reactive, color-shifting hologram visuals.",
    visualTraits: ["color_shift: true", "lighting: dynamic", "material: iridescent"],
    forbidden: ["Flat color", "No light interaction"],
    includeBaseRules: true,
  },
  kawaii: {
    id: "kawaii",
    systemName: "KAWAII",
    summary: "Japanese kawaii: extreme chibi cuteness, big sparkling eyes, pastel palette.",
    culturalDna: ["Japanese pop culture", "Sanrio", "Cute emotional design"],
    description: "Exaggerated cuteness designed to evoke affection.",
    visualTraits: [
      "faces: very simple + highly expressive",
      "proportions: chibi",
      "outlines: thick, clean",
      "colors: soft pastel palette",
    ],
    mandatory: ["Must evoke cuteness immediately", "Friendly expression is required", "Rounded shapes"],
    forbidden: ["Sharp angles", "Dark aggressive themes", "Realism"],
    avoid: ["Complex detail", "Gritty texture"],
    checklist: ["Is it adorable?", "Does it feel friendly?"],
    includeBaseRules: true,
  },
  cute: {
    id: "cute",
    systemName: "CUTE",
    summary: "Cute (general): friendly, sweet, approachable design, rounded shapes.",
    culturalDna: ["Playful UI", "Friendly branding", "Emotional warmth"],
    description: "Soft, approachable and emotionally positive design.",
    visualTraits: [
      "shapes: rounded, clean, modern",
      "colors: bright or pastel",
      "details: simple and charming",
      "rendering: clean illustration / gentle shading",
    ],
    mandatory: ["Friendly tone", "Soft shapes", "Positive emotion"],
    forbidden: ["Harsh geometry", "Dark oppressive palettes", "Cold minimalism"],
    avoid: ["Over-detailing", "Aggressive contrast"],
    checklist: ["Is it approachable?", "Does it feel warm?", "Is it playful?"],
    includeBaseRules: true,
  },
};

const STYLE_ORDER: IconStyle[] = [
  "minimalism", "glassy", "woven", "geometric", "neon", "gradient",
  "flat", "material", "ios-classic", "android-material", "pixel",
  "game", "clay", "holographic", "kawaii", "cute",
];

// ════════════════════════════════════════════════════════════════════════════
// STYLE HELPERS
// ════════════════════════════════════════════════════════════════════════════

function formatList(items?: readonly string[]): string | null {
  if (!items || items.length === 0) return null;
  return items.join(", ");
}

function formatPromptSection(label: string, items?: readonly string[]): string | null {
  const text = formatList(items);
  if (!text) return null;
  return `${label}: ${text}.`;
}

function buildStyleBlock(def: StyleDefinition, format: "multiline" | "inline"): string {
  if (format === "multiline") {
    const lines: Array<string | null> = [
      `STYLE SYSTEM: ${def.systemName}`,
      def.culturalDna?.length ? `Cultural DNA: ${formatList(def.culturalDna)}.` : null,
      def.description ? `Description: ${def.description}` : null,
      def.visualTraits?.length ? `Visual traits: ${def.visualTraits.join("; ")}.` : null,
      formatPromptSection("Mandatory", def.mandatory),
      formatPromptSection("Forbidden", def.forbidden),
      formatPromptSection("Avoid", def.avoid),
      def.checklist?.length ? `LLM checklist: ${def.checklist.join(" ")}` : null,
    ];
    return lines.filter((l): l is string => Boolean(l)).join("\n");
  }

  const parts: Array<string | null> = [
    `Style system: ${def.systemName}.`,
    def.culturalDna?.length ? `Cultural DNA: ${formatList(def.culturalDna)}.` : null,
    def.description ? `Description: ${def.description}` : null,
    def.visualTraits?.length ? `Visual traits: ${def.visualTraits.join("; ")}.` : null,
    formatPromptSection("Mandatory", def.mandatory),
    formatPromptSection("Forbidden", def.forbidden),
    formatPromptSection("Avoid", def.avoid),
    def.checklist?.length ? `Checklist: ${def.checklist.join(" ")}` : null,
  ];
  return parts.filter((p): p is string => Boolean(p)).join(" ");
}

const BASE_RULES_V2 = [
  `Single dominant subject only.`,
  `No rounded-square tile, card, badge, or app plate behind the subject (no app icon layouts).`,
  `No heavy realism or photo look.`,
  `No UI mockups, interface elements, or device frames.`,
  `High contrast and clear focal point.`,
  `Soft edges unless the selected style requires sharp geometry.`,
  `No large outer drop shadows, halos, or glow that make the design look like a floating app icon card.`,
].join(" ");

export function getAvailableStyles(): IconStyle[] {
  return [...STYLE_ORDER];
}

export function getStyleDescription(style: IconStyle): string {
  return STYLE_DEFINITIONS[style]?.summary || STYLE_DEFINITIONS.minimalism.summary;
}

function getStyleDirective(style: IconStyle): string {
  const def = STYLE_DEFINITIONS[style] || STYLE_DEFINITIONS.minimalism;
  return buildStyleBlock(def, "inline");
}

// ════════════════════════════════════════════════════════════════════════════
// ICON PROMPT BUILDER (adapted from SnapAI)
// ════════════════════════════════════════════════════════════════════════════

const ICON_BASE_CONTEXT_LINES = [
  `Context: standalone symbol/illustration for general use, not an app launcher icon or UI mockup.`,
  `Do not design or imply an app icon, logo plate, badge, or rounded-square container.`,
  `Do not draw an icon inside a larger canvas. No outer margins, padding, or separate card background.`,
  `Do not draw any rounded-square tile, card, or container behind the subject.`,
  `The canvas itself is a perfect square with sharp 90° corners; do not simulate rounded-corner app icon masks.`,
  `No global drop shadows, long cast shadows, outer glows, or halos around the subject or canvas.`,
  `No UI mockups. No borders, frames, stickers, app plates, or device chrome.`,
  `No text/typography (letters, numbers, monograms). No watermark.`,
  `Not a full photo/portrait/real-world scene. No realistic human faces as the main subject.`,
  `Do not copy or imitate real brand logos, trademarked shapes, or recognizable brand marks.`,
] as const;

const ICON_BASE_RULES_LINES = [
  `Square 1:1 aspect ratio.`,
  `Main subject fills 92–98% of the canvas (zoom in; avoid excessive empty space).`,
  `Center/balance the silhouette. Keep critical details within ~5–8% safe area.`,
  `Android-safe: keep critical details within central ~70% (silhouette may extend).`,
  `Background extends to all four edges of the square canvas with straight (non-rounded) corners; keep it clean.`,
] as const;

/**
 * Build an optimized prompt for app icon generation.
 * Adapted from SnapAI's buildFinalIconPrompt.
 */
export function buildIconPrompt(params: {
  prompt: string;
  style?: IconStyle;
}): string {
  const { prompt, style } = params;

  const styleResolved = style ? { preset: style } : {};
  const presetDirective = style ? getStyleDirective(style) : null;

  const sizeText = "1024x1024";
  const artworkNoun = "square symbol illustration (icon-style, but not an app launcher tile)";

  const glossyKeywords =
    /\b(glassy|glass|chrome|holographic|iridescent|neon|glow|bloom|sparkle|sparkles|lens\s*flare|shiny|shine|metallic)\b/i;
  const isDefaultLook = !style && !glossyKeywords.test(prompt);

  const contextBlock = ICON_BASE_CONTEXT_LINES.join("\n");

  const layer1 = [
    `Create a ${sizeText} ${artworkNoun}.`,
    ``,
    `Subject: ${prompt}`,
    ``,
    contextBlock,
    ``,
    `Archetype (internal decision, do not mention in the output):`,
    `Choose exactly ONE archetype: object_icon, abstract_form_icon, hybrid_icon, or character_icon.`,
    `Characters are optional and must only be used when clearly appropriate.`,
    ``,
    `Archetype guidance:`,
    `- object_icon: a single physical or symbolic object without a face/personality.`,
    `- abstract_form_icon: pure form/metaphor without literal objects or faces.`,
    `- hybrid_icon: an object with subtle life cues (no face), friendly but restrained.`,
    `- character_icon: a friendly expressive character with a face (kids, games, beginner education).`,
    ``,
    `Concept:`,
    `Design a single, intentional visual element that represents the app.`,
    `Avoid generic logos and generic symbols. Choose a clear but slightly unexpected metaphor.`,
    ``,
    `Creativity means: unusual material choices, unexpected but clear metaphors, expressive lighting, playful proportions.`,
    `Creativity does NOT mean: always adding eyes/faces, always making it cute, always anthropomorphizing objects.`,
    ``,
    `Material:`,
    isDefaultLook
      ? `Default to an illustration-friendly matte finish (painted polymer, ceramic, paper, or flat vector). Avoid glass/chrome/neon unless explicitly requested.`
      : `Select one dominant material (glass, metal, gel, ceramic, plastic, light, fabric, liquid).`,
    `Material choice should communicate mood and product category.`,
    ``,
    `Composition:`,
    `Main subject fills 92–98% of the canvas. Strong silhouette. No unnecessary elements.`,
    ``,
    `Lighting:`,
    isDefaultLook
      ? `Soft, controlled lighting. Minimal specular highlights. No bloom/glow/lens flares.`
      : `Use lighting to define mood and hierarchy.`,
    ``,
    `Overall feel:`,
    `Modern, bold, subject-first illustration (not an app icon layout). Creative without being childish.`,
    isDefaultLook
      ? `Rendering default: clean illustration / 2D or 2.5D, matte finish, subtle shading only.`
      : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  const layer2 = [
    `Technical constraints:`,
    ...ICON_BASE_RULES_LINES,
    isDefaultLook
      ? `Default-look guardrail: avoid inflated glass/chrome/neon/glow/sparkles/lens flare/exaggerated shine unless explicitly requested.`
      : null,
    `If generating multiple images: keep the same archetype + dominant material; vary only small details.`,
    ``,
    `Quality filters (internal):`,
    `Reject if: it reads like a photo/portrait/full scene; it becomes a mascot by default; too many elements hurt clarity; a face appears without choosing character_icon.`,
    `Accept if: instant read at small size; strong silhouette; intentional material; clean contrast on both light and dark backgrounds.`,
    ``,
    `Icon QA (internal): blur test (~64px), small-size readability, wallpaper contrast, one focal point.`,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  // Optional style block
  const styleLine = (styleResolved as { preset?: IconStyle }).preset
    ? [
        `Primary style preset (dominant): ${(styleResolved as { preset: IconStyle }).preset}`,
        `Style intent: ${getStyleDescription((styleResolved as { preset: IconStyle }).preset)}`,
        `Style directive (must dominate all decisions): ${presetDirective}`,
        `Do not mix in other conflicting materials/styles.`,
      ].join("\n")
    : null;

  const layer3 = styleLine
    ? [
        ``,
        `Style system:`,
        `This preset is the base art direction and is a HARD constraint.`,
        styleLine,
      ].join("\n")
    : "";

  // If a preset exists, reinforce early
  let layer1WithStyle = layer1;
  if ((styleResolved as { preset?: IconStyle }).preset && presetDirective) {
    layer1WithStyle = layer1.replace(
      `Material:`,
      `Primary style preset (dominant): ${(styleResolved as { preset: IconStyle }).preset}\nStyle directive: ${presetDirective}\n\nMaterial:`
    );
  }

  return `${layer1WithStyle}\n\n${layer2}${layer3}`;
}

// ════════════════════════════════════════════════════════════════════════════
// FEATURE GRAPHIC PROMPT BUILDER (original for App Release Copilot)
// ════════════════════════════════════════════════════════════════════════════

const FEATURE_GRAPHIC_CONTEXT_LINES = [
  `Context: App Store / Google Play feature graphic (promotional banner image).`,
  `This is a landscape banner (1024×500 pixels) used at the top of the app listing page.`,
  `It should visually communicate the app's purpose and brand at a glance.`,
  `It must look professional, polished, and attention-grabbing.`,
] as const;

const FEATURE_GRAPHIC_RULES_LINES = [
  `Landscape 2.048:1 aspect ratio (1024 wide × 500 tall).`,
  `Composition must be optimized for wide horizontal format.`,
  `Key visual elements should be centered or balanced across the horizontal axis.`,
  `Keep important content within the center 80% (safe area for cropping on different devices).`,
  `Use bold, simple visuals that read clearly at small sizes (feature graphics are often shown as thumbnails).`,
  `Background should extend to all edges — no letterboxing or black bars.`,
  `The image should work with or without the app icon overlaid on top.`,
] as const;

const FEATURE_GRAPHIC_STYLE_LINES = [
  `Create a visually striking promotional banner that:`,
  `- Uses the app's brand colors and visual identity`,
  `- Communicates the app's core value proposition visually`,
  `- Has a clean, modern look suitable for app store listings`,
  `- Works at both large (1024×500) and thumbnail sizes`,
  `- Does NOT include the app name/title text (the store adds this separately)`,
  `- Does NOT include device mockups or screenshots unless specifically requested`,
  `- Avoids cluttered composition — maximum 2-3 visual elements`,
  `- Uses gradient or solid color backgrounds that complement the subject`,
] as const;

/**
 * Build an optimized prompt for feature graphic generation.
 * Designed for 1024×500 landscape banners (Google Play / App Store).
 */
export function buildFeatureGraphicPrompt(params: {
  prompt: string;
  style?: IconStyle;
}): string {
  const { prompt, style } = params;

  const contextBlock = FEATURE_GRAPHIC_CONTEXT_LINES.join("\n");
  const rulesBlock = FEATURE_GRAPHIC_RULES_LINES.join("\n");
  const styleBlock = FEATURE_GRAPHIC_STYLE_LINES.join("\n");

  const glossyKeywords =
    /\b(glassy|glass|chrome|holographic|iridescent|neon|glow|bloom|sparkle|sparkles|lens\s*flare|shiny|shine|metallic)\b/i;
  const isDefaultLook = !style && !glossyKeywords.test(prompt);

  const lines = [
    `Create a 1024x500 landscape promotional banner illustration.`,
    ``,
    `Subject/Theme: ${prompt}`,
    ``,
    contextBlock,
    ``,
    rulesBlock,
    ``,
    styleBlock,
    ``,
    `Design approach:`,
    `- Think "hero image" or "billboard" — impactful at a glance`,
    `- Use dramatic lighting and color to create visual interest`,
    `- Incorporate abstract or symbolic representations of the app's functionality`,
    `- Balance negative space with visual weight for a clean layout`,
    ``,
    `Material/Rendering:`,
    isDefaultLook
      ? `Clean, modern digital illustration. Matte or semi-gloss finish. Avoid overly realistic or photographic styles.`
      : `Select materials and rendering that match the requested style. Ensure the wide format is maximized.`,
    ``,
    `Technical constraints:`,
    `Final image dimensions: 1024 pixels wide × 500 pixels tall.`,
    `Format: PNG or JPEG.`,
    `Maximum file size: 15 MB.`,
    `No text, watermarks, or typography.`,
    `No realistic human faces as the main subject.`,
    `No logos, brand marks, or trademarked imagery.`,
    ``,
    `Quality filters (internal):`,
    `Reject if: it looks like a stretched square icon; composition is unbalanced for landscape; too much empty space; too cluttered; text is present.`,
    `Accept if: reads clearly as a promotional banner; strong horizontal composition; professional polish; works at thumbnail size.`,
  ];

  // Add style override if specified
  if (style) {
    const def = STYLE_DEFINITIONS[style];
    if (def) {
      lines.push(
        ``,
        `Style system:`,
        `Apply the "${style}" style preset as a HARD constraint for material, color, and rendering choices.`,
        buildStyleBlock(def, "multiline"),
        `Adapt the style to landscape banner format — composition rules for landscape take priority over icon-specific rules.`,
      );
    }
  }

  return lines.filter((l): l is string => l !== null).join("\n");
}
