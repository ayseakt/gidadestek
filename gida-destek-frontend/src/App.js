// App.js - Düzeltilmiş Versiyon
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Header from './Components/Header';
import SofraniPaylas from './Components/SofraniPaylas';
import Home from './Components/Home/Home';
import MyOrders from './Components/MyOrders';
import UserProfile from './Components/UserProfile';
import Favorites from './Components/Favorites';
import WelcomeScreen from './Components/WelcomeScreen';
import './App.css';

// MainScreen bileşeni
const MainScreen = ({ userData, onLogout }) => {
  return (
    <>
      <Header onLogout={onLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sofrani-paylas" element={<SofraniPaylas />} />
          
          <Route path="/aldiklarim" element={<MyOrders />} />
          <Route path="/profil" element={<UserProfile userData={userData} />} />
          <Route path="/favoriler" element={<Favorites />} />
          <Route path="/giris" element={<Navigate to="/" replace />} />
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
    // LocalStorage'dan verileri sil
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isGuest');
    localStorage.removeItem('authToken'); // authToken'ı da siliyoruz
    
    // State'i sıfırla
    setUserData(null);
    setIsFirstVisit(true);
    
    console.log('Çıkış yapıldı, giriş ekranına yönlendiriliyorsunuz...');
  };

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsFirstVisit(false);
      setUserData(JSON.parse(user));
    }
  }, []);

  const handleOnboardingComplete = (user) => {
    if (user) {
      setUserData(user);
    }
    setIsFirstVisit(false);
  };

  return (
    <Router>
      <div className="app">
        {isFirstVisit ? (
          <WelcomeScreen onComplete={handleOnboardingComplete} />
        ) : (
          <MainScreen userData={userData} onLogout={handleLogout} />
        )}
      </div>
    </Router>
  );
}

export default App;