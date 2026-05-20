// src/lib/ai-engine.ts

const PATTERNS = [
  { label: 'PHONE', regex: /\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g },
  { label: 'CVV', regex: /\b\d{3,4}\b/g }, 
  { label: 'SENSITIVE_ID', regex: /\b\d{6,10}\b/g },
  { label: 'AWS_KEY', regex: /AKIA[0-9A-Z]{16}/g },
  { label: 'AWS_SECRET', regex: /[a-zA-Z0-9+/]{40}/g },
  { label: 'IP_ADDRESS', regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g }
];

export const loadModel = async (tier: 'HIGH' | 'LOW', onProgress: (p: any) => void) => {
  // Dynamically import transformers to prevent RAM crashes and Webpack bundling issues during SSR
  const { pipeline, env } = await import('@huggingface/transformers');
  
  // Disable local models to prevent filesystem access issues in Next.js environments
  env.allowLocalModels = false;

  // THE FIREWALL BYPASS: Essential for university networks
  const modelId = tier === 'HIGH' ? 'openai/privacy-filter' : 'onnx-community/gliner-bi-base-v2.0';

  const pipelineInstance = await pipeline('token-classification', modelId, {
    device: tier === 'HIGH' ? 'webgpu' : 'wasm',
    dtype: 'q4',
    progress_callback: onProgress
  });

  // THE FIX: Parameters now correctly include 'options'
  return async (text: string, options: any = {}) => {
    let aiResults: any[] = [];
    try {
      aiResults = await pipelineInstance(text, options);
    } catch (e) { console.warn("AI Inference failed"); }
    
    const regexResults: any[] = [];
    PATTERNS.forEach(({ label, regex }) => {
      let match;
      const localRegex = new RegExp(regex);
      while ((match = localRegex.exec(text)) !== null) {
        regexResults.push({
          entity: label,
          word: match[0],
          start: match.index,
          end: match.index + match[0].length,
          score: 1.0
        });
      }
    });

    return [...aiResults, ...regexResults];
  };
};