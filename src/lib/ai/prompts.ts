export interface AIPromptTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  userPromptTemplate: string;
  temperature?: number;
  maxTokens?: number;
}

export const AI_PROMPT_TEMPLATES: AIPromptTemplate[] = [
  {
    id: "rewrite-subtitles",
    name: "Polish Subtitles",
    description: "Fix grammar, punctuation, and improve readability of subtitle text",
    icon: "✏",
    systemPrompt: "You are a professional subtitle editor. Fix grammar, punctuation, and improve readability while keeping the exact timing and meaning. Return ONLY the corrected subtitle lines, one per line, in the same order.",
    userPromptTemplate: "Fix these subtitle lines:\n\n{{TEXT}}",
    temperature: 0.3,
    maxTokens: 4096,
  },
  {
    id: "shorten-subtitles",
    name: "Shorten Subtitles",
    description: "Condense subtitles to fewer characters for faster reading",
    icon: "✂",
    systemPrompt: "You are a subtitle compression expert. Shorten each subtitle line to under 42 characters while preserving meaning. Return ONLY the shortened lines, one per line, in the same order.",
    userPromptTemplate: "Shorten these subtitles:\n\n{{TEXT}}",
    temperature: 0.2,
    maxTokens: 4096,
  },
  {
    id: "translate-subtitles",
    name: "Translate Subtitles",
    description: "Translate subtitles to another language",
    icon: "🌐",
    systemPrompt: "You are a professional translator. Translate each subtitle line while keeping the timing the same. Return ONLY the translated lines, one per line, in the same order.",
    userPromptTemplate: "Translate these subtitles to {{LANGUAGE}}:\n\n{{TEXT}}",
    temperature: 0.3,
    maxTokens: 4096,
  },
  {
    id: "generate-script",
    name: "Generate Script",
    description: "Write a video script from a topic or description",
    icon: "📝",
    systemPrompt: "You are a professional video script writer. Write engaging, concise video scripts optimized for the specified duration. Include visual cues in [brackets]. Return the script as plain text with short paragraphs.",
    userPromptTemplate: "Write a {{DURATION}}-second video script about: {{TOPIC}}\n\nStyle: {{STYLE}}\n\nTarget audience: {{AUDIENCE}}",
    temperature: 0.8,
    maxTokens: 2048,
  },
  {
    id: "rewrite-text",
    name: "Rewrite Text",
    description: "Improve or rewrite any text content",
    icon: "🔄",
    systemPrompt: "You are a professional editor. Rewrite the text to improve clarity, tone, and impact while preserving the original meaning. Adjust the tone as requested.",
    userPromptTemplate: "Rewrite this {{STYLE}} text (tone: {{TONE}}):\n\n{{TEXT}}",
    temperature: 0.6,
    maxTokens: 2048,
  },
  {
    id: "generate-description",
    name: "Generate Description",
    description: "Write a video or image description",
    icon: "📋",
    systemPrompt: "You are a creative copywriter. Write compelling, SEO-friendly descriptions for video content. Keep it under 200 words and include relevant keywords naturally.",
    userPromptTemplate: "Write a description for a {{TYPE}} titled \"{{TITLE}}\".\n\nContext: {{CONTEXT}}",
    temperature: 0.7,
    maxTokens: 1024,
  },
  {
    id: "generate-tags",
    name: "Generate Tags",
    description: "Generate hashtags and SEO tags for content",
    icon: "🏷",
    systemPrompt: "You are an SEO specialist. Generate relevant hashtags and tags for video content. Mix broad and specific tags. Return as comma-separated tags.",
    userPromptTemplate: "Generate 15-20 hashtags and SEO tags for: {{CONTENT}}",
    temperature: 0.4,
    maxTokens: 512,
  },
  {
    id: "fix-grammar",
    name: "Fix Grammar",
    description: "Fix grammar and spelling errors in text",
    icon: "✅",
    systemPrompt: "You are a grammar expert. Fix all grammar, spelling, and punctuation errors. Preserve the original meaning and style. Return ONLY the corrected text.",
    userPromptTemplate: "Fix grammar in this text:\n\n{{TEXT}}",
    temperature: 0.1,
    maxTokens: 4096,
  },
  {
    id: "summarize",
    name: "Summarize",
    description: "Summarize long text into a shorter version",
    icon: "📄",
    systemPrompt: "You are a concise summarizer. Summarize the following text while preserving key information. Keep the summary under {{LENGTH}} words.",
    userPromptTemplate: "Summarize this in {{LENGTH}} words or less:\n\n{{TEXT}}",
    temperature: 0.3,
    maxTokens: 1024,
  },
  {
    id: "change-tone",
    name: "Change Tone",
    description: "Change the tone of the text (casual, professional, etc.)",
    icon: "🎭",
    systemPrompt: "You are a tone adaptation expert. Rewrite the text in the requested tone while preserving all factual content and meaning.",
    userPromptTemplate: "Rewrite this text in a {{TONE}} tone:\n\n{{TEXT}}",
    temperature: 0.7,
    maxTokens: 2048,
  },
];

export function getPromptById(id: string): AIPromptTemplate | undefined {
  return AI_PROMPT_TEMPLATES.find((p) => p.id === id);
}

export function processPromptTemplate(template: AIPromptTemplate, variables: Record<string, string>): string {
  let text = template.userPromptTemplate;
  for (const [key, value] of Object.entries(variables)) {
    text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return text;
}
