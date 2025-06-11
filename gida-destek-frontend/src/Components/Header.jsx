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
import NotificationCenter from './NotificationCenter';
import useNotification from '../hooks/useNotification';
import MyOrders from './MyOrders';
import AddressButton from './AddressButton';
import authService from '../services/AuthService';
import { getUserProfile, getSellerProfile } from '../services/userService';
import { useCart } from '../contexts/cartContext';

function Header({ onLogout, onSearch }) { // onSearch prop'unu ekledik
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount } = useNotification(null);
  const [showProfileWarning, setShowProfileWarning] = useState(false);
  const [showCreateSellerProfile, setShowCreateSellerProfile] = useState(false);
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // Arama terimi için
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [activeUserType, setActiveUserType] = useState('business');
  const [notificationCount, setNotificationCount] = useState(3);
  const { cartItems, cartCount, removeFromCart, clearCart } = useCart();
   console.log("CART ITEMS:", cartItems);
  const [userProfile, setUserProfile] = useState({
    name: 'Ahmet Yılmaz',
    profileImage: null
  });
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [cartMenuOpen, setCartMenuOpen] = useState(false);
  const [isDonorMode, setIsDonorMode] = useState(() => {
    const savedMode = localStorage.getItem('donorMode');
    return savedMode === 'true';
  });
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [userId, setUserId] = useState(() => {
    const user = authService.getUser();
    return user?.id || user?.userId || null;
  });

  // Yiyecek isimlerini arama için örnek liste
  const foodItems = [
    'Pizza', 'Hamburger', 'Döner', 'Lahmacun', 'Kebab', 'Köfte', 'Pide',
    'Börek', 'Su böreği', 'Menemen', 'Omlet', 'Tost', 'Sandviç',
    'Salata', 'Çorba', 'Pilav', 'Makarna', 'Spaghetti', 'Baklava',
    'Künefe', 'Sütlaç', 'Muhallebi', 'Tiramisu', 'Cheesecake',
    'Meyve salatası', 'Dondurma', 'Pasta', 'Kurabiye', 'Kek'
  ];
 
  // Mevcut useEffect'ler burada kalıyor...
  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = authService.isAuthenticated();
      setIsAuthenticated(isAuth);
      
      if (isAuth) {
        try {
          let profileData;
          
          if (isDonorMode) {
            const sellerResult = await getSellerProfile();
            
            if (sellerResult && sellerResult.success) {
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
              setShowCreateSellerProfile(true);
              
              const user = authService.getUser();
              if (user) {
                profileData = {
                  name: user.name || 'Kullanıcı',
                  profileImage: user.profileImage || null,
                  type: 'user'
                };
              }
            } else {
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
            const userResult = await getUserProfile();
            
            if (userResult && userResult.success) {
              profileData = {
                name: userResult.data?.name || 'Kullanıcı',
                profileImage: userResult.data?.profileImage || null,
                type: 'user',
                ...userResult.data
              };
            } else {
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
          
          if (profileData) {
            setUserProfile(profileData);
          } else {
            console.warn('Profil verisi bulunamadı, varsayılan değerler kullanılıyor');
            setUserProfile({
              name: 'Kullanıcı',
              profileImage: null,
              type: 'user'
            });
          }
          
        } catch (error) {
          console.error('Profil bilgisi alınamadı:', error);
          
          try {
            const user = authService.getUser();
            if (user && typeof user === 'object') {
              setUserProfile({
                name: user.name || user.firstName || user.username || 'Kullanıcı',
                profileImage: user.profileImage || user.avatar || null,
                type: 'user'
              });
            } else {
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
        setUserProfile({
          name: 'Misafir',
          profileImage: null,
          type: 'guest'
        });
      }
    };
    
    checkAuth();
    
    const handleStorageChange = (e) => {
      if (e.key === 'authToken' || e.key === 'token' || e.key === 'user') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isDonorMode]);

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

  // Arama fonksiyonu - basit metin arama
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Arama terimini parent component'e gönder
    if (onSearch) {
      onSearch(value);
    }
  };

  // Enter tuşuna basıldığında arama yap
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  // Arama butonu tıklandığında
  const performSearch = () => {
    if (searchTerm.trim()) {
      console.log('Arama yapılıyor:', searchTerm);
      
      // Burada gerçek arama işlemi yapılabilir
      // Örneğin: filtrelenmiş sonuçları göster
      if (onSearch) {
        onSearch(searchTerm);
      }
    }
  };

  const toggleDonorMode = () => {
    const newMode = !isDonorMode;
    setIsDonorMode(newMode);
    localStorage.setItem('donorMode', String(newMode));
    
    if (newMode) {
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

  const handleNotificationsClick = () => {
    setNotificationMenuOpen(!notificationMenuOpen);
    if (cartMenuOpen) setCartMenuOpen(false);
  };

  const handleCartClick = () => {
    setCartMenuOpen(!cartMenuOpen);
    if (notificationMenuOpen) setNotificationMenuOpen(false);
  };

  const handleLogout = () => {
    authService.logout();
    
    if (onLogout) {
      onLogout();
    }
    
    navigate('/');
  };

  return (
    <>
      <div className={`header fixed-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="logo-container" onClick={() => navigate(isDonorMode ? '/sofrani-paylas' : '/')}>
          <img 
            src="/logo1.png" 
            alt="SofraPay Logo" 
            style={{ width: '79px', height: '70px', objectFit: 'contain' }}
            
          />
           <div className="logo-text">SofraPay</div>
        </div>
        
        {/* Basit arama çubuğu */}
        {!isDonorMode && (
          <div className="header-search-container">
            <div className={`simple-search-bar ${isScrolled ? 'compact' : ''}`}>
              <div className="search-icon">
                <FaSearch />
              </div>
              <input
                type="text"
                placeholder="Yiyecek ara... (pizza, döner, baklava...)"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyPress={handleSearchKeyPress}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search-btn"
                  onClick={() => {
                    setSearchTerm('');
                    if (onSearch) onSearch('');
                  }}
                >
                  <FaTimes />
                </button>
              )}
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
            <div 
              className="notification-button" 
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <FaBell />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </div>
          </div>


          <NotificationCenter
            userId={userId}
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
          
          {/* Sepet butonu */}
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
                      <li onClick={() => navigate('/aldiklarim')}>Siparişlerim</li>
                      <li onClick={() => navigate('/degerlerim')}>Yorumlarım</li>
                    </>
                  ) : (
                    <>
                      <li onClick={() => navigate('/seller-profile')}>Profil</li>
                      <li onClick={() => navigate('/paketlerim')}>Paketlerim</li>
                      <li onClick={() => navigate('/sofrani-paylas')}>Kazançlarım</li>
                      <li onClick={() => navigate('/degerlendirmeler')}>Yorumlarım</li>
                      
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

      {/* Sepet Modal'ı */}
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
                          setCartMenuOpen(false);
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