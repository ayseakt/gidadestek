// src/hooks/useNotification.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const useNotification = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Bildirimleri getir
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications/${userId}`);
      const notificationData = response.data.notifications || [];
      
      setNotifications(notificationData);
      setUnreadCount(notificationData.filter(n => !n.is_read).length);
    } catch (err) {
      setError('Bildirimler yüklenirken hata oluştu');
      console.error('Bildirim yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Bildirimi okundu olarak işaretle
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await axios.put(`${API_BASE_URL}/notifications/${notificationId}/read`);
      
      // Local state'i güncelle
      setNotifications(prev => 
        prev.map(n => 
          n.notification_id === notificationId 
            ? { ...n, is_read: true }
            : n
        )
      );
      
      // Okunmamış sayısını güncelle
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (err) {
      console.error('Bildirim okundu işaretlenirken hata:', err);
      throw err;
    }
  }, []);

  // Tüm bildirimleri okundu olarak işaretle
  const markAllAsRead = useCallback(async () => {
    try {
      await axios.put(`${API_BASE_URL}/notifications/${userId}/read-all`);
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      
    } catch (err) {
      console.error('Tüm bildirimler okundu işaretlenirken hata:', err);
      throw err;
    }
  }, [userId]);

  // Bildirimi sil
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`);
      
      setNotifications(prev => 
        prev.filter(n => n.notification_id !== notificationId)
      );
      
      // Eğer silinecek bildirim okunmamışsa sayacı azalt
      const notification = notifications.find(n => n.notification_id === notificationId);
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
    } catch (err) {
      console.error('Bildirim silinirken hata:', err);
      throw err;
    }
  }, [notifications]);

  // Browser notification göster
  const showBrowserNotification = useCallback(async (title, message, options = {}) => {
    if ('Notification' in window) {
      let permission = Notification.permission;
      
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      
      if (permission === 'granted') {
        const notification = new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          tag: 'gida-destek',
          ...options
        });
        
        // 5 saniye sonra otomatik kapat
        setTimeout(() => notification.close(), 5000);
        
        return notification;
      }
    }
    return null;
  }, []);

  // WebSocket bağlantısı kurma
  const connectWebSocket = useCallback(() => {
    if (!userId) return null;
    
    const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:5000'}/notifications/${userId}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('Bildirim WebSocket bağlantısı kuruldu');
    };
    
    ws.onmessage = (event) => {
      try {
        const newNotification = JSON.parse(event.data);
        
        // Yeni bildirimi listeye ekle
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Browser notification göster
        showBrowserNotification(
          newNotification.title, 
          newNotification.message
        );
        
      } catch (err) {
        console.error('WebSocket mesaj parse hatası:', err);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket hatası:', error);
    };
    
    ws.onclose = () => {
      console.log('Bildirim WebSocket bağlantısı kapandı');
    };
    
    return ws;
  }, [userId, showBrowserNotification]);

  // Component mount olduğunda bildirimleri yükle
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Bildirim türüne göre stil sınıfı döndür
  const getNotificationStyle = useCallback((type) => {
    const styles = {
      order: 'border-l-4 border-blue-500 bg-blue-50',
      promo: 'border-l-4 border-green-500 bg-green-50',
      marketing: 'border-l-4 border-purple-500 bg-purple-50',
      system: 'border-l-4 border-gray-500 bg-gray-50',
      warning: 'border-l-4 border-yellow-500 bg-yellow-50',
      error: 'border-l-4 border-red-500 bg-red-50'
    };
    
    return styles[type] || styles.system;
  }, []);

  // Bildirim türüne göre ikon döndür
  const getNotificationIcon = useCallback((type) => {
    const icons = {
      order: '📦',
      promo: '🎉',
      marketing: '📢',
      system: '⚙️',
      warning: '⚠️',
      error: '❌'
    };
    
    return icons[type] || icons.system;
  }, []);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    showBrowserNotification,
    connectWebSocket,
    getNotificationStyle,
    getNotificationIcon
  };
};

export default useNotification;