import React from 'react';
import './FoodCard.css';

function FoodCard({ food }) {
  return (
    <div className="food-card">
      <div className="food-image">
        <img 
          src={food.image_url || '/default-food.jpg'} 
          alt={food.name} 
        />
        <span className="distance">{food.distance || '1 km'}</span>
      </div>
      <div className="food-content">
        <h4>{food.name}</h4>
        <div className="food-meta">
          <span className="category">{food.category || 'Kategori belirtilmemiş'}</span>
          <div className="rating">
            <span className="star">★</span> {food.rating || '5.0'}
          </div>
        </div>
        <div className="food-details">
          <div className="location">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 13.5C13.3807 13.5 14.5 12.3807 14.5 11C14.5 9.61929 13.3807 8.5 12 8.5C10.6193 8.5 9.5 9.61929 9.5 11C9.5 12.3807 10.6193 13.5 12 13.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 21C16 17 20 13.4183 20 10C20 6.13401 16.4183 3 12 3C7.58172 3 4 6.13401 4 10C4 13.4183 8 17 12 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{food.location || 'Konum belirtilmemiş'}</span>
          </div>
          <div className="time">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{food.pickup_time || 'Zaman belirtilmemiş'}</span>
          </div>
        </div>
        <div className="food-footer">
          <div className="price">{food.price || 'Ücretsiz'}</div>
          <button className="request-btn">Talep Et</button>
        </div>
      </div>
    </div>
  );
}

export default FoodCard;