type ShareCapabilities = {share?: (data: {text: string}) => Promise<void>; copy?: (text: string) => Promise<void>};
export async function copyText(text: string, copy?: (text: string) => Promise<void>) {
  if (!copy) return false;
  try { await copy(text); return true; } catch { return false; }
}
export async function shareText(text: string, capabilities: ShareCapabilities): Promise<'shared' | 'copied' | 'cancelled' | 'manual'> {
  if (capabilities.share) {
    try { await capabilities.share({text}); return 'shared'; }
    catch (error) { if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') return 'cancelled'; }
  }
  return await copyText(text, capabilities.copy) ? 'copied' : 'manual';
}
