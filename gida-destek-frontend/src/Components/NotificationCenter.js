// src/components/NotificationCenter.js
import React, { useEffect, useRef } from 'react';
import useNotification from '../hooks/useNotification';
import './notification.css'; // CSS dosyasını import et

const NotificationCenter = ({ userId, isOpen, onClose }) => {
  const {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    connectWebSocket,
    getNotificationStyle,
    getNotificationIcon
  } = useNotification(userId);

  const wsRef = useRef(null);

  // WebSocket bağlantısını kur
  useEffect(() => {
    if (userId) {
      wsRef.current = connectWebSocket();
      
      return () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    }
  }, [userId, connectWebSocket]);

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await markAsRead(notification.notification_id);
      } catch (error) {
        console.error('Bildirim okundu işaretlenemedi:', error);
      }
    }
  };

  const handleDeleteClick = async (e, notificationId) => {
    e.stopPropagation();
    
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Bildirim silinemedi:', error);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Şimdi';
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    return `${Math.floor(diffInHours / 24)} gün önce`;
  };

  if (!isOpen) return null;

  return (
    <div className="notification-center-overlay">
      <div className="notification-center">
        {/* Header */}
        <div className="notification-header">
          <div className="notification-title">
            <h3>Bildirimler</h3>
            {unreadCount > 0 && (
              <span className="unread-badge">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="notification-actions">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="mark-all-read-btn"
              >
                Tümünü Oku
              </button>
            )}
            <button
              onClick={onClose}
              className="close-btn"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="notification-content">
          {loading && (
            <div className="notification-loading">
              <div className="loading-spinner"></div>
            </div>
          )}

          {error && (
            <div className="notification-error">
              {error}
            </div>
          )}

          {notifications.length === 0 && !loading && (
            <div className="notification-empty">
              Henüz bildirim yok
            </div>
          )}

          {notifications.map((notification) => (
            <div
              key={notification.notification_id}
              onClick={() => handleNotificationClick(notification)}
              className={`notification-item ${
                !notification.is_read ? 'unread' : ''
              }`}
            >
              <div className="notification-item-content">
                <span className="notification-icon">
                  {getNotificationIcon(notification.notification_type)}
                </span>
                
                <div className="notification-details">
                  <div className="notification-item-header">
                    <h4 className="notification-title-text">
                      {notification.title}
                    </h4>
                    <button
                      onClick={(e) => handleDeleteClick(e, notification.notification_id)}
                      className="delete-btn"
                    >
                      🗑️
                    </button>
                  </div>
                  
                  <p className="notification-message">
                    {notification.message}
                  </p>
                  
                  <div className="notification-footer">
                    <span className="notification-time">
                      {formatTime(notification.created_at)}
                    </span>
                    {!notification.is_read && (
                      <div className="unread-dot"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;