import React, { useState, useEffect } from 'react';
import './Header.css';
import { useNavigate } from 'react-router-dom';
import { 
  FaSearch, 
  FaBell, 
  FaUser, 
  FaBars, 
  FaTimes, 
  FaLeaf, 
  FaShoppingBag,
  FaFilter,
  FaShoppingCart,
  FaTrash
} from 'react-icons/fa';

import MyOrders from './MyOrders';
import AddressButton from './AddressButton';
import authService from '../services/AuthService'; // Yeni auth servisi ekleyelim
import { getUserProfile, getSellerProfile } from '../services/userService';
import { useCart } from '../contexts/cartContext';
function Header({ onLogout }) { // onLogout prop'unu alalım
  const [showProfileWarning, setShowProfileWarning] = useState(false);
  const [showCreateSellerProfile, setShowCreateSellerProfile] = useState(false);
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('location');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [activeUserType, setActiveUserType] = useState('business'); // 'business' veya 'individual'
  const [notificationCount, setNotificationCount] = useState(3); // Bildirim sayısı
  const { cartItems, cartCount, removeFromCart, clearCart } = useCart();
  const [userProfile, setUserProfile] = useState({
    name: 'Ahmet Yılmaz',
    profileImage: null // Kullanıcı resmi yoksa null, varsa URL'i burada olacak
  });
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false); // Bildirim popup'ı
  const [cartMenuOpen, setCartMenuOpen] = useState(false); // Sepet popup'ı
  const [isDonorMode, setIsDonorMode] = useState(() => {
    const savedMode = localStorage.getItem('donorMode');
    return savedMode === 'true';
});
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Varsayılan olarak true

  // Örnek şehir ve ilçe verileri
  const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya'];
  const districts = {
    'İstanbul': ['Kadıköy', 'Beyoğlu', 'Beşiktaş', 'Üsküdar', 'Şişli'],
    'Ankara': ['Çankaya', 'Keçiören', 'Mamak', 'Etimesgut', 'Yenimahalle'],
    'İzmir': ['Konak', 'Karşıyaka', 'Bornova', 'Buca', 'Çiğli'],
    'Bursa': ['Osmangazi', 'Nilüfer', 'Yıldırım', 'Mudanya', 'Gemlik'],
    'Antalya': ['Muratpaşa', 'Konyaaltı', 'Kepez', 'Alanya', 'Manavgat']
  };

  // Scroll olayını dinleyen useEffect
// Header.jsx içindeki düzeltilmiş checkAuth fonksiyonu

