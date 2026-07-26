export {
  OpenRouterClient,
  getOpenRouterClient,
  resetOpenRouterClient,
} from "./openrouter";
export type {
  OpenRouterMessage,
  OpenRouterResponse,
  OpenRouterStreamChunk,
} from "./openrouter";

export {
  isSpeechRecognitionSupported,
  createSpeechRecognizer,
  isTTSSupported,
  getAvailableVoices,
  speakText,
  stopSpeaking,
  transcribeAudioFile,
} from "./speech";
export type {
  SpeechRecognitionLanguage,
  SpeechRecognitionResult,
  TTSOptions,
} from "./speech";

export {
  analyzeAudio,
  getSmartCutRegions,
  decodeAudioFromFile,
} from "./silence";
export type {
  SilenceSegment,
  AudioAnalysisResult,
} from "./silence";

export {
  AI_PROMPT_TEMPLATES,
  getPromptById,
  processPromptTemplate,
} from "./prompts";
export type {
  AIPromptTemplate,
} from "./prompts";

export function isAIAvailable(): { speech: boolean; tts: boolean; openrouter: boolean } {
  return {
    speech: typeof window !== "undefined" &&
      !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    tts: typeof window !== "undefined" && "speechSynthesis" in window,
    openrouter: true,
  };
}
