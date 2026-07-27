/**
 * Replicate API client for AI model inference.
 * Uses fetch-based HTTP calls — no SDK dependency required.
 */

const REPLICATE_API_URL = "https://api.replicate.com/v1";

function getApiKey(): string {
  const key = process.env.REPLICATE_API_TOKEN;
  if (!key) throw new Error("REPLICATE_API_TOKEN environment variable is not set");
  return key;
}

export interface ReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output: any;
  error: string | null;
  urls?: { get?: string; cancel?: string };
}

/**
 * Create a prediction and poll until completion.
 */
export async function runReplicateModel(
  version: string,
  input: Record<string, any>,
  timeoutMs: number = 300_000,
): Promise<any> {
  const apiKey = getApiKey();

  const createRes = await fetch(`${REPLICATE_API_URL}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ version, input }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Replicate prediction creation failed: ${createRes.status} ${err}`);
  }

  const prediction: ReplicatePrediction = await createRes.json();

  // Poll for completion
  const startTime = Date.now();
  let current = prediction;

  while (current.status !== "succeeded" && current.status !== "failed" && current.status !== "canceled") {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error("Replicate prediction timed out");
    }

    await sleep(2000);

    const pollRes = await fetch(`${REPLICATE_API_URL}/predictions/${current.id}`, {
      headers: { Authorization: `Token ${apiKey}` },
    });

    if (!pollRes.ok) {
      throw new Error(`Replicate polling failed: ${pollRes.status}`);
    }

    current = await pollRes.json();
  }

  if (current.status === "failed") {
    throw new Error(`Replicate prediction failed: ${current.error}`);
  }

  if (current.status === "canceled") {
    throw new Error("Replicate prediction was canceled");
  }

  return current.output;
}

/**
 * Run a model by owner/name (resolves version automatically).
 */
export async function runReplicateModelByName(
  model: string,
  input: Record<string, any>,
  timeoutMs: number = 300_000,
): Promise<any> {
  const apiKey = getApiKey();

  const createRes = await fetch(`${REPLICATE_API_URL}/models/${model}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Replicate model prediction failed: ${createRes.status} ${err}`);
  }

  const prediction: ReplicatePrediction = await createRes.json();

  const startTime = Date.now();
  let current = prediction;

  while (current.status !== "succeeded" && current.status !== "failed" && current.status !== "canceled") {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error("Replicate prediction timed out");
    }

    await sleep(2000);

    const pollRes = await fetch(`${REPLICATE_API_URL}/predictions/${current.id}`, {
      headers: { Authorization: `Token ${apiKey}` },
    });

    if (!pollRes.ok) {
      throw new Error(`Replicate polling failed: ${pollRes.status}`);
    }

    current = await pollRes.json();
  }

  if (current.status === "failed") {
    throw new Error(`Replicate prediction failed: ${current.error}`);
  }

  if (current.status === "canceled") {
    throw new Error("Replicate prediction was canceled");
  }

  return current.output;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Download a file from a URL and return it as a Buffer.
 */
export async function downloadFile(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download file: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
