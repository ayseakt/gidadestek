// DonationCard.jsx - Bu yeni bir bileşen olarak oluşturulmalı

import React from 'react';
import { FaHandHoldingHeart } from 'react-icons/fa';

const DonationCard = ({ title, description, amount, image }) => {
  const handleDonate = () => {
    alert(`${amount} TL tutarında bağış yapmak için ödeme sayfasına yönlendiriliyorsunuz.`);
    // Burada bağış için ödeme sayfasına yönlendirme eklenebilir
  };

  return (
    <div className="donation-card">
      <div className="donation-image-container">
        <img src={image} alt={title} className="donation-image" />
      </div>
      <div className="donation-content">
        <h3 className="donation-title">{title}</h3>
        <p className="donation-description">{description}</p>
        <div className="donation-amount">
          <span className="amount-value">{amount} TL</span>
        </div>
        <button 
          className="donate-button" 
          onClick={handleDonate}
        >
          <FaHandHoldingHeart /> Bağış Yap
        </button>
      </div>
    </div>
  );
};

export default DonationCard;