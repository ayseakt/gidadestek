import React from 'react';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <div className="hero">
        <h1>Gıda Destek Sistemine Hoş Geldiniz</h1>
        <p>Gıda ihtiyacınızı karşılayacak en uygun seçenekleri bulun</p>
      </div>
      <div className="container">
        <div className="features">
          <h2>Nasıl Çalışır?</h2>
          <div className="feature-cards">
            <div className="feature-card">
              <h3>Gıda Ekle</h3>
              <p>İhtiyaç fazlası gıdalarınızı paylaşın</p>
            </div>
            <div className="feature-card">
              <h3>Gıda Bul</h3>
              <p>İhtiyacınız olan gıdalara ulaşın</p>
            </div>
            <div className="feature-card">
              <h3>Bağlantı Kur</h3>
              <p>Gıda sahipleriyle iletişime geçin</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;