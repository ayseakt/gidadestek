import React from 'react';
import { 
  FaHeart, 
  FaArrowLeft, 
  FaClock,
  FaMapMarkerAlt,
  FaLeaf
} from 'react-icons/fa';
import './Favorites.css'; // Bu dosyayı daha sonra oluşturacağız

const Favorites = ({ 
  favorites, 
  allBusinesses, 
  toggleFavorite, 
  handleProductClick, 
  handleBuy,
  onBackClick 
}) => {
  const favoritedBusinesses = allBusinesses.filter(business => favorites.includes(business.id));

  return (
    <div className="favorites-container">
      <div className="favorites-header">
        <button className="back-button" onClick={onBackClick}>
          <FaArrowLeft /> Geri
        </button>
        <h2 className="favorites-title">Favorilerim</h2>
      </div>

      {favoritedBusinesses.length === 0 ? (
        <div className="no-favorites">
          <FaHeart size={48} color="#ccc" />
          <p>Henüz favori eklemediniz</p>
          <button className="browse-button" onClick={onBackClick}>Paketlere Göz At</button>
        </div>
      ) : (
        <div className="favorites-grid">
          {favoritedBusinesses.map((business) => (
            <div key={business.id} className="favorite-card" onClick={() => handleProductClick(business)}>
              <div className="favorite-image-container">
                <img src={business.image} alt={business.product} className="favorite-image" />
                <div 
                  className="remove-favorite-button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(business.id);
                  }}
                >
                  <FaHeart color="#FF5A5F" />
                </div>
                <div className="food-saved-tag">
                  <FaLeaf /> {business.savedCount} paket kurtarıldı
                </div>
              </div>
              <div className="favorite-info">
                <div className="store-name">{business.storeName}</div>
                <div className="product-name">{business.product}</div>
                <div className="product-details">
                  <div className="collection-info">
                    <div className="pickup-time">
                      <FaClock /> {business.time}
                    </div>
                    <div className="distance">
                      <FaMapMarkerAlt /> {business.distance}
                    </div>
                  </div>
                  <div className="price-info">
                    <div className="old-price">₺{business.oldPrice.toFixed(2)}</div>
                    <div className="new-price">₺{business.newPrice.toFixed(2)}</div>
                  </div>
                </div>
                <button 
                  className="reserve-button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBuy(business);
                  }}
                >
                  Paket Ayır
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;