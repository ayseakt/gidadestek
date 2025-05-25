// pages/OrderSuccessPage.jsx
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/cartContext';
import './OrderSuccessPage.css';

function OrderSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loadOrderHistory } = useCart();
  
  // URL state'den gelen veriler
  const { orderId, trackingNumber } = location.state || {};

  useEffect(() => {
    // Sipariş geçmişini yenile
    loadOrderHistory();
    
    // Eğer sipariş bilgileri yoksa anasayfaya yönlendir
    if (!orderId) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [orderId, navigate, loadOrderHistory]);

  if (!orderId) {
    return (
      <div className="order-success-container">
        <div className="success-card">
          <div className="error-icon">❌</div>
          <h2>Sipariş Bilgisi Bulunamadı</h2>
          <p>Anasayfaya yönlendiriliyorsunuz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-success-container">
      <div className="success-card">
        <div className="success-icon">
          <div className="checkmark">✓</div>
        </div>
        
        <h1>Sipariş Başarıyla Oluşturuldu!</h1>
        <p className="success-message">
          Siparişiniz başarıyla alındı ve işleme koyuldu.
        </p>
        
        <div className="order-details">
          <div className="detail-item">
            <strong>Sipariş ID:</strong>
            <span>#{orderId}</span>
          </div>
          
          {trackingNumber && (
            <div className="detail-item">
              <strong>Takip Numarası:</strong>
              <span>{trackingNumber}</span>
            </div>
          )}
          
          <div className="detail-item">
            <strong>Durum:</strong>
            <span className="status-badge pending">Hazırlanıyor</span>
          </div>
        </div>
        
        <div className="info-box">
          <h3>📱 Sipariş Takibi</h3>
          <p>
            Siparişinizin durumunu "Siparişlerim" sayfasından takip edebilirsiniz. 
            Hazır olduğunda size bildirim gönderilecektir.
          </p>
        </div>
        
        <div className="action-buttons">
          <button 
            className="btn-primary"
            onClick={() => navigate('/siparislerim')}
          >
            📋 Siparişlerimi Görüntüle
          </button>
          
          <button 
            className="btn-secondary"
            onClick={() => navigate('/')}
          >
            🏠 Anasayfaya Dön
          </button>
        </div>
        
        <div className="next-steps">
          <h4>Sıradaki Adımlar:</h4>
          <div className="steps">
            <div className="step active">
              <span className="step-number">1</span>
              <span>Sipariş Alındı</span>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <span>Hazırlanıyor</span>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <span>Hazır</span>
            </div>
            <div className="step">
              <span className="step-number">4</span>
              <span>Teslim Edildi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccessPage;