// utils/paymentSimulator.js
// Ödeme simülasyon sınıfı - utilities klasöründe

export class PaymentSimulator {
  constructor() {
    this.processingTime = {
      card: 2000,
      paypal: 1500,
      apple: 1000,
      google: 1200
    };
    
    this.successRate = 0.85; // %85 başarı oranı
  }

  async processPayment(paymentData) {
    const { paymentMethod, cardData, amount } = paymentData;
    
    console.log('PaymentSimulator: Processing payment...', paymentData);

    // 1. Kart doğrulama
    if (paymentMethod === 'card') {
      const cardValidation = this.validateCard(cardData);
      if (!cardValidation.isValid) {
        return {
          success: false,
          message: cardValidation.message,
          errorCode: cardValidation.code,
          suggestions: this.getErrorSuggestions(cardValidation.code)
        };
      }
    }

    // 2. İşlem süresi simülasyonu
    await this.delay(this.processingTime[paymentMethod] || 2000);

    // 3. Başarı/başarısızlık simülasyonu
    const isSuccess = Math.random() < this.successRate;
    
    if (isSuccess) {
      return this.generateSuccessResponse(paymentData);
    } else {
      return this.generateFailureResponse(paymentData);
    }
  }

  validateCard(cardData) {
    if (!cardData || !cardData.number) {
      return { isValid: false, message: 'Kart numarası gerekli', code: 'CARD_NUMBER_MISSING' };
    }

    // Test kartları
    const testCards = {
      '4242424242424242': 'success',
      '4000000000000002': 'declined',
      '4000000000000019': 'expired',
      '4000000000009995': 'insufficient_funds'
    };

    const cleanNumber = cardData.number.replace(/\s/g, '');
    
    if (testCards[cleanNumber] && testCards[cleanNumber] !== 'success') {
      return { 
        isValid: false, 
        message: this.getCardErrorMessage(testCards[cleanNumber]),
        code: testCards[cleanNumber].toUpperCase()
      };
    }

    // Basit kart doğrulama
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return { isValid: false, message: 'Geçersiz kart numarası uzunluğu', code: 'INVALID_LENGTH' };
    }

    if (!cardData.cvv || cardData.cvv.length < 3) {
      return { isValid: false, message: 'Geçersiz CVV', code: 'INVALID_CVV' };
    }

    if (!this.isValidExpiry(cardData.expiry)) {
      return { isValid: false, message: 'Kart süresi dolmuş veya geçersiz', code: 'EXPIRED_CARD' };
    }

    return { isValid: true };
  }

  isValidExpiry(expiry) {
    if (!expiry || !expiry.includes('/')) return false;
    
    const [month, year] = expiry.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    const cardYear = parseInt(year);
    const cardMonth = parseInt(month);
    
    if (cardYear < currentYear) return false;
    if (cardYear === currentYear && cardMonth < currentMonth) return false;
    
    return cardMonth >= 1 && cardMonth <= 12;
  }

generateSuccessResponse(paymentData) {
  return {
    success: true,
    message: "Ödeme başarıyla tamamlandı! Siparişiniz hazırlanmaya başlandı.",
    orderId: this.generateOrderId(),
    trackingNumber: this.generateTrackingNumber(),
    transactionId: this.generateTransactionId(),
    confirmationCode: Math.floor(Math.random() * 900000) + 100000, // 6 haneli onay kodu
    totalAmount: parseFloat(paymentData.amount || 0).toFixed(2),
    paymentMethod: paymentData.paymentMethod,
    timestamp: new Date().toISOString(),
    estimatedReadyTime: this.calculateReadyTime(),
    bankResponseCode: '00',
    authorizationCode: this.generateAuthCode(),
    customerInfo: {
      deliveryAddress: paymentData.deliveryAddress,
      estimatedPickupTime: paymentData.estimatedPickupTime,
      customerNotes: paymentData.customerNotes
    }
  };
}

  generateFailureResponse(paymentData) {
    const errors = [
      { message: "Kart limitiniz bu işlem için yetersiz", code: "INSUFFICIENT_FUNDS" },
      { message: "Kartınız geçici olarak bloke durumda", code: "CARD_BLOCKED" },
      { message: "İş bankanız ile bağlantı kurulamadı", code: "BANK_CONNECTION_ERROR" },
      { message: "3D Secure doğrulama başarısız oldu", code: "3DS_FAILED" },
      { message: "Geçersiz işlem tespit edildi", code: "INVALID_TRANSACTION" }
    ];

    const randomError = errors[Math.floor(Math.random() * errors.length)];

    return {
      success: false,
      message: randomError.message,
      errorCode: randomError.code,
      bankResponseCode: this.getBankErrorCode(randomError.code),
      suggestions: this.getErrorSuggestions(randomError.code),
      timestamp: new Date().toISOString(),
      retryAllowed: true
    };
  }

  // Yardımcı fonksiyonlar
  generateOrderId() {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  generateTrackingNumber() {
    return `TRK${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  }

  generateTransactionId() {
    return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  }

  generateAuthCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  calculateReadyTime() {
    const minutes = Math.floor(Math.random() * 30) + 20;
    return `${minutes}-${minutes + 15} dakika`;
  }

  getBankErrorCode(errorCode) {
    const codes = {
      'INSUFFICIENT_FUNDS': '51',
      'CARD_BLOCKED': '41',  
      'INVALID_TRANSACTION': '12',
      'BANK_CONNECTION_ERROR': '96',
      '3DS_FAILED': '91'
    };
    return codes[errorCode] || '05';
  }

  getErrorSuggestions(errorCode) {
    const suggestions = {
      'INSUFFICIENT_FUNDS': [
        'Kart limitinizi kontrol edin',
        'Farklı bir kart deneyin', 
        'Bankanızla iletişime geçin'
      ],
      'CARD_BLOCKED': [
        'Bankanızı arayarak kart durumunu öğrenin',
        'Kartınızın bloke olmadığından emin olun'
      ],
      'BANK_CONNECTION_ERROR': [
        'Birkaç dakika sonra tekrar deneyin',
        'İnternet bağlantınızı kontrol edin'
      ],
      '3DS_FAILED': [
        '3D Secure şifrenizi doğru girdiğinizden emin olun',
        'SMS kodunu kontrol edin'
      ],
      'INVALID_TRANSACTION': [
        'Kart bilgilerinizi tekrar kontrol edin',
        'Farklı ödeme yöntemi deneyin'
      ]
    };
    return suggestions[errorCode] || ['Lütfen tekrar deneyiniz'];
  }

  getCardErrorMessage(errorType) {
    const messages = {
      'declined': 'Kart işlemi bankanız tarafından reddedildi',
      'insufficient_funds': 'Kart limitiniz bu işlem için yetersiz',
      'expired': 'Kartınızın süresi dolmuş'
    };
    return messages[errorType] || 'Kart ile ilgili bir hata oluştu';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Test kartları sabitleri
export const TEST_CARDS = {
  SUCCESS: '4242 4242 4242 4242',
  DECLINED: '4000 0000 0000 0002', 
  INSUFFICIENT_FUNDS: '4000 0000 0000 9995',
  EXPIRED: '4000 0000 0000 0019'
};

export default PaymentSimulator;