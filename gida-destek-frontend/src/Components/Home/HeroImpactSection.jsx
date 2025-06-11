import React, { useState, useEffect } from 'react';
import { FaPlay, FaPause, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const FoodWasteSlider = ({ impactStats }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

const slides = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    title: "Çöpe Atılan Taze Yiyecekler",
    subtitle: "Her gün milyonlarca taze ürün çöpe gidiyor",
    stat: "26 milyon ekmek/gün",
    description: "Türkiye'de günlük israf edilen ekmek miktarı",
    overlay: "rgba(46, 125, 50, 0.7)"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1559526324-593bc073d938?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", // Aile mutfakta yemek israfı
    title: "Evlerdeki Gıda İsrafı",
    subtitle: "Aileler farkında olmadan ne kadar israf ediyor",
    stat: "%43 ev israfı",
    description: "Toplam gıda israfının neredeyse yarısı evlerde oluyor",
    overlay: "rgba(56, 142, 60, 0.7)"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    title: "İsraf vs Açlık Kontrası",
    subtitle: "Bir tarafta israf, diğer tarafta açlık",
    stat: "828 milyon insan aç",
    description: "Dünyada 1/3 yemek israf edilirken açlık sürüyor",
    overlay: "rgba(67, 160, 71, 0.7)"
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", // Market çalışanı ürünleri kontrol ediyor
    title: "Marketlerdeki Kayıplar",
    subtitle: "Satış noktalarında biriken sağlıklı gıdalar",
    stat: "40% indirim",
    description: "Son kullanma tarihi yakın ürünler kurtarılmayı bekliyor",
    overlay: "rgba(76, 175, 80, 0.7)"
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", // Restoran mutfağında atık yiyecekler
    title: "Restoran İsrafı",
    subtitle: "Yemek sektöründeki büyük kayıplar",
    stat: "1.6 milyon ton",
    description: "Türkiye'de restoranlardan yıllık israf miktarı",
    overlay: "rgba(46, 125, 50, 0.7)"
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1628618345907-a2c5e64a8ca0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", // Çiftçi tarlada bozuk ürünlerle
    title: "Tarladaki Kayıplar",
    subtitle: "Hasat öncesi ve sonrası israf",
    stat: "%25 üretim kaybı",
    description: "Ürünler tarladan sofraya gelirken kaybolup gidiyor",
    overlay: "rgba(56, 142, 60, 0.7)"
  },
  {
    id: 7,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", // Gönüllüler yemek dağıtırken
    title: "Kurtarma Hareketi",
    subtitle: "Birlikte israfı durdurabiliriz",
    stat: "50k+ kullanıcı",
    description: "Şimdiden binlerce kişi gıda kurtarma hareketinde",
    overlay: "rgba(67, 160, 71, 0.7)"
  }
];
  useEffect(() => {
    if (!isPlaying || isHovered) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPlaying, isHovered, slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="food-waste-slider-container">
      <div 
        className="slider-wrapper"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Ana Slider */}
        <div className="slider-main">
          <div 
            className="slide-background"
            style={{
              background: `linear-gradient(${currentSlideData.overlay}, ${currentSlideData.overlay}), url(${currentSlideData.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          
          {/* Slide İçeriği */}
          <div className="slide-content">
            <div className="slide-text">
              <h2 className="slide-main-title">{currentSlideData.title}</h2>
              <p className="slide-subtitle">{currentSlideData.subtitle}</p>
              
              <div className="slide-stats">
                <div className="stat-number">{currentSlideData.stat}</div>
                <div className="stat-description">{currentSlideData.description}</div>
              </div>
              
              <div className="slide-cta">
                <button className="cta-button">
                  🛡️ Sen de Kurtarmaya Başla
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Okları */}
          <button className="nav-arrow nav-prev" onClick={prevSlide}>
            <FaChevronLeft />
          </button>
          <button className="nav-arrow nav-next" onClick={nextSlide}>
            <FaChevronRight />
          </button>

          {/* Play/Pause Butonu */}
          <button className="play-pause-btn" onClick={togglePlayPause}>
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
        </div>

        {/* Alt İndikatörler */}
        <div className="slide-indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>

        {/* Mini İmpact Counter */}
        <div className="mini-impact-display">
          <div className="impact-item">
            <span className="impact-icon">🍽️</span>
            <span className="impact-number">{impactStats.savedFood}</span>
            <span className="impact-label">Kurtarılan</span>
          </div>
          <div className="impact-item">
            <span className="impact-icon">🌱</span>
            <span className="impact-number">{impactStats.co2Reduced}kg</span>
            <span className="impact-label">CO₂ Tasarrufu</span>
          </div>
          <div className="impact-item">
            <span className="impact-icon">👥</span>
            <span className="impact-number">{impactStats.userCount}</span>
            <span className="impact-label">Kullanıcı</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .food-waste-slider-container {
          margin: 20px 0;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }

        .slider-wrapper {
          position: relative;
          height: 400px;
          background: #000;
        }

        .slider-main {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .slide-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .slide-content {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }

        .slide-text {
          text-align: center;
          color: white;
          max-width: 600px;
          padding: 0 20px;
          animation: slideIn 0.8s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .slide-main-title {
          font-size: 2.5rem;
          font-weight: 800;
          margin: 0 0 15px 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
          background: linear-gradient(45deg, #2E7D32, #388E3C);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .slide-subtitle {
          font-size: 1.3rem;
          margin: 0 0 25px 0;
          opacity: 0.95;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }

        .slide-stats {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border-radius: 15px;
          padding: 20px;
          margin: 25px 0;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .stat-number {
          font-size: 3rem;
          font-weight: 900;
          color: #FFD700;
          margin-bottom: 8px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .stat-description {
          font-size: 1rem;
          opacity: 0.9;
        }

        .slide-cta {
          margin-top: 25px;
        }

        .cta-button {
          background: linear-gradient(45deg, #4CAF50, #45a049);
          color: white;
          border: none;
          padding: 15px 30px;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 8px 15px rgba(46, 125, 50, 0.3);
        }

        .cta-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 20px rgba(76, 175, 80, 0.4);
        }

        .nav-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: none;
          color: white;
          font-size: 1.5rem;
          padding: 15px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 3;
          opacity: 0;
        }

        .slider-wrapper:hover .nav-arrow {
          opacity: 1;
        }

        .nav-prev {
          left: 20px;
        }

        .nav-next {
          right: 20px;
        }

        .nav-arrow:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-50%) scale(1.1);
        }

        .play-pause-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.5);
          border: none;
          color: white;
          padding: 10px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 3;
          opacity: 0;
        }

        .slider-wrapper:hover .play-pause-btn {
          opacity: 1;
        }

        .play-pause-btn:hover {
          background: rgba(0, 0, 0, 0.7);
        }

        .slide-indicators {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
          z-index: 3;
        }

        .indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.5);
          background: transparent;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .indicator.active {
          background: #FFD700;
          border-color: #FFD700;
          transform: scale(1.2);
        }

        .indicator:hover {
          border-color: white;
        }

        .mini-impact-display {
          position: absolute;
          top: 20px;
          left: 20px;
          display: flex;
          gap: 15px;
          z-index: 3;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .slider-wrapper:hover .mini-impact-display {
          opacity: 1;
        }

        .impact-item {
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(10px);
          padding: 8px 12px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 5px;
          color: white;
          font-size: 0.8rem;
        }

        .impact-icon {
          font-size: 1rem;
        }

        .impact-number {
          font-weight: 700;
          color: #FFD700;
        }

        .impact-label {
          opacity: 0.8;
          font-size: 0.7rem;
        }

        @media (max-width: 768px) {
          .slider-wrapper {
            height: 350px;
          }

          .slide-main-title {
            font-size: 2rem;
          }

          .slide-subtitle {
            font-size: 1.1rem;
          }

          .stat-number {
            font-size: 2.2rem;
          }

          .mini-impact-display {
            position: static;
            opacity: 1;
            justify-content: center;
            margin-top: 15px;
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            border-radius: 15px;
          }

          .nav-arrow {
            opacity: 1;
            padding: 12px;
          }

          .play-pause-btn {
            opacity: 1;
          }
        }

        @media (max-width: 480px) {
          .slider-wrapper {
            height: 300px;
          }

          .slide-main-title {
            font-size: 1.5rem;
          }

          .slide-text {
            padding: 0 15px;
          }

          .mini-impact-display {
            flex-direction: column;
            gap: 8px;
          }

          .impact-item {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default FoodWasteSlider;