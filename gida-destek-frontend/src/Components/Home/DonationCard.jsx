// DonationCard.jsx - Güncellenmiş hali

import React from 'react';
import { FaHandHoldingHeart } from 'react-icons/fa';

const DonationCard = ({ title, description, amount, image }) => {
  const handleDonate = () => {
    alert(`${amount} TL tutarında bağış yapmak için ödeme sayfasına yönlendiriliyorsunuz.`);
    // Burada bağış için ödeme sayfasına yönlendirme eklenebilir
  };

  return (
    <div className="donation-card product-card">
      {/* Burada product-image-container ve product-image classlarını kullandık */}
      <div className="product-image-container">
        <img src={image} alt={title} className="product-image" />
      </div>
      <div className="donation-content product-info">
        <h3 className="donation-title product-name">{title}</h3>
        <p className="donation-description">{description}</p>
        <div className="donation-amount price-info">
          <span className="amount-value new-price">{amount} TL</span>
        </div>
        <button 
          className="donate-button reserve-button" 
          onClick={handleDonate}
        >
          <FaHandHoldingHeart /> Bağış Yap
        </button>
      </div>
    </div>
  );
};

export default DonationCard;
