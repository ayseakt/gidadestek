// pages/PaymentPage.jsx
import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/cartContext';
import { useNavigate } from 'react-router-dom';
import { FaCreditCard, FaPaypal, FaApple, FaGoogle } from 'react-icons/fa';

function PaymentPage() {
  const { 
    cartItems, 
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

  useEffect(() => {
    // Sayfa yüklendiğinde sepeti doğrula
    const checkCart = async () => {
      if (cartItems.length === 0) {
        navigate('/');
        return;
      }

      const validation = await validateCart();
      if (!validation.isValid) {
        setValidationError(validation.message);
      }
    };

    checkCart();
  }, [cartItems, navigate, validateCart]);

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      alert('Sepetiniz boş!');
      return;
    }

    const paymentData = {
      paymentMethod,
      deliveryAddress,
      customerNotes,
      estimatedPickupTime,
      cardData: paymentMethod === 'card' ? cardData : null
    };

    const result = await processPayment(paymentData);
    
    if (result.success) {
      // Başarı sayfasına yönlendir
      navigate('/siparis-basarili', { 
        state: { 
          orderId: result.orderId,
          trackingNumber: result.trackingNumber 
        }
      });
    } else {
      alert(result.message);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="payment-container">
        <h2>Sepetiniz Boş</h2>
        <p>Ödeme yapabilmek için sepetinizde ürün olması gerekiyor.</p>
        <button onClick={() => navigate('/')}>Alışverişe Dön</button>
      </div>
    );
  }

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
              disabled={isLoading}
            >
              {isLoading ? '⏳ İşleniyor...' : `💰 ${getCartTotal().toFixed(2)} TL Öde`}
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
                  <span className="item-price">₺{item.newPrice.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="order-total">
            <div className="total-row">
              <span>Ara Toplam:</span>
              <span>₺{getCartTotal().toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Hizmet Bedeli:</span>
              <span>₺0.00</span>
            </div>
            <div className="total-row final-total">
              <strong>
                <span>Toplam:</span>
                <span>₺{getCartTotal().toFixed(2)}</span>
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;