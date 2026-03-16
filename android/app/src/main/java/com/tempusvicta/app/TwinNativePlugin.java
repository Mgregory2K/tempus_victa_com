package com.tempusvicta.app;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "TwinNative")
public class TwinNativePlugin extends Plugin {

    @PluginMethod
    public void getInitialState(PluginCall call) {
        android.util.Log.d("TwinNative", "getInitialState called");

        JSObject ret = new JSObject();
        ret.put("deviceId", "android_device");
        ret.put("memoryPack", "{}");
        ret.put("pendingCaptures", new JSArray());

        JSObject syncStatus = new JSObject();
        syncStatus.put("pendingCount", 0);
        syncStatus.put("conflictCount", 0);
        syncStatus.put("lastSync", "");
        syncStatus.put("isSyncing", false);
        syncStatus.put("deviceId", "android_device");
        
        ret.put("syncStatus", syncStatus);

        android.util.Log.d("TwinNative", "getInitialState resolving: " + ret.toString());
        call.resolve(ret);
    }

    @PluginMethod
    public void saveMemoryPack(PluginCall call) {
        call.resolve();
    }

    @PluginMethod
    public void loadMemoryPack(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("bundleJson", "{}");
        call.resolve(ret);
    }

    @PluginMethod
    public void enqueueCapture(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("entryId", "android_" + System.currentTimeMillis());
        call.resolve(ret);
    }

    @PluginMethod
    public void triggerSync(PluginCall call) {
        call.resolve();
    }

    @PluginMethod
    public void getSyncStatus(PluginCall call) {
        JSObject syncStatus = new JSObject();
        syncStatus.put("pendingCount", 0);
        syncStatus.put("conflictCount", 0);
        syncStatus.put("lastSync", "");
        syncStatus.put("isSyncing", false);
        syncStatus.put("deviceId", "android_device");
        call.resolve(syncStatus);
    }

    @PluginMethod
    public void setSecret(PluginCall call) {
        call.resolve();
    }

    @PluginMethod
    public void getSecret(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("value", null);
        call.resolve(ret);
    }

    @PluginMethod
    public void getDeviceId(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("id", "android_device");
        call.resolve(ret);
    }
}
