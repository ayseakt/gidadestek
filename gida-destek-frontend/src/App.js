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
import { AuthProvider } from './context/authContext'; // ✅ EKLENDİ
import './App.css';
import SellerProfile from './Components/SellerProfile';
import IncominOrder from './Components/InCominOrder';

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
          <Route path="/profil" element={<UserProfile userData={userData} />} />
          <Route path="/favoriler" element={<Favorites />} />
          <Route path="/odeme" element={<PaymentPage />} /> 
          <Route path="/giris" element={<Navigate to="/" replace />} />
          <Route path="/seller-profile" element={<SellerProfile />} />zz
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isGuest');
    localStorage.removeItem('authToken');
    setUserData(null);
    setIsFirstVisit(true);
    console.log('Çıkış yapıldı, giriş ekranına yönlendiriliyorsunuz...');
  };

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const user = localStorage.getItem('user');

    if (token && user) {
      setIsFirstVisit(false);
      const userData = JSON.parse(user);
      const normalizedUserData = {
        ...userData,
        id: userData.id || userData.user_id || userData.userId,
        user_id: userData.user_id || userData.id || userData.userId,
        userId: userData.userId || userData.id || userData.user_id
      };
      setUserData(normalizedUserData);
          }
  }, []);

  const handleOnboardingComplete = (user) => {
    if (user) {
      setUserData(user);
    }
    setIsFirstVisit(false);
  };

  return (
    <AuthProvider> {/* ✅ BURAYA EKLEDİK */}
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
