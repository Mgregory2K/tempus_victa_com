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

const WEB_MOCK: TwinNativePlugin = {
  getInitialState: async () => ({
    memoryPack: '{}',
    pendingCaptures: [],
    deviceId: 'web',
    syncStatus: { lastSync: 'N/A', pendingCount: 0, isSyncing: false, deviceId: 'web' }
  }),
  getDeviceId: async () => ({ id: 'web' }),
  getSyncStatus: async () => ({ lastSync: 'N/A', pendingCount: 0, isSyncing: false, deviceId: 'web' }),
  loadMemoryPack: async () => ({ bundleJson: '{}' }),
  saveMemoryPack: async () => {},
  enqueueCapture: async () => ({ entryId: 'web_' + Date.now() }),
  triggerSync: async () => {},
  setSecret: async () => {},
  getSecret: async () => ({ value: null })
};

/**
 * TwinNative Authority Bridge.
 * Opaque implementation to satisfy Next.js/Turbopack build-time checks.
 */
const TwinNative: TwinNativePlugin = {
  getInitialState: async () => (await getPlugin())?.getInitialState() || WEB_MOCK.getInitialState(),
  saveMemoryPack: async (d) => (await getPlugin())?.saveMemoryPack(d),
  loadMemoryPack: async () => (await getPlugin())?.loadMemoryPack() || WEB_MOCK.loadMemoryPack(),
  enqueueCapture: async (e) => (await getPlugin())?.enqueueCapture(e) || WEB_MOCK.enqueueCapture(e),
  triggerSync: async (o) => (await getPlugin())?.triggerSync(o),
  getSyncStatus: async () => (await getPlugin())?.getSyncStatus() || WEB_MOCK.getSyncStatus(),
  setSecret: async (k, v) => (await getPlugin())?.setSecret(k, v),
  getSecret: async (k) => (await getPlugin())?.getSecret(k) || WEB_MOCK.getSecret(k),
  getDeviceId: async () => (await getPlugin())?.getDeviceId() || WEB_MOCK.getDeviceId()
};

let pluginInstance: any = null;

async function getPlugin(): Promise<any> {
  if (pluginInstance) return pluginInstance;
  if (typeof window === 'undefined') return null;
  try {
    const { Capacitor, registerPlugin } = await import('@capacitor/core');

    // Check if we are actually on a native platform
    if (Capacitor.isNativePlatform()) {
      pluginInstance = registerPlugin('TwinNative') as TwinNativePlugin;
    } else {
      // On web, return the mock directly to avoid Capacitor proxy ".then()" errors
      pluginInstance = WEB_MOCK;
    }

    return pluginInstance;
  } catch (e) {
    return WEB_MOCK;
  }
}

export default TwinNative;
