import React, { useState, useEffect, useRef } from 'react';
import './Home.css';
import resim1 from './resim1.jpg';
import resim2 from './resim2.jpg';
import resim3 from './resim3.jpg';
import resim4 from './resim4.jpg';
import DonationCard from './DonationCard';
import { 
  FaUser, 
  FaBell, 
  FaHeart, 
  FaRegHeart,
  FaShoppingBag, 
  FaMapMarkerAlt, 
  FaClock, 
  FaLeaf,
  FaSearch,
  FaTimes,
  FaMap,
  FaStore,
  FaSmile,
  FaPizzaSlice,
  FaBolt,
  FaWindowClose

} from 'react-icons/fa';
import FilterSidebar from './FilterSidebar';






const Home = () => {
 const [sortOption, setSortOption] = useState('alphabetical'); // varsayılan değer verilebilir

  const [product, setProduct] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [showMapView, setShowMapView] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [impactStats, setImpactStats] = useState({
    savedFood: 2035,
    co2Reduced: 4532,
    userCount: 12567,
  });
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showLocationPermission, setShowLocationPermission] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  

  const categories = ['Tümü', 'Restoran', 'Fırın & Pastane', 'Market', 'Kafe', 'Manav', 'Diğer'];

  const allBusinesses = [
    {
      storeName: 'Fırın Cafe',
      product: 'Karma Paket',
      oldPrice: 120,
      newPrice: 40,
      distance: '300m',
      time: '18:00-19:00',
      category: 'Fırın & Pastane',
      id: 1,
      image: resim1 ,
      savedCount: 24,
      location: { lat: 41.0082, lng: 28.9784 } // Istanbul coordinates - adjust for your businesses
    },
    {
      storeName: 'Ada Market',
      product: 'Meyve Paketi',
      oldPrice: 80,
      newPrice: 25,
      distance: '500m',
      time: '20:00-21:00',
      category: 'Market',
      id: 2,
      image: resim2,
      savedCount: 18,
      location: { lat: 41.0102, lng: 28.9762 }
    },
    {
      storeName: 'Lezzet Köşesi',
      product: 'Akşam Menüsü',
      oldPrice: 250,
      newPrice: 85,
      distance: '750m',
      time: '21:00-22:00',
      category: 'Restoran',
      id: 3,
      image: resim3,
      savedCount: 32,
      location: { lat: 41.0056, lng: 28.9726 }
    },
    {
      storeName: 'Tatlı Dünyası',
      product: 'Tatlı Paketi',
      oldPrice: 90,
      newPrice: 30,
      distance: '450m',
      time: '19:00-20:00',
      category: 'Fırın & Pastane',
      id: 4,
      image: resim4,
      savedCount: 15,
      location: { lat: 41.0122, lng: 28.9802 }
    },
    {
      storeName: 'Organik Bahçe',
      product: 'Sebze Paketi',
      oldPrice: 70,
      newPrice: 25,
      distance: '600m',
      time: '19:30-20:30',
      category: 'Manav',
      id: 5,
      image: 'https://via.placeholder.com/150',
      savedCount: 28,
      location: { lat: 41.0072, lng: 28.9892 }
    },
  ];

  // Load Google Maps API script
  const loadGoogleMapsScript = () => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCDLCFkp4u74d7NrR7XUS-HhDLNF3xq9Is&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('Google Maps API loaded');
        if (userLocation) {
          initMap();
        }
      };
      
      document.head.appendChild(script);
    } else if (userLocation && showMapView) {
      initMap();
    }
  };

  // Initialize map
  const initMap = () => {
    if (!window.google || !mapRef.current) return;

    const mapOptions = {
      center: userLocation || { lat: 41.0082, lng: 28.9784 }, // Default to Istanbul if no user location
      zoom: 14,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    };

    const map = new window.google.maps.Map(mapRef.current, mapOptions);
    googleMapRef.current = map;

    // Add user location marker
    if (userLocation) {
      new window.google.maps.Marker({
        position: userLocation,
        map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#4285F4",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2
        },
        title: "Konumunuz"
      });
    }

    // Add business markers
    allBusinesses.forEach((business) => {
      const marker = new window.google.maps.Marker({
        position: business.location,
        map,
        title: business.storeName,
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
        }
      });

      // Create info window content
      const contentString = `
        <div style="width: 200px; padding: 10px;">
          <h3 style="margin: 0 0 5px 0;">${business.storeName}</h3>
          <p style="margin: 0 0 5px 0;">${business.product}</p>
          <p style="margin: 0 0 5px 0;"><b>₺${business.newPrice.toFixed(2)}</b> <span style="text-decoration: line-through;">₺${business.oldPrice.toFixed(2)}</span></p>
          <p style="margin: 0 0 5px 0;">Alım Saati: ${business.time}</p>
        </div>
      `;

      const infowindow = new window.google.maps.InfoWindow({
        content: contentString
      });

      marker.addListener("click", () => {
        infowindow.open(map, marker);
      });
    });
  };

  // Get user location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(userPos);
          if (showMapView && window.google) {
            initMap();
          }
        },
        (error) => {
          console.error("Error getting location: ", error);
          // Default to a location (Istanbul)
          setUserLocation({ lat: 41.0082, lng: 28.9784 });
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
      setUserLocation({ lat: 41.0082, lng: 28.9784 });
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  };
  
  const closeProductDetail = () => {
    setShowProductDetail(false);
  };

  const filteredBusinesses = selectedCategory === 'Tümü'
    ? allBusinesses.filter(b =>
        b.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.product.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allBusinesses.filter(b =>
        b.category === selectedCategory &&
        (b.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
         b.product.toLowerCase().includes(searchQuery.toLowerCase()))
      );
   const sortedBusinesses = [...filteredBusinesses].sort((a, b) => {
    switch (sortOption) {
      case 'alphabetical':
        return a.storeName.localeCompare(b.storeName);
      case 'distance':
        // Extract numeric value from distance string (e.g. "300m" -> 300)
        const distA = parseInt(a.distance);
        const distB = parseInt(b.distance);
        return distA - distB;
      case 'rating':
        // Sort by rating, if ratings are equal sort by review count
        if (b.rating === a.rating) {
          return b.reviewCount - a.reviewCount;
        }
        return b.rating - a.rating;
      default:
        return 0;
    }
  });
  const handleBuy = (business) => {
    setCart([...cart, business]);
    
    setImpactStats(prev => ({
      ...prev,
      savedFood: prev.savedFood + 1,
      co2Reduced: prev.co2Reduced + 2,
    }));
    
    alert(`${business.storeName} işletmesinden "${business.product}" ürünü sepete eklendi!`);
    if (showProductDetail) {
      setShowProductDetail(false);
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const toggleFavorite = (businessId) => {
    if (favorites.includes(businessId)) {
      setFavorites(favorites.filter(id => id !== businessId));
    } else {
      setFavorites([...favorites, businessId]);
    }
  };

  const isFavorite = (businessId) => {
    return favorites.includes(businessId);
  };

  const closeOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('onboardingShown', 'true');
  };

  const allowLocationPermission = () => {
    setShowLocationPermission(false);
    localStorage.setItem('locationPermissionShown', 'true');
    getUserLocation();
  };

  const declineLocationPermission = () => {
    setShowLocationPermission(false);
    // Default to a location (Istanbul)
    setUserLocation({ lat: 41.0082, lng: 28.9784 });
  };

  const handleMapButtonClick = () => {
    setShowMapView(!showMapView);
    if (!showMapView && !userLocation) {
      getUserLocation();
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('onboardingShown')) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }

    if (!localStorage.getItem('locationPermissionShown')) {
      setShowLocationPermission(true);
    } else {
      getUserLocation();
    }

    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Load Google Maps when the map view is activated
  useEffect(() => {
    if (showMapView) {
      loadGoogleMapsScript();
    }
  }, [showMapView, userLocation]);

  return (
    <>
      {showOnboarding && (
        <div className="onboarding-overlay">
          <div className="onboarding-container">
            <div className="onboarding-header">
              <h2>SofraPay'a Hoş Geldiniz!</h2>
              <button className="close-button" onClick={closeOnboarding}>
                <FaTimes />
              </button>
            </div>

            <div className="onboarding-content">
              <div className="onboarding-step">
                <div className="step-icon">
                  <FaSearch />
                </div>
                <div className="step-text">
                  <h3>İsrafı Önle</h3>
                  <p>Yakınınızdaki işletmelerden uygun fiyata yemek paketleri bulun.</p>
                </div>
              </div>

              <div className="onboarding-step">
                <div className="step-icon">
                  <FaShoppingBag />
                </div>
                <div className="step-text">
                  <h3>Satın Al</h3>
                  <p>Beğendiğiniz paketi satın alın ve belirtilen saatte teslim alın.</p>
                </div>
              </div>

              <div className="onboarding-step">
                <div className="step-icon">
                  <FaHeart />
                </div>
                <div className="step-text">
                  <h3>Çevreye Katkı Sağla</h3>
                  <p>Her paket ile gıda israfını azaltın ve karbon ayak izinizi düşürün.</p>
                </div>
              </div>
            </div>

            <div className="onboarding-footer">
              <button className="start-button" onClick={closeOnboarding}>
                Hemen Başla
              </button>
            </div>
          </div>
        </div>
      )}
      


      <div className="app-container">
        <div className="content-grid">
          {/* Sol Filtre Bölümü */}
          <div className="filter-column">
            <FilterSidebar 
              onFilterChange={(category) => {
                setSelectedCategory(category);
                // Yeni prop yapısı için uyumluluk
                handleCategoryClick(category);
              }}
              onSortChange={(option) => setSortOption(option)}
            />
          </div>
          
          {/* Orta İçerik Bölümü */}
          <div className="main-content-column">


            {!showMapView ? (
              <div className="product-cards-section">
                <h2 className="section-title-large">Günün İlanları</h2>
                <div className="product-cards-container">
                  {sortedBusinesses.map((business) => (
                    <div key={business.id} className="product-card" onClick={() => handleProductClick(business)}>
                      <div className="product-image-container">
                        <img src={business.image} alt={business.product} className="product-image" />
                        <div 
                          className="favorite-button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(business.id);
                          }}
                        >
                          {isFavorite(business.id) ? <FaHeart color="#FF5A5F" /> : <FaRegHeart />}
                        </div>
                        <div className="food-saved-tag">
                          <FaLeaf /> {business.savedCount} paket kurtarıldı
                        </div>
                      </div>
                      <div className="product-info">
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
              </div>
            ) : (
              <div className="map-view-container">
                <div className="map-header">
                  <h2>Yakındaki İşletmeler</h2>
                  <button className="close-map-button" onClick={() => setShowMapView(false)}>
                    <FaTimes />
                  </button>
                </div>
                <div id="google-map" ref={mapRef} className="google-map"></div>
              </div>
            )}
          </div>
          
          {/* Sağ Bağış Bölümü */}

        </div>
      </div>
      <button className="floating-map-button" onClick={handleMapButtonClick}>
        <FaMap />
        <span>{showMapView ? "Listeyi Göster" : "Haritayı Göster"}</span>
      </button>

      {showLocationPermission && (
        <div className="location-permission-prompt">
          <div className="permission-content">
            <FaMapMarkerAlt />
            <div className="permission-text">
              <h3>Konumunuzu paylaşın</h3>
              <p>Yakınınızdaki teklifleri görmek için konumunuza erişmemize izin verin.</p>
            </div>
            <div className="permission-actions">
              <button className="allow-button" onClick={allowLocationPermission}>
                İzin Ver
              </button>
              <button className="later-button" onClick={declineLocationPermission}>
                Daha Sonra
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Product Detail Popup */}
      {showProductDetail && selectedProduct && (
        <div className="product-detail-overlay" onClick={closeProductDetail}>
          <div className="product-detail-popup" onClick={(e) => e.stopPropagation()}>
            <button className="close-popup-button" onClick={closeProductDetail}>
              <FaTimes />
            </button>
            
            <div className="product-detail-content">
              <div className="product-detail-image-container">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.product} 
                  className="product-detail-image" 
                />
                <div 
                  className="detail-favorite-button" 
                  onClick={() => toggleFavorite(selectedProduct.id)}
                >
                  {isFavorite(selectedProduct.id) ? <FaHeart color="#FF5A5F" /> : <FaRegHeart />}
                </div>
              </div>
              
              <div className="product-detail-info">
                <div className="detail-store-name">
                  <FaStore /> {selectedProduct.storeName}
                </div>
                <h2 className="detail-product-name">{selectedProduct.product}</h2>
                
                <div className="detail-category">
                  Kategori: {selectedProduct.category}
                </div>
                
                <div className="detail-collection-info">
                  <div className="detail-pickup-time">
                    <FaClock /> Teslim Zamanı: {selectedProduct.time}
                  </div>
                  <div className="detail-distance">
                    <FaMapMarkerAlt /> Uzaklık: {selectedProduct.distance}
                  </div>
                </div>
                
                <div className="detail-price-container">
                  <div className="detail-price-info">
                    <div className="detail-old-price">₺{selectedProduct.oldPrice.toFixed(2)}</div>
                    <div className="detail-new-price">₺{selectedProduct.newPrice.toFixed(2)}</div>
                    <div className="detail-discount-percentage">
                      {Math.round((1 - selectedProduct.newPrice / selectedProduct.oldPrice) * 100)}% indirim
                    </div>
                  </div>
                </div>
                
                <div className="detail-saved-info">
                  <FaLeaf /> {selectedProduct.savedCount} paket kurtarıldı
                </div>
                
                <div className="detail-description">
                  <h3>Paket İçeriği</h3>
                  <p>Bu paket restoran/market tarafından günün sonunda artan yemeklerden oluşturulmuştur. İçeriği günlük olarak değişmektedir. Gıda israfını önlemek için bu paketi ayırabilirsiniz.</p>
                </div>
                
                <div className="detail-ratings">
                  <div className="detail-rating">
                    <span className="rating-star">★★★★★</span> 4.8/5.0
                  </div>
                  <div className="detail-review-count">
                    (47 değerlendirme)
                  </div>
                </div>
                
                <div className="detail-highlights">
                  <h3>Öne Çıkanlar</h3>
                  <ul>
                    <li><FaSmile /> Güler yüzlü çalışanlar</li>
                    <li><FaPizzaSlice /> Lezzetli yemekler</li>
                    <li><FaBolt /> Hızlı teslim</li>
                  </ul>
                </div>
                
                <button 
                  className="detail-reserve-button" 
                  onClick={() => handleBuy(selectedProduct)}
                >
                  Paket Ayır
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;