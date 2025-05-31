export const getNotificationIcon = (type) => {
  const icons = {
    order: '📦',
    promo: '🎉',
    system: '⚙️',
    marketing: '📢'
  };
  return icons[type] || '📌';
};

export const formatNotificationTime = (createdAt) => {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now - created;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Az önce';
  if (diffMins < 60) return `${diffMins} dakika önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  if (diffDays < 7) return `${diffDays} gün önce`;
  
  return created.toLocaleDateString('tr-TR');
};

export const getNotificationTypeText = (type) => {
  const types = {
    order: 'Sipariş',
    promo: 'Promosyon', 
    system: 'Sistem',
    marketing: 'Pazarlama'
  };
  return types[type] || 'Bildirim';
};
