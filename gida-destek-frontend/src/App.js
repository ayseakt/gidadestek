import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Header from './Components/Header';
import SofraniPaylas from './Components/SofraniPaylas';
import Home from './Components/Home/Home';
import MyOrders from './Components/MyOrders';
import UserProfile from './Components/UserProfile';
import Favorites from './Components/Favorites';
import WelcomeScreen from './Components/WelcomeScreen';
import PaymentPage from './Components/PaymentPage';
import { CartProvider } from './contexts/cartContext';
import { AuthProvider } from './context/authContext';
import './App.css';
import SellerProfile from './Components/SellerProfile';
import IncominOrder from './Components/InCominOrder';
import MyReviews from './Components/MyReview';
import SellerReviews from './Components/Home/SellerReview';
const MainScreen = ({ userData, onLogout }) => {
  return (
    <>
      <Header onLogout={onLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sofrani-paylas" element={<SofraniPaylas />} />
          <Route path="/paketlerim" element={<IncominOrder />} />
          <Route path="/aldiklarim" element={<MyOrders />} />
          <Route path="/degerlerim" element={<MyReviews />} />
          <Route path="/degerlendirmeler" element={<SellerReviews />} />
          <Route path="/profil" element={<UserProfile userData={userData} />} />
          <Route path="/favoriler" element={<Favorites />} />
          <Route path="/odeme" element={<PaymentPage />} /> 
          <Route path="/giris" element={<Navigate to="/" replace />} />
          <Route path="/seller-profile" element={<SellerProfile />} />
        </Routes>
      </main>
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; {new Date().getFullYear()} SofraPay. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </>
  );
};

function App() {
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Yükleme durumu eklendi

  const handleLogout = () => {
    // Tüm localStorage verilerini temizle
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isGuest');
    localStorage.removeItem('authToken');
    
    // State'leri sıfırla
    setUserData(null);
    setIsFirstVisit(true);
    
    console.log('Çıkış yapıldı, giriş ekranına yönlendiriliyorsunuz...');
    
    // Sayfayı yenile (opsiyonel)
    // window.location.reload();
  };

  useEffect(() => {
    // localStorage'dan verileri kontrol et
    const checkAuthStatus = () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');
        const isGuest = localStorage.getItem('isGuest') === 'true';

        console.log('Auth kontrolü:', { token: !!token, userStr: !!userStr, isGuest });

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            
            // Kullanıcı bilgilerini normalize et
            const normalizedUserData = {
              ...user,
              id: user.id || user.user_id || user.userId || 'guest',
              user_id: user.user_id || user.id || user.userId || 'guest',
              userId: user.userId || user.id || user.user_id || 'guest',
              isGuest: isGuest || user.isGuest || false
            };
            
            console.log('Kullanıcı yüklendi:', normalizedUserData);
            
            setUserData(normalizedUserData);
            setIsFirstVisit(false);
          } catch (parseError) {
            console.error('Kullanıcı verisi parse edilemedi:', parseError);
            // Hatalı veri varsa temizle
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('authToken');
            localStorage.removeItem('isGuest');
          }
        } else if (isGuest) {
          // Sadece misafir bilgisi varsa
          const guestUser = {
            id: 'guest',
            user_id: 'guest',
            userId: 'guest',
            name: 'Misafir Kullanıcı',
            email: '',
            isGuest: true
          };
          
          setUserData(guestUser);
          setIsFirstVisit(false);
        }
      } catch (error) {
        console.error('Auth kontrol hatası:', error);
        // Hata durumunda localStorage'ı temizle
        localStorage.clear();
      } finally {
        setIsLoading(false);
      }
    };

    // Biraz gecikme ekle (sayfa yüklenme efekti için)
    const timer = setTimeout(checkAuthStatus, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handleOnboardingComplete = (user) => {
    console.log('Onboarding tamamlandı:', user);
    
    if (user) {
      setUserData(user);
    }
    
    setIsFirstVisit(false);
    
    // Sayfa yenilenmesini önlemek için URL'i temizle
    if (window.location.pathname === '/giris') {
      window.history.replaceState({}, '', '/');
    }
  };

  // Yükleme ekranı
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-content">
          <img 
            src="/logo1.png" 
            alt="SofraPay Logo" 
            style={{ width: '80px', height: '80px', objectFit: 'contain' }}
          />
          <p>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="app">
            {isFirstVisit ? (
              <WelcomeScreen onComplete={handleOnboardingComplete} />
            ) : (
              <MainScreen userData={userData} onLogout={handleLogout} />
            )}
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;