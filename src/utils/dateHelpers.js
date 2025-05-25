// utils/dateHelpers.js

/**
 * Tarih nesnesini Türkçe formatında gösteren fonksiyon
 * @param {string|Date} dateValue - Formatlanacak tarih değeri
 * @returns {string} - Formatlanmış tarih string'i
 */
export const formatDisplayDate = (dateValue) => {
  if (!dateValue) return 'Belirtilmemiş';
  
  try {
    const date = new Date(dateValue);
    
    // Geçersiz tarih kontrolü
    if (isNaN(date.getTime())) {
      return 'Geçersiz Tarih';
    }
    
    // Türkçe lokale göre formatlama
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Tarih formatlama hatası:', error);
    return 'Geçersiz Tarih';
  }
};

/**
 * Tarih ve saat nesnesini Türkçe formatında gösteren fonksiyon
 * @param {string|Date} dateValue - Formatlanacak tarih-saat değeri
 * @returns {string} - Formatlanmış tarih-saat string'i
 */
export const formatDisplayDateTime = (dateValue) => {
  if (!dateValue) return 'Belirtilmemiş';
  
  try {
    const date = new Date(dateValue);
    
    // Geçersiz tarih kontrolü
    if (isNaN(date.getTime())) {
      return 'Geçersiz Tarih';
    }
    
    // Türkçe lokale göre formatlama
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Tarih-saat formatlama hatası:', error);
    return 'Geçersiz Tarih';
  }
};

/**
 * Sadece saat formatını gösteren fonksiyon
 * @param {string|Date} dateValue - Formatlanacak tarih-saat değeri
 * @returns {string} - Formatlanmış saat string'i
 */
export const formatDisplayTime = (dateValue) => {
  if (!dateValue) return 'Belirtilmemiş';
  
  try {
    const date = new Date(dateValue);
    
    // Geçersiz tarih kontrolü
    if (isNaN(date.getTime())) {
      return 'Geçersiz Saat';
    }
    
    // Sadece saat:dakika formatı
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Saat formatlama hatası:', error);
    return 'Geçersiz Saat';
  }
};

/**
 * Teslim zaman aralığını formatlayan fonksiyon
 * @param {string|Date} startTime - Başlangıç zamanı
 * @param {string|Date} endTime - Bitiş zamanı
 * @returns {string} - Formatlanmış zaman aralığı
 */
export const formatPickupTimeRange = (startTime, endTime) => {
  const formattedStart = formatDisplayDateTime(startTime);
  const formattedEnd = formatDisplayDateTime(endTime);
  
  if (formattedStart === 'Belirtilmemiş' && formattedEnd === 'Belirtilmemiş') {
    return 'Teslim zamanı belirtilmemiş';
  }
  
  if (formattedStart === 'Belirtilmemiş') {
    return `Bitiş: ${formattedEnd}`;
  }
  
  if (formattedEnd === 'Belirtilmemiş') {
    return `Başlangıç: ${formattedStart}`;
  }
  
  return `${formattedStart} - ${formattedEnd}`;
};

/**
 * Input elementleri için tarih formatını düzenleyen fonksiyon
 * @param {string|Date} dateValue - Formatlanacak tarih değeri
 * @returns {string} - YYYY-MM-DD formatında string
 */
export const formatDateForInput = (dateValue) => {
  if (!dateValue) return '';
  
  try {
    const date = new Date(dateValue);
    
    // Geçersiz tarih kontrolü
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // YYYY-MM-DD formatı
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Input tarih formatlama hatası:', error);
    return '';
  }
};

/**
 * Input elementleri için datetime-local formatını düzenleyen fonksiyon
 * @param {string|Date} dateValue - Formatlanacak tarih-saat değeri
 * @returns {string} - YYYY-MM-DDTHH:mm formatında string
 */
export const formatDateTimeForInput = (dateValue) => {
  if (!dateValue) return '';
  
  try {
    const date = new Date(dateValue);
    
    // Geçersiz tarih kontrolü
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // YYYY-MM-DDTHH:mm formatı
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error('DateTime input formatlama hatası:', error);
    return '';
  }
};

/**
 * MySQL datetime formatına çeviren fonksiyon
 * @param {string|Date} dateValue - Formatlanacak tarih-saat değeri
 * @returns {string} - YYYY-MM-DD HH:mm:ss formatında string
 */
export const toMySQLDateTime = (dateValue) => {
  if (!dateValue) return '';
  
  try {
    const date = new Date(dateValue);
    
    // Geçersiz tarih kontrolü
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const pad = (n) => n.toString().padStart(2, '0');
    
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  } catch (error) {
    console.error('MySQL datetime formatlama hatası:', error);
    return '';
  }
};

/**
 * Tarih aralığının geçerli olup olmadığını kontrol eden fonksiyon
 * @param {string|Date} startDate - Başlangıç tarihi
 * @param {string|Date} endDate - Bitiş tarihi
 * @returns {object} - {isValid: boolean, message: string}
 */
export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return {
      isValid: false,
      message: 'Başlangıç ve bitiş tarihleri gereklidir'
    };
  }
  
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        isValid: false,
        message: 'Geçersiz tarih formatı'
      };
    }
    
    if (end <= start) {
      return {
        isValid: false,
        message: 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır'
      };
    }
    
    return {
      isValid: true,
      message: 'Tarih aralığı geçerli'
    };
  } catch (error) {
    return {
      isValid: false,
      message: 'Tarih doğrulama hatası'
    };
  }
};

/**
 * Tarihin bugünden ne kadar sonra/önce olduğunu hesaplayan fonksiyon
 * @param {string|Date} dateValue - Karşılaştırılacak tarih
 * @returns {string} - "X gün sonra", "X gün önce" formatında string
 */
export const getRelativeDate = (dateValue) => {
  if (!dateValue) return 'Belirtilmemiş';
  
  try {
    const date = new Date(dateValue);
    const now = new Date();
    
    if (isNaN(date.getTime())) {
      return 'Geçersiz Tarih';
    }
    
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `${diffDays} gün sonra`;
    } else if (diffDays < 0) {
      return `${Math.abs(diffDays)} gün önce`;
    } else {
      return 'Bugün';
    }
  } catch (error) {
    console.error('Göreceli tarih hesaplama hatası:', error);
    return 'Hesaplanamadı';
  }
};