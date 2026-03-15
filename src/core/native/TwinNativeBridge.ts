// src/core/native/TwinNativeBridge.ts

export interface SyncStatus {
  lastSync: string;
  pendingCount: number;
  isSyncing: boolean;
  deviceId: string;
  conflictCount?: number;
}

export interface TwinNativePlugin {
  getInitialState(): Promise<{
    memoryPack: string;
    pendingCaptures: any[];
    deviceId: string;
    syncStatus: SyncStatus;
  }>;
  saveMemoryPack(data: { bundleJson: string }): Promise<void>;
  loadMemoryPack(): Promise<{ bundleJson: string }>;
  enqueueCapture(entry: {
    type: string;
    content: string;
    metadata?: string;
  }): Promise<{ entryId: string }>;
  triggerSync(options: { expedited: boolean }): Promise<void>;
  getSyncStatus(): Promise<SyncStatus>;
  setSecret(key: string, value: string): Promise<void>;
  getSecret(key: string): Promise<{ value: string | null }>;
  getDeviceId(): Promise<{ id: string }>;
}

/**
 * TwinNative Authority Bridge.
 * Opaque implementation to satisfy Next.js/Turbopack build-time checks.
 */
const TwinNative: TwinNativePlugin = {
  getInitialState: async () => (await getPlugin())?.getInitialState() || {
    memoryPack: '{}',
    pendingCaptures: [],
    deviceId: 'web',
    syncStatus: { lastSync: 'N/A', pendingCount: 0, isSyncing: false, deviceId: 'web' }
  },
  saveMemoryPack: async (d) => (await getPlugin())?.saveMemoryPack(d),
  loadMemoryPack: async () => (await getPlugin())?.loadMemoryPack() || { bundleJson: '{}' },
  enqueueCapture: async (e) => (await getPlugin())?.enqueueCapture(e) || { entryId: 'web_' + Date.now() },
  triggerSync: async (o) => (await getPlugin())?.triggerSync(o),
  getSyncStatus: async () => (await getPlugin())?.getSyncStatus() || {
    lastSync: 'N/A', pendingCount: 0, isSyncing: false, deviceId: 'web'
  },
  setSecret: async (k, v) => (await getPlugin())?.setSecret(k, v),
  getSecret: async (k) => (await getPlugin())?.getSecret(k) || { value: null },
  getDeviceId: async () => (await getPlugin())?.getDeviceId() || { id: 'web' }
};

let pluginInstance: any = null;

async function getPlugin(): Promise<any> {
  if (pluginInstance) return pluginInstance;
  if (typeof window === 'undefined') return null;
  try {
    // We use a variable for the module name to hide it from static analysis.
    const moduleName = '@capacitor/core';
    const cap: any = await import(moduleName);
    // Use an untyped call and cast the result to avoid TS generic argument errors on 'any'.
    pluginInstance = cap.registerPlugin('TwinNative') as TwinNativePlugin;
    return pluginInstance;
  } catch (e) {
    return null;
  }
}

export default TwinNative;
