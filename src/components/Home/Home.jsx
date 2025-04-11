import React, { useState, useEffect } from 'react';
import './Home.css';
import FoodCard from '../FoodCard/FoodCard';

function Home() {
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFoodItems = async () => {
      try {
        const response = await fetch('http://localhost:5050/api/foods');
        if (!response.ok) {
          throw new Error('Yemekler yüklenemedi');
        }
        const data = await response.json();
        setFoodItems(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchFoodItems();
  }, []);

  if (loading) return <div className="loading">Yükleniyor...</div>;
  if (error) return <div className="error">Hata: {error}</div>;

  return (
    <div className="home-container">
      <div className="hero-section">
        <h2>İhtiyaç Sahiplerine Gıda Desteği</h2>
        <p>İhtiyaç fazlası gıdalarınızı paylaşarak israfı önleyin ve destek olun.</p>
        <button className="donate-btn">Şimdi Bağış Yap</button>
      </div>

      <div className="categories">
        <h3>Kategoriler</h3>
        <div className="category-list">
          <div className="category-item">Sıcak Yemek</div>
          <div className="category-item">Kuru Gıda</div>
          <div className="category-item">Sebze & Meyve</div>
          <div className="category-item">Ekmek</div>
        </div>
      </div>

      <div className="available-foods">
        <h3>Mevcut Gıdalar</h3>
        <div className="food-grid">
          {foodItems.length > 0 ? (
            foodItems.map((item) => (
              <FoodCard key={item.id} food={item} />
            ))
          ) : (
            <p>Henüz gıda ilanı bulunmamaktadır.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;