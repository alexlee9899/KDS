package com.anonymous.KDS;

import android.content.Intent;
import android.os.Build;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = "KDSBackgroundServiceModule")
public class KDSBackgroundServiceModule extends ReactContextBaseJavaModule {
    private static final String TAG = "KDSBackgroundServiceModule";
    private final ReactApplicationContext reactContext;

    public KDSBackgroundServiceModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "KDSBackgroundServiceModule";
    }

    /**
     * 启动后台服务
     */
    @ReactMethod
    public void startService(Promise promise) {
        try {
            Log.d(TAG, "JS层请求启动后台服务");
            
            Intent serviceIntent = new Intent(reactContext, KDSBackgroundService.class);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(serviceIntent);
            } else {
                reactContext.startService(serviceIntent);
            }
            
            Log.d(TAG, "后台服务启动命令已发送");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "启动后台服务失败", e);
            promise.reject("SERVICE_START_ERROR", "启动后台服务失败: " + e.getMessage());
        }
    }

    /**
     * 停止后台服务
     */
    @ReactMethod
    public void stopService(Promise promise) {
        try {
            Log.d(TAG, "JS层请求停止后台服务");
            
            Intent serviceIntent = new Intent(reactContext, KDSBackgroundService.class);
            boolean stopped = reactContext.stopService(serviceIntent);
            
            Log.d(TAG, "后台服务停止命令已发送，结果: " + stopped);
            promise.resolve(stopped);
        } catch (Exception e) {
            Log.e(TAG, "停止后台服务失败", e);
            promise.reject("SERVICE_STOP_ERROR", "停止后台服务失败: " + e.getMessage());
        }
    }

    /**
     * 检查后台服务是否正在运行
     */
    @ReactMethod
    public void isServiceRunning(Promise promise) {
        // 这个方法在Android中实现较为复杂，这里只返回一个占位结果
        // 实际应用中可以使用ActivityManager检查服务是否运行
        promise.resolve(true);
    }

    /**
     * 手动触发订单检查
     */
    @ReactMethod
    public void checkNewOrders(Promise promise) {
        try {
            Log.d(TAG, "JS层请求检查新订单");
            
            // 发送广播触发订单检查
            Intent intent = new Intent("com.anonymous.KDS.CHECK_ORDERS");
            reactContext.sendBroadcast(intent);
            
            Log.d(TAG, "订单检查广播已发送");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "发送订单检查广播失败", e);
            promise.reject("CHECK_ORDERS_ERROR", "发送订单检查广播失败: " + e.getMessage());
        }
    }
} 