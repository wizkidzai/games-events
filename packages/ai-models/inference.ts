type Runtime = 'webgpu' | 'wasm' | 'webnn' | 'cpu';

export interface ModelConfig {
  modelId: string;
  task: string;
  runtime?: Runtime;
}

export async function detectRuntime(): Promise<Runtime> {
  if ('gpu' in navigator) return 'webgpu';
  if (typeof WebAssembly !== 'undefined') return 'wasm';
  return 'cpu';
}

export async function loadPipeline(config: ModelConfig) {
  // Dynamic import avoids bundling transformers unless the feature is used
  const { pipeline, env } = await import('@xenova/transformers');

  env.allowLocalModels = false;
  env.useBrowserCache = true;

  return pipeline(config.task as Parameters<typeof pipeline>[0], config.modelId);
}

export function clearModelCache(): void {
  // Clear IndexedDB cache entries for models
  if (!('indexedDB' in globalThis)) return;
  indexedDB.deleteDatabase('transformers-cache');
}
