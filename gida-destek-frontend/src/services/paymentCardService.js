// services/paymentCardService.js

// Kullanıcının kayıtlı kartlarını getir
export const getUserPaymentCards = async () => {
  try {
    const response = await fetch('/api/user/payment-cards', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error('Kartlar getirilirken hata:', error);
    throw error;
  }
};

// Yeni kart ekle
export const addPaymentCard = async (cardData) => {
  try {
    const response = await fetch('/api/user/payment-cards', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cardData)
    });
    
    return await response.json();
  } catch (error) {
    console.error('Kart eklenirken hata:', error);
    throw error;
  }
};

// Kartı güncelle
export const updatePaymentCard = async (cardId, cardData) => {
  try {
    const response = await fetch(`/api/user/payment-cards/${cardId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cardData)
    });
    
    return await response.json();
  } catch (error) {
    console.error('Kart güncellenirken hata:', error);
    throw error;
  }
};

// Kartı sil
export const deletePaymentCard = async (cardId) => {
  try {
    const response = await fetch(`/api/user/payment-cards/${cardId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error('Kart silinirken hata:', error);
    throw error;
  }
};

// Varsayılan kartı ayarla
export const setDefaultPaymentCard = async (cardId) => {
  try {
    const response = await fetch(`/api/user/payment-cards/${cardId}/set-default`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error('Varsayılan kart ayarlanırken hata:', error);
    throw error;
  }
};

// Kart doğrulama yardımcı fonksiyonları
export const validateCardNumber = (cardNumber) => {
  // Luhn algoritması ile kart numarası doğrulama
  const number = cardNumber.replace(/\s/g, '');
  
  if (!/^\d+$/.test(number)) {
    return false;
  }
  
  let sum = 0;
  let alternate = false;
  
  for (let i = number.length - 1; i >= 0; i--) {
    let n = parseInt(number.charAt(i), 10);
    
    if (alternate) {
      n *= 2;
      if (n > 9) {
        n = (n % 10) + 1;
      }
    }
    
    sum += n;
    alternate = !alternate;
  }
  
  return (sum % 10) === 0;
};

export const detectCardBrand = (cardNumber) => {
  const number = cardNumber.replace(/\s/g, '');
  
  if (/^4/.test(number)) return 'visa';
  if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) return 'mastercard';
  if (/^3[47]/.test(number)) return 'amex';
  if (/^6(?:011|5)/.test(number)) return 'discover';
  if (/^3[0689]/.test(number)) return 'diners';
  if (/^35/.test(number)) return 'jcb';
  if (/^62/.test(number)) return 'unionpay';
  
  return 'unknown';
};

export const formatCardNumber = (value) => {
  const number = value.replace(/\s/g, '');
  const match = number.match(/\d{4,16}/g);
  const matchedNumber = match && match[0] || '';
  
  if (matchedNumber.length <= 4) {
    return matchedNumber;
  }
  
  return matchedNumber.replace(/(\d{4})/g, '$1 ').trim();
};

export const formatExpiryDate = (value) => {
  const cleanValue = value.replace(/\D/g, '');
  
  if (cleanValue.length >= 2) {
    return cleanValue.substring(0, 2) + '/' + cleanValue.substring(2, 4);
  }
  
  return cleanValue;
};