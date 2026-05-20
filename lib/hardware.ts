export type HardwareTier = 'HIGH' | 'LOW';

interface HardwareResult {
  tier: HardwareTier;
  reason?: string;
  adapter?: any;
}

export const getHardwareTier = async (): Promise<HardwareResult> => {
  const ram = (navigator as any).deviceMemory || 4;
  const gpuEntry = (navigator as any).gpu;

  if (!gpuEntry) return { tier: 'LOW', reason: 'No WebGPU' };
  
  try {
    const adapter = await gpuEntry.requestAdapter();
    if (!adapter) return { tier: 'LOW', reason: 'No Adapter' };
    
    if (ram < 8) return { tier: 'LOW', reason: 'Low RAM' };
    
    // By being explicit here, TS knows this is specifically the "HIGH" type
    return { tier: 'HIGH' as HardwareTier, adapter }; 
  } catch (e) {
    return { tier: 'LOW' as HardwareTier, reason: 'Check Failed' };
  }
};