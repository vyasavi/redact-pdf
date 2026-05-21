// lib/ai-engine.ts

const PATTERNS = [
  { label: 'PHONE', regex: /\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g },
  { label: 'CVV', regex: /\b\d{3,4}\b/g }, 
  { label: 'SENSITIVE_ID', regex: /\b\d{6,10}\b/g },
  { label: 'AWS_KEY', regex: /AKIA[0-9A-Z]{16}/g },
  { label: 'AWS_SECRET', regex: /[a-zA-Z0-9+/]{40}/g },
  { label: 'IP_ADDRESS', regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g }
];

export const loadModel = async (onProgress: (p: any) => void) => {
  const { pipeline, env } = await import('@huggingface/transformers');
  env.allowLocalModels = false;

  const pipelineInstance = await pipeline('token-classification', 'openai/privacy-filter', {
    device: 'webgpu',
    dtype: 'q4',
    progress_callback: onProgress
  });

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