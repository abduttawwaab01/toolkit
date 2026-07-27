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

export {
  separateAudioStems,
  dataUriToBlob,
  dataUriToAudioBuffer,
  STEM_INFO,
} from "./stem-separation";
export type {
  StemSeparationResult,
  StemSeparationOptions,
} from "./stem-separation";

export {
  removeBackgroundAI,
  dataUriToFile,
  dataUriToImage,
} from "./background-removal";
export type {
  BackgroundRemovalResult,
  BackgroundRemovalOptions,
} from "./background-removal";

export {
  removeObjectAI,
  maskCanvasToBlob,
} from "./object-removal";
export type {
  ObjectRemovalResult,
  ObjectRemovalOptions,
} from "./object-removal";

export {
  generateImage,
  IMAGE_STYLE_PRESETS,
} from "./image-generation";
export type {
  ImageGenerationResult,
  ImageGenerationOptions,
} from "./image-generation";

export {
  upscaleVideoAI,
} from "./video-upscale";
export type {
  VideoUpscaleResult,
  VideoUpscaleOptions,
} from "./video-upscale";

export {
  cloneVoice,
  listVoices,
  deleteVoice,
} from "./voice-clone";
export type {
  VoiceCloneResult,
  VoiceCloneOptions,
} from "./voice-clone";

export {
  generateSpeech,
  listTTSVoices,
} from "./text-to-speech";
export type {
  TTSResult,
  TTSOptions as TTSGenerateOptions,
} from "./text-to-speech";

export {
  generateMusic,
  MUSIC_GEN_PRESETS,
} from "./music-generation";
export type {
  MusicGenerationResult,
  MusicGenerationOptions,
} from "./music-generation";

export {
  listCollaborators,
  inviteCollaborator,
  removeCollaborator,
  toggleProjectSharing,
  listComments,
  addComment,
  resolveComment,
  deleteComment,
  getPresence,
  updatePresence,
  clearPresence,
  listActivities,
} from "./collaboration";
export type {
  Collaborator,
  Comment,
  Activity,
  Presence,
} from "./collaboration";

export function isAIAvailable(): { speech: boolean; tts: boolean; openrouter: boolean; stems: boolean; bgRemoval: boolean; objectRemoval: boolean; imageGen: boolean; videoUpscale: boolean; elevenLabs: boolean; musicGen: boolean } {
  return {
    speech: typeof window !== "undefined" &&
      !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    tts: typeof window !== "undefined" && "speechSynthesis" in window,
    openrouter: true,
    stems: true,
    bgRemoval: true,
    objectRemoval: true,
    imageGen: true,
    videoUpscale: true,
    elevenLabs: true,
    musicGen: true,
  };
}