useEffect(() => {
  const checkAuth = async () => {
    const isAuth = authService.isAuthenticated();
    setIsAuthenticated(isAuth);
    
    // Kullanıcı bilgilerini getir
    if (isAuth) {
      try {
        let profileData;
        
        if (isDonorMode) {
          // Satıcı modunda seller profili getir
          const sellerResult = await getSellerProfile();
          
          if (sellerResult && sellerResult.success) {
            // Profil tamamlanmış mı kontrolü
            if (sellerResult.data && !sellerResult.data.isProfileComplete) {
              setShowProfileWarning(true);
            }
            
            profileData = {
              name: sellerResult.data?.business_name || 'İşletme Adı Belirtilmemiş',
              profileImage: sellerResult.data?.profileImage || null,
              type: 'seller',
              ...sellerResult.data
            };
          } else if (sellerResult && sellerResult.needsProfile) {
            // Seller profili oluşturulması gerekiyor
            setShowCreateSellerProfile(true);
            
            // Fallback olarak normal user bilgilerini kullan
            const user = authService.getUser();
            if (user) {
              profileData = {
                name: user.name || 'Kullanıcı',
                profileImage: user.profileImage || null,
                type: 'user'
              };
            }
          } else {
            // Seller profili alınamadıysa fallback
            console.warn('Seller profili alınamadı, fallback kullanılıyor');
            const user = authService.getUser();
            if (user) {
              profileData = {
                name: user.name || 'Kullanıcı',
                profileImage: user.profileImage || null,
                type: 'user'
              };
            }
          }
        } else {
          // Alışveriş modunda user profili getir
          const userResult = await getUserProfile();
          
          if (userResult && userResult.success) {
            profileData = {
              name: userResult.data?.name || 'Kullanıcı',
              profileImage: userResult.data?.profileImage || null,
              type: 'user',
              ...userResult.data
            };
          } else {
            // User profili alınamadıysa fallback
            console.warn('User profili alınamadı, fallback kullanılıyor');
            const user = authService.getUser();
            if (user) {
              profileData = {
                name: user.name || 'Kullanıcı',
                profileImage: user.profileImage || null,
                type: 'user'
              };
            }
          }
        }
        
        // Profil verisi varsa state'i güncelle
        if (profileData) {
          setUserProfile(profileData);
        } else {
          // Hiçbir profil verisi yoksa varsayılan değerleri kullan
          console.warn('Profil verisi bulunamadı, varsayılan değerler kullanılıyor');
          setUserProfile({
            name: 'Kullanıcı',
            profileImage: null,
            type: 'user'
          });
        }
        
      } catch (error) {
        console.error('Profil bilgisi alınamadı:', error);
        
        // Hata durumunda fallback olarak localStorage'dan al
        try {
          const user = authService.getUser();
          if (user && typeof user === 'object') {
            setUserProfile({
              name: user.name || user.firstName || user.username || 'Kullanıcı',
              profileImage: user.profileImage || user.avatar || null,
              type: 'user'
            });
          } else {
            // Son çare olarak varsayılan değerler
            setUserProfile({
              name: 'Kullanıcı',
              profileImage: null,
              type: 'user'
            });
          }
        } catch (fallbackError) {
          console.error('Fallback profil bilgisi de alınamadı:', fallbackError);
          setUserProfile({
            name: 'Kullanıcı',
            profileImage: null,
            type: 'user'
          });
        }
      }
    } else {
      // Kullanıcı giriş yapmamışsa varsayılan değerler
      setUserProfile({
        name: 'Misafir',
        profileImage: null,
        type: 'guest'
      });
    }
  };
  
  checkAuth();
  
  // Token değişimini dinlemek için event listener
  const handleStorageChange = (e) => {
    if (e.key === 'authToken' || e.key === 'token' || e.key === 'user') {
      checkAuth();
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}, [isDonorMode]); // isDonorMode dependency olarak eklendi

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Profile menüsünü dışarı tıklandığında kapatma
useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      isProfileMenuOpen &&
      !event.target.closest('.profile-button-wrapper')
    ) {
      setIsProfileMenuOpen(false);
    }

    if (
      notificationMenuOpen &&
      !event.target.closest('.notification-button-wrapper')
    ) {
      setNotificationMenuOpen(false);
    }

    if (
      cartMenuOpen &&
      !event.target.closest('.cart-button-wrapper') &&
      !event.target.closest('.cart-modal')
    ) {
      setCartMenuOpen(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [isProfileMenuOpen, notificationMenuOpen, cartMenuOpen]);






  const handleSearchBarClick = () => {
    setShowSearchPanel(true);
  };
  
  const toggleDonorMode = () => {
    const newMode = !isDonorMode;
    setIsDonorMode(newMode);
    localStorage.setItem('donorMode', String(newMode));
    
    // Mod değiştiğinde yönlendirme
    if (newMode) {
      // Kullanıcı giriş yapmışsa doğrudan yönlendir, değilse login'e gönder
      if (isAuthenticated) {
        navigate('/sofrani-paylas');
      } else {
        navigate('/login', { 
          state: { 
            message: 'Sofranı Paylaş moduna geçmek için lütfen giriş yapın',
            redirect: '/sofrani-paylas'
          }
        });
      }
    } else {
      navigate('/');
    }
  };

  const handleCloseSearchPanel = (e) => {
    if (e.target.className === 'search-panel-overlay') {
      setShowSearchPanel(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setSelectedDistrict('');
  };

  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleSearch = () => {
    console.log('Arama yapılıyor:', {
      userType: activeUserType,
      city: selectedCity,
      district: selectedDistrict,
      date: selectedDate
    });
    setShowSearchPanel(false);
  };

  const handleNotificationsClick = () => {
    setNotificationMenuOpen(!notificationMenuOpen);
    if (cartMenuOpen) setCartMenuOpen(false);
  };

  const handleCartClick = () => {
    setCartMenuOpen(!cartMenuOpen);
    if (notificationMenuOpen) setNotificationMenuOpen(false);
  };





  // Favori işlemlerinin yönetilmesi
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    // LocalStorage'dan favorileri yükle
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Favorileri localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addToFavorites = (item) => {
    setFavorites([...favorites, item]);
  };

  const removeFromFavorites = (id) => {
    setFavorites(favorites.filter(item => item.id !== id));
  };

  // Kendi tanımladığımız onLogout fonksiyonunu kaldırıp, prop olarak gelen fonksiyonu kullanıyoruz
  const handleLogout = () => {
    // AuthService ile logout işlemi
    authService.logout();
    
    // Prop olarak gelen logout fonksiyonunu çağır
    if (onLogout) {
      onLogout();
    }
    
    // Ana sayfaya yönlendir
    navigate('/');
  };

  return (
    <>
      {/* Header Ana Bileşeni - Scroll durumuna göre sınıf adı değişir */}
      <div className={`header fixed-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="logo-container" onClick={() => navigate('/')}>
          <div className="logo">
            <FaLeaf /> {/* Logo ikonu olarak leaf kullanıldı, değiştirebilirsiniz */}
          </div>
          <div className="logo-text">SofraPay</div>
        </div>
        
        {/* Arama çubuğu - Header içinde */}
        
        {!isDonorMode && (
          <div className="header-search-container">
            <div 
              className={`header-search-bar ${isScrolled ? 'compact' : ''}`}
              onClick={handleSearchBarClick}
            >
              <div className="search-icon">
                <FaSearch />
              </div>
              <div className="search-text">
                <div className="search-primary">Şehir veya ilçe ara</div>
                <div className="search-secondary">Bağışları ara</div>
              </div>
            </div>
            <AddressButton />
          </div>
        )}
                
        {/* Sağ Taraftaki Butonlar */}
        <div className="header-actions">
          {!isDonorMode && (
            <button className="host-mode-button" onClick={toggleDonorMode}>
              <span>Sofranı Paylaş Modu</span>
            </button>
          )}
          {isDonorMode && (
            <button className="host-mode-button" onClick={toggleDonorMode}>
              <span>Alışveriş Moduna Dön</span>
            </button>
          )}
          
          {/* Bildirim butonu */}
          <div className="notification-button-wrapper">
            <div className="notification-button" onClick={handleNotificationsClick}>
              <FaBell />
              {notificationCount > 0 && (
                <span className="notification-badge">{notificationCount}</span>
              )}
            </div>

            {notificationMenuOpen && (
              <div className="notification-menu">
                <div className="notification-header">
                  <h3>Bildirimler</h3>
                </div>
                <ul className="notification-list">
                  <li className="notification-item">
                    <div className="notification-icon"><FaLeaf /></div>
                    <div className="notification-content">
                      <div className="notification-title">Paketiniz Hazır!</div>
                      <div className="notification-message">Ada Market'ten ayırdığınız paket hazır.</div>
                      <div className="notification-time">10 dakika önce</div>
                    </div>
                  </li>
                  <li className="notification-item">
                    <div className="notification-icon"><FaLeaf /></div>
                    <div className="notification-content">
                      <div className="notification-title">Teşekkürler!</div>
                      <div className="notification-message">Bugün 2 paket daha kurtardınız.</div>
                      <div className="notification-time">1 saat önce</div>
                    </div>
                  </li>
                  <li className="notification-item">
                    <div className="notification-icon"><FaLeaf /></div>
                    <div className="notification-content">
                      <div className="notification-title">Yeni Kampanya!</div>
                      <div className="notification-message">Yakınınızdaki fırınlarda %50 indirim.</div>
                      <div className="notification-time">3 saat önce</div>
                    </div>
                  </li>
                </ul>
                <div className="notification-footer">
                  <button className="view-all-button">Tümünü Gör</button>
                </div>
              </div>
            )}
          </div>
          
          {/* Sepet butonu - YENİ */}
          {!isDonorMode && (
            <div className="cart-button-wrapper">
              <div className="cart-button" onClick={handleCartClick}>
                <FaShoppingBag />
                {cartCount > 0 && (
                  <span className="cart-badge">{cartCount}</span>
                )}
              </div>

            </div>
          )}
          
          <div className="profile-button-wrapper">
            <div className="profile-button" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
              <FaBars className="menu-icon" />
              {userProfile.profileImage ? (
                <img src={userProfile.profileImage} alt="Profil" className="profile-image" />
              ) : (
                <FaUser className="user-icon" />
              )}
            </div>

            {isProfileMenuOpen && (
              <div className="profile-menu">
                <ul>
                  {!isDonorMode ? (
                    <>
                      <li onClick={() => navigate('/profil')}>Profil</li>
                      <li onClick={() => navigate('/favoriler')}>Favoriler</li>
                      <li onClick={() => navigate('/aldiklarim')}>Siparişlerim</li>
                      <li onClick={() => navigate('/kayitlikartlar')}>Kayıtlı Kartlarım</li>
                    </>
                  ) : (
                    <>
                      <li onClick={() => navigate('/profil')}>Profil</li>
                      <li onClick={() => navigate('/paketlerim')}>Paketlerim</li>
                      <li onClick={() => navigate('/kazanclarim')}>Kazançlarım</li>
                      <li onClick={() => navigate('/degerlerim')}>Değerlendirmelerim</li>
                    </>
                  )}
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                  >
                    Çıkış Yap
                  </button>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Arama Panel Overlay */}
      {showSearchPanel && (
        <div className="search-panel-overlay" onClick={handleCloseSearchPanel}>
          <div className="search-panel" onClick={(e) => e.stopPropagation()}>
            <div className="search-panel-header">
              <div className="search-tabs">
                <div 
                  className={`search-tab ${activeTab === 'location' ? 'active' : ''}`}
                  onClick={() => handleTabChange('location')}
                >
                  Konum
                </div>
                <div 
                  className={`search-tab ${activeTab === 'date' ? 'active' : ''}`}
                  onClick={() => handleTabChange('date')}
                >
                  Tarih
                </div>
              </div>

              {/* Kullanıcı tipi seçimi */}
              <div className="user-type-selector">
                <button 
                  className={`user-type-button ${activeUserType === 'business' ? 'active' : ''}`}
                  onClick={() => setActiveUserType('business')}
                >
                  İşletmeler
                </button>
                <button 
                  className={`user-type-button ${activeUserType === 'individual' ? 'active' : ''}`}
                  onClick={() => setActiveUserType('individual')}
                >
                  Bireysel
                </button>
              </div>
              
              <button className="close-panel-button" onClick={() => setShowSearchPanel(false)}>
                <FaTimes />
              </button>
            </div>
            
            <div className="search-panel-content">
              {activeTab === 'location' && (
                <div className="location-selection">
                  <div className="search-input-container">
                    <FaSearch />
                    <input 
                      type="text" 
                      placeholder="Şehir veya ilçe ara"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="location-options">
                    <div className="city-selection">
                      <h3>Şehir</h3>
                      <div className="city-list">
                        {cities
                          .filter(city => city.toLowerCase().includes(searchTerm.toLowerCase()) || searchTerm === '')
                          .map((city, index) => (
                            <div 
                              key={index} 
                              className={`city-item ${selectedCity === city ? 'selected' : ''}`}
                              onClick={() => handleCitySelect(city)}
                            >
                              {city}
                            </div>
                          ))
                        }
                      </div>
                    </div>
                    
                    {selectedCity && (
                      <div className="district-selection">
                        <h3>İlçe</h3>
                        <div className="district-list">
                          {districts[selectedCity].map((district, index) => (
                            <div 
                              key={index} 
                              className={`district-item ${selectedDistrict === district ? 'selected' : ''}`}
                              onClick={() => handleDistrictSelect(district)}
                            >
                              {district}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'date' && (
                <div className="date-selection">
                  <h3>Tarih Seçin</h3>
                  <input 
                    type="date" 
                    className="date-input"
                    value={selectedDate}
                    onChange={handleDateChange}
                  />
                </div>
              )}
            </div>
            
            <div className="search-panel-footer">
              <button 
                className="search-button"
                onClick={handleSearch}
                disabled={!selectedCity || !selectedDistrict}
              >
                <FaSearch />
                Ara
              </button>
            </div>
          </div>
        </div>
      )}
      {cartMenuOpen && (
      <div className="cart-modal-overlay" onClick={() => setCartMenuOpen(false)}>
        <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
          <div className="cart-header">
            <h3>🛒 Sepetim</h3>
            <button className="close-cart-button" onClick={() => setCartMenuOpen(false)}>
              <FaTimes />
            </button>
          </div>
          
          <div className="cart-content">
            {cartItems.length === 0 ? (
              <div className="empty-cart">
                <FaShoppingCart className="empty-cart-icon" />
                <h4>Sepetiniz boş</h4>
                <p>Henüz hiç ürün eklememişsiniz.</p>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cartItems.map((item, index) => (
                    <div key={index} className="cart-item">
                      <div className="cart-item-image">
                        <img 
                          src={item.image || "https://via.placeholder.com/80"} 
                          alt={item.product} 
                        />
                      </div>
                      
                      <div className="cart-item-info">
                        <h4>{item.product}</h4>
                        <p>{item.storeName}</p>
                        <div className="cart-item-price">
                          ₺{item.newPrice.toFixed(2)}
                        </div>
                      </div>
                      
                        <button 
                          className="remove-item-btn" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeFromCart(item.cartId);
                          }}
                        >
                          <FaTrash />
                        </button>
                    </div>
                  ))}
                </div>
                
                <div className="cart-summary">
                  <div className="cart-total">
                    <div className="total-items">
                      Toplam {cartItems.length} ürün
                    </div>
                    <div className="total-price">
                      ₺{cartItems.reduce((total, item) => total + item.newPrice, 0).toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="cart-actions">
                    <button 
                      className="clear-cart-btn" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        clearCart();
                      }}
                    >
                      🗑️ Sepeti Temizle
                    </button>
                    <button 
                      className="checkout-btn"
                      onClick={() => {
                        navigate('/odeme');
                      }}
                    >
                      💳 Ödemeye Geç
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )}

    </>
  );
}

export default Header;