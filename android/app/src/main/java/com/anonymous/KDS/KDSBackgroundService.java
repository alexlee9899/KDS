package com.anonymous.KDS;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

public class KDSBackgroundService extends Service {
    private static final String TAG = "KDSBackgroundService";
    private static final String CHANNEL_ID = "KDSServiceChannel";
    private static final int NOTIFICATION_ID = 1001;
    
    private PowerManager.WakeLock wakeLock;
    private OrderServer orderServer;
    private ScheduledExecutorService scheduler;
    private Handler handler;
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "KDS Background Service 创建");
        
        // 创建通知渠道
        createNotificationChannel();
        
        // 启动前台服务
        startForeground(NOTIFICATION_ID, createNotification());
        
        // 获取唤醒锁，保持CPU运行
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "KDS:WakeLock");
        wakeLock.acquire();
        
        // 创建Handler用于在主线程执行任务
        handler = new Handler();
        
        // 启动TCP服务器
        orderServer = new OrderServer();
        orderServer.startServer(new OrderHandlerModule(null)); // 传递null，因为我们只需要TCP服务器功能
        
        // 创建定时任务，定期检查网络订单
        startScheduledTasks();
        
        Log.d(TAG, "KDS Background Service 初始化完成");
    }
    
    private void startScheduledTasks() {
        scheduler = Executors.newSingleThreadScheduledExecutor();
        scheduler.scheduleAtFixedRate(() -> {
            Log.d(TAG, "执行定时任务：检查新订单");
            // 这里可以添加检查网络订单的逻辑
            // 由于无法直接调用JS代码，我们可以发送广播通知应用检查新订单
            sendOrderCheckBroadcast();
        }, 0, 30, TimeUnit.SECONDS);
    }
    
    private void sendOrderCheckBroadcast() {
        Intent intent = new Intent("com.anonymous.KDS.CHECK_ORDERS");
        sendBroadcast(intent);
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "KDS Service Channel",
                    NotificationManager.IMPORTANCE_LOW
            );
            serviceChannel.setSound(null, null);
            serviceChannel.enableVibration(false);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(serviceChannel);
        }
    }
    
    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                notificationIntent,
                PendingIntent.FLAG_IMMUTABLE
        );
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("KDS 正在运行")
                .setContentText("正在后台接收订单")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "服务启动");
        return START_STICKY; // 服务被杀死后会尝试重启
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "服务销毁");
        
        // 释放资源
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        
        if (orderServer != null) {
            orderServer.stopServer();
        }
        
        if (scheduler != null) {
            scheduler.shutdown();
        }
        
        // 尝试重启服务
        Intent restartServiceIntent = new Intent(getApplicationContext(), KDSBackgroundService.class);
        startService(restartServiceIntent);
    }
} 