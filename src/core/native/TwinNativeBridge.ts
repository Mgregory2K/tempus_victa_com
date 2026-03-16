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

let pluginInstance: any = null;
let initializationPromise: Promise<{ instance: any }> | null = null;

/**
 * Gets the plugin instance wrapped in an object to avoid the "then() is not implemented"
 * error caused by JS engine probing the Capacitor proxy during promise resolution.
 */
async function getPluginWrapper(): Promise<{ instance: any } | null> {
  if (pluginInstance) return { instance: pluginInstance };
  if (typeof window === 'undefined') return null;

  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    try {
      const { Capacitor, registerPlugin } = await import('@capacitor/core');

      let instance: any;
      if (Capacitor.isNativePlatform()) {
        instance = registerPlugin('TwinNative');
      } else {
        instance = WEB_MOCK;
      }
      pluginInstance = instance;
      return { instance };
    } catch (e) {
      console.warn("[TwinNative] Capacitor loading failed, using WEB_MOCK", e);
      pluginInstance = WEB_MOCK;
      return { instance: WEB_MOCK };
    }
  })();

  return initializationPromise;
}

/**
 * TwinNative Authority Bridge.
 * Resilient implementation with timeouts to prevent UI hangs.
 */
const TwinNative: TwinNativePlugin = {
  getInitialState: async () => {
    const wrapper = await getPluginWrapper();
    const p = wrapper?.instance;
    if (!p) return WEB_MOCK.getInitialState();

    return Promise.race([
        p.getInitialState(),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error("BRIDGE_TIMEOUT")), 2000))
    ]).catch((err) => {
        console.warn("[TwinNative] getInitialState failed or timed out", err);
        return WEB_MOCK.getInitialState();
    });
  },
  saveMemoryPack: async (d) => {
    const wrapper = await getPluginWrapper();
    return wrapper?.instance?.saveMemoryPack(d);
  },
  loadMemoryPack: async () => {
    const wrapper = await getPluginWrapper();
    const p = wrapper?.instance;
    if (!p) return WEB_MOCK.loadMemoryPack();

    return Promise.race([
        p.loadMemoryPack(),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error("BRIDGE_TIMEOUT")), 2000))
    ]).catch(() => WEB_MOCK.loadMemoryPack());
  },
  enqueueCapture: async (e) => {
    const wrapper = await getPluginWrapper();
    return wrapper?.instance?.enqueueCapture(e) || WEB_MOCK.enqueueCapture(e);
  },
  triggerSync: async (o) => {
    const wrapper = await getPluginWrapper();
    return wrapper?.instance?.triggerSync(o);
  },
  getSyncStatus: async () => {
    const wrapper = await getPluginWrapper();
    return wrapper?.instance?.getSyncStatus() || WEB_MOCK.getSyncStatus();
  },
  setSecret: async (k, v) => {
    const wrapper = await getPluginWrapper();
    return wrapper?.instance?.setSecret(k, v);
  },
  getSecret: async (k) => {
    const wrapper = await getPluginWrapper();
    return wrapper?.instance?.getSecret(k) || WEB_MOCK.getSecret(k);
  },
  getDeviceId: async () => {
    const wrapper = await getPluginWrapper();
    return wrapper?.instance?.getDeviceId() || WEB_MOCK.getDeviceId();
  }
};

export default TwinNative;
