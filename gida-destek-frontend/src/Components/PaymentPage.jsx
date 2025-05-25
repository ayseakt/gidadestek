// pages/PaymentPage.jsx - İyileştirilmiş ödeme simülasyonu ile
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCart } from '../contexts/cartContext';
import { useNavigate } from 'react-router-dom';
import { FaCreditCard, FaPaypal, FaApple, FaGoogle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import './PaymentPage.css';

function PaymentPage() {
  const { 
    cartItems, 
    cartTotal,
    getCartTotal,
    processPayment, 
    isLoading, 
    validateCart 
  } = useCart();
  
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [estimatedPickupTime, setEstimatedPickupTime] = useState('');
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [validationError, setValidationError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  
  // ✅ Yeni state'ler - ödeme süreci için
  const [paymentStep, setPaymentStep] = useState('form'); // 'form', 'processing', 'success', 'error'
  const [paymentResult, setPaymentResult] = useState(null);
  const [processingMessage, setProcessingMessage] = useState('');
  
  const validateCartRef = useRef(false);
  const mountedRef = useRef(true);
  const { requestNotificationPermission } = useCart(); // ✅ burada çağrılır


  // Memoized validateCart fonksiyonu
  const memoizedValidateCart = useCallback(async () => {
    if (validateCartRef.current || isValidating) {
      console.log('Validation already in progress, skipping...');
      return;
    }
    
    validateCartRef.current = true;
    setIsValidating(true);
    
    try {
      console.log('Starting cart validation...');
      const validation = await validateCart();
      
      if (mountedRef.current) {
        if (!validation.isValid) {
          setValidationError(validation.message);
          console.log('Validation failed:', validation.message);
        } else {
          setValidationError('');
          console.log('Validation successful');
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
      if (mountedRef.current) {
        setValidationError('Sepet doğrulanırken hata oluştu');
      }
    } finally {
      if (mountedRef.current) {
        setIsValidating(false);
      }
      validateCartRef.current = false;
    }
  }, [validateCart, isValidating]);
    useEffect(() => {
      requestNotificationPermission(); // ✅ sadece çağrılması burada yapılır
    }, []);
  useEffect(() => {
    console.log('PaymentPage useEffect triggered, cartItems length:', cartItems.length);
    
    if (cartItems.length === 0) {
      console.log('Cart is empty, redirecting to home...');
      navigate('/');
      return;
    }

    memoizedValidateCart();

    return () => {
      console.log('PaymentPage cleanup');
    };
  }, [cartItems.length, navigate]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ✅ İyileştirilmiş ödeme işlemi
  const handlePayment = async (e) => {
    e.preventDefault();
    
    console.log('Payment process started...');
    
    if (cartItems.length === 0) {
      alert('Sepetiniz boş!');
      return;
    }

    if (isLoading || paymentStep === 'processing') {
      console.log('Payment already in progress, ignoring...');
      return;
    }

    try {
      // 1. Ödeme işlemi başlatıldı
      setPaymentStep('processing');
      setProcessingMessage('Ödeme bilgileri kontrol ediliyor...');

      // Gerçekçi mesajlar için zamanlama
      setTimeout(() => {
        setProcessingMessage(`${getPaymentMethodName(paymentMethod)} ile bağlantı kuruluyor...`);
      }, 1000);

      setTimeout(() => {
        setProcessingMessage('Ödeme işleniyor...');
      }, 2000);

      const paymentData = {
        paymentMethod,
        deliveryAddress,
        customerNotes,
        estimatedPickupTime,
        cardData: paymentMethod === 'card' ? cardData : null
      };
      paymentData.amount = getSafeTotal();

      console.log('Sending payment data:', paymentData);
      const result = await processPayment(paymentData);
      
      setPaymentResult(result);

      if (result.success) {
        console.log('Payment successful:', result);
        setPaymentStep('success');
        
        // 3 saniye sonra yönlendir
        setTimeout(() => {
          navigate('/orders', { 
            state: { 
              orderId: result.orderId,
              trackingNumber: result.trackingNumber,
              justCompleted: true
            }
          });
        }, 3000);
        
      } else {
        console.error('Payment failed:', result.message);
        setPaymentStep('error');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentResult({
        success: false,
        message: 'Ödeme işlemi sırasında beklenmeyen hata oluştu'
      });
      setPaymentStep('error');
    }
  };

  // Ödeme yöntemi adlarını al
  const getPaymentMethodName = (method) => {
    const names = {
      'card': 'Kredi Kartı',
      'paypal': 'PayPal',
      'apple': 'Apple Pay',
      'google': 'Google Pay'
    };
    return names[method] || method;
  };

  // Güvenli total hesaplama
  const getSafeTotal = useCallback(() => {
    if (typeof cartTotal === 'number') {
      return cartTotal;
    }
    
    if (typeof getCartTotal === 'function') {
      return getCartTotal();
    }
    
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.newPrice || item.price || 0) * parseInt(item.quantity || 1));
    }, 0);
  }, [cartTotal, getCartTotal, cartItems]);

  // ✅ Ödeme işlemi durumuna göre render
  if (paymentStep === 'processing') {
    return (
      <div className="payment-container">
        <div className="payment-processing">
          <div className="processing-animation">
            <div className="spinner"></div>
          </div>
          <h2>💳 Ödeme İşleniyor</h2>
          <p className="processing-message">{processingMessage}</p>
          <div className="processing-details">
            <p>Ödeme Tutarı: <strong>₺{getSafeTotal().toFixed(2)}</strong></p>
            <p>Ödeme Yöntemi: <strong>{getPaymentMethodName(paymentMethod)}</strong></p>
          </div>
          <small>Lütfen sayfayı kapatmayın veya yenilemeyin</small>
        </div>
      </div>
    );
  }

  // ✅ Başarılı ödeme ekranı
  if (paymentStep === 'success' && paymentResult) {
    return (
      <div className="payment-container">
        <div className="payment-success">
          <FaCheckCircle className="success-icon" />
          <h2>🎉 Ödeme Başarılı!</h2>
          <p className="success-message">{paymentResult.message}</p>
          
          <div className="success-details">
            <div className="detail-row">
              <span>Sipariş Numarası:</span>
              <strong>{paymentResult.trackingNumber}</strong>
            </div>
            <div className="detail-row">
              <span>Ödeme Tutarı:</span>
              <strong>₺{paymentResult.totalAmount}</strong>
            </div>
            <div className="detail-row">
              <span>Ödeme Yöntemi:</span>
              <strong>{getPaymentMethodName(paymentResult.paymentMethod)}</strong>
            </div>
            {paymentResult.transactionId && (
              <div className="detail-row">
                <span>İşlem No:</span>
                <strong>{paymentResult.transactionId}</strong>
              </div>
            )}
            <div className="detail-row">
              <span>Tahmini Hazırlanma:</span>
              <strong>{paymentResult.estimatedReadyTime || '30-45 dakika'}</strong>
            </div>
            {paymentResult.confirmationCode && (
            <div className="detail-row confirmation-code-row">
              <span>🎫 Onay Kodu:</span>
              <strong className="confirmation-code">{paymentResult.confirmationCode}</strong>
            </div>
          )}

          // ve hemen altına:
          <div className="confirmation-note">
            <small>💡 Bu onay kodunu mağazaya göstermeniz yeterli</small>
          </div>"
          </div>

          <div className="success-actions">
            <button 
              className="primary-button"
              onClick={() => navigate('/orders')}
            >
              Siparişlerimi Görüntüle
            </button>
          </div>
          
          <p className="redirect-notice">3 saniye içinde siparişler sayfasına yönlendirileceksiniz...</p>
        </div>
      </div>
    );
  }

  // ✅ Başarısız ödeme ekranı
  if (paymentStep === 'error' && paymentResult) {
    return (
      <div className="payment-container">
        <div className="payment-error">
          <FaTimesCircle className="error-icon" />
          <h2>❌ Ödeme başarısız</h2>
          <p className="error-message">{paymentResult.message}</p>
          
          {paymentResult.suggestions && (
            <div className="error-suggestions">
              <h4>Öneriler:</h4>
              <ul>
                {paymentResult.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="error-actions">
            <button 
              className="retry-button"
              onClick={() => {
                setPaymentStep('form');
                setPaymentResult(null);
              }}
            >
              Tekrar Dene
            </button>
            <button 
              className="secondary-button"
              onClick={() => navigate('/cart')}
            >
              Sepete Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isValidating) {
    return (
      <div className="payment-container">
        <div className="loading-state">
          <h2>⏳ Sepet kontrol ediliyor...</h2>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="payment-container">
        <h2>Sepetiniz Boş</h2>
        <p>Ödeme yapabilmek için sepetinizde ürün olması gerekiyor.</p>
        <button onClick={() => navigate('/')}>Alışverişe Dön</button>
      </div>
    );
  }

  const totalAmount = getSafeTotal();

  return (
    <div className="payment-container">
      <div className="payment-content">
        {/* Sol taraf - Ödeme formu */}
        <div className="payment-form-section">
          <h2>💳 Ödeme Bilgileri</h2>
          
          {validationError && (
            <div className="validation-error">
              ⚠️ {validationError}
            </div>
          )}

          <form onSubmit={handlePayment}>
            {/* Ödeme yöntemi seçimi */}
            <div className="payment-methods">
              <h3>Ödeme Yöntemi</h3>
              <div className="payment-options">
                <label className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    value="card" 
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <FaCreditCard /> Kredi/Banka Kartı
                </label>
                
                <label className={`payment-option ${paymentMethod === 'paypal' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    value="paypal" 
                    checked={paymentMethod === 'paypal'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <FaPaypal /> PayPal
                </label>
                
                <label className={`payment-option ${paymentMethod === 'apple' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    value="apple" 
                    checked={paymentMethod === 'apple'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <FaApple /> Apple Pay
                </label>
                
                <label className={`payment-option ${paymentMethod === 'google' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    value="google" 
                    checked={paymentMethod === 'google'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <FaGoogle /> Google Pay
                </label>
              </div>
            </div>

            {/* Kart bilgileri (sadece kart seçiliyse) */}
            {paymentMethod === 'card' && (
              <div className="card-details">
                <div className="form-group">
                  <label>Kart Numarası</label>
                  <input 
                    type="text" 
                    placeholder="1234 5678 9012 3456"
                    value={cardData.number}
                    onChange={(e) => setCardData({...cardData, number: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Son Kullanma</label>
                    <input 
                      type="text" 
                      placeholder="MM/YY"
                      value={cardData.expiry}
                      onChange={(e) => setCardData({...cardData, expiry: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input 
                      type="text" 
                      placeholder="123"
                      value={cardData.cvv}
                      onChange={(e) => setCardData({...cardData, cvv: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Kart Üzerindeki İsim</label>
                  <input 
                    type="text" 
                    placeholder="AHMET YILMAZ"
                    value={cardData.name}
                    onChange={(e) => setCardData({...cardData, name: e.target.value})}
                    required
                  />
                </div>
              </div>
            )}
            <div className="test-cards-info">
              <h4>🧪 Test Kartları (Simülasyon Modu)</h4>
              <div className="test-card-list">
                <p><strong>✅ Başarılı Ödeme:</strong> 4242 4242 4242 4242</p>
                <p><strong>❌ Reddedilir:</strong> 4000 0000 0000 0002</p>
                <p><strong>💳 Limit Yetersiz:</strong> 4000 0000 0000 9995</p>
                <p><strong>⏰ Süresi Dolmuş:</strong> 4000 0000 0000 0019</p>
              </div>
              <div className="test-card-details">
                <small><strong>CVV:</strong> 123 | <strong>Son Kullanma:</strong> 12/26 | <strong>İsim:</strong> TEST KULLANICI</small>
              </div>
              <div className="simulation-note">
                <small>🔄 Bu uygulama simülasyon modunda çalışmaktadır. Gerçek para işlemi yapılmaz.</small>
              </div>
            </div>
            {/* Teslimat bilgileri */}
            <div className="delivery-details">
              <div className="form-group">
                <label>Teslimat Adresi</label>
                <textarea 
                  placeholder="Paketinizi nereden alacaksınız?"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Tahmini Alış Zamanı</label>
                <input 
                  type="datetime-local"
                  value={estimatedPickupTime}
                  onChange={(e) => setEstimatedPickupTime(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Özel Notlar (Opsiyonel)</label>
                <textarea 
                  placeholder="Varsa özel taleplerinizi belirtin..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="pay-button"
              disabled={isLoading || isValidating}
            >
              {isLoading ? '⏳ İşleniyor...' : `💰 ${totalAmount.toFixed(2)} TL Öde`}
            </button>
          </form>
        </div>

        {/* Sağ taraf - Sipariş özeti */}
        <div className="order-summary">
          <h3>📋 Sipariş Özeti</h3>
          
          <div className="order-items">
            {cartItems.map((item, index) => (
              <div key={index} className="order-item">
                <img src={item.image || 'https://via.placeholder.com/60'} alt={item.product} />
                <div className="item-details">
                  <h4>{item.product}</h4>
                  <p>{item.storeName}</p>
                  <span className="item-price">₺{(item.newPrice || 0).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="order-total">
            <div className="total-row">
              <span>Ara Toplam:</span>
              <span>₺{totalAmount.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Hizmet Bedeli:</span>
              <span>₺0.00</span>
            </div>
            <div className="total-row final-total">
              <strong>
                <span>Toplam:</span>
                <span>₺{totalAmount.toFixed(2)}</span>
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;