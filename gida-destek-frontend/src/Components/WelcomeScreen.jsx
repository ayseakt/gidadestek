import React, { useState } from 'react';
// framer-motion'u temporari olarak kaldıralım
// import { motion } from 'framer-motion';
import './WelcomeScreen.css';
// Logo için alternatif çözüm
// import logo from '../assets/sofrapay-logo.png';

const WelcomeScreen = ({ onComplete }) => {
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Kayıt ol fonksiyonu
  // Kayıt ol fonksiyonu
    const handleSignup = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      try {
        const response = await fetch('http://localhost:5051/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        // Önce response.ok'u kontrol et
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || 'Kayıt işlemi başarısız oldu');
        }
        
        console.log('Kayıt başarılı:', result);

        // Kayıt başarılı mesajını göster ve giriş sayfasına yönlendir
        setRegistrationSuccess(true);
        setTimeout(() => {
          setCurrentPage(2); // Giriş sayfasına yönlendir
          setRegistrationSuccess(false);
        }, 2000);
      } catch (error) {
        console.error('Kayıt hatası:', error);
        setError(error.message || 'Kayıt sırasında bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

  // Giriş yap fonksiyonu
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5051/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Giriş işlemi başarısız oldu');
      }
      
      console.log('Giriş başarılı:', result);

      // Başarılıysa token'ı localStorage'a kaydet
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));

      // Uygulamaya devam et
      onComplete(result.user);
    } catch (error) {
      console.error('Giriş hatası:', error);
      setError(error.message || 'Giriş sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestContinue = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5051/api/auth/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      if (result.success) {
        // Misafir token'ını kaydet
        localStorage.setItem('token', result.token);
        localStorage.setItem('isGuest', 'true');
      }
      
      onComplete(null); // Misafir olarak devam et
    } catch (error) {
      console.error('Misafir giriş hatası:', error);
      onComplete(null); // Hata olsa bile devam et
    } finally {
      setLoading(false);
    }
  };

  const pages = [
    // İlk karşılama sayfası
    <div 
      key="welcome" 
      className="welcome-page"
    >
      <div className="welcome-content">
        {/* Logo için temporari çözüm */}
                  <img 
            src="/logo1.png" 
            alt="SofraPay Logo" 
            style={{ width: '100px', height: '100px', objectFit: 'contain' }}
            
          />
        <h1>Lezzetli yemekler <span className="highlight">dakikalar içinde</span> kapınızda!</h1>
        <p>En sevdiğiniz restoran ve marketlerin lezzetli ürünleri SofraPay ile çok yakınınızda.</p>
        

        
        <div className="welcome-buttons">
          <button 
            className="primary-button"
            onClick={() => setCurrentPage(1)}
          >
            Üye Ol
          </button>
          <button 
            className="secondary-button"
            onClick={() => setCurrentPage(2)}
          >
            Giriş Yap
          </button>
        </div>
        
        {/* <button 
          className="tertiary-button"
          onClick={handleGuestContinue}
          disabled={loading}
        >
          {loading ? 'Lütfen bekleyin...' : 'Misafir Olarak Devam Et'}
        </button> */}
      </div>
    </div>,
    
    // Üye olma sayfası
    <div 
      key="signup" 
      className="auth-page"
    >
      <div className="page-header">
        <button className="back-button" onClick={() => setCurrentPage(0)}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2>Üye Ol</h2>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {registrationSuccess && (
      <div className="success-message">
        Kaydınız başarıyla yapılmıştır. Giriş sayfasına yönlendiriliyorsunuz...
      </div>
      )}
      
      <form onSubmit={handleSignup} className="auth-form">
        <div className="form-group">
          <label htmlFor="name">Ad Soyad</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Ad Soyad"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">E-posta</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="E-posta adresiniz"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="phone">Telefon Numarası</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Telefon numaranız"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Şifre</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Şifreniz (en az 8 karakter)"
            minLength="8"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="primary-button full-width"
          disabled={loading}
        >
          {loading ? 'Lütfen bekleyin...' : 'Üye Ol'}
        </button>
        
        <div className="auth-divider">
          <span>veya</span>
        </div>
        
        <div className="social-buttons">
          <button type="button" className="social-button google">
            <i className="fab fa-google"></i>
            Google ile devam et
          </button>
          
          <button type="button" className="social-button facebook">
            <i className="fab fa-facebook-f"></i>
            Facebook ile devam et
          </button>
        </div>
      </form>
    </div>,
    
    // Giriş yapma sayfası
    <div 
      key="login" 
      className="auth-page"
    >
      <div className="page-header">
        <button className="back-button" onClick={() => setCurrentPage(0)}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2>Giriş Yap</h2>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleLogin} className="auth-form">
        <div className="form-group">
          <label htmlFor="login-email">E-posta</label>
          <input
            type="email"
            id="login-email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="E-posta adresiniz"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="login-password">Şifre</label>
          <input
            type="password"
            id="login-password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Şifreniz"
            required
          />
          <a href="#" className="forgot-password" onClick={() => setCurrentPage(3)}>
            Şifremi Unuttum
          </a>
        </div>
        
        <button 
          type="submit" 
          className="primary-button full-width"
          disabled={loading}
        >
          {loading ? 'Lütfen bekleyin...' : 'Giriş Yap'}
        </button>
        
        <div className="auth-divider">
          <span>veya</span>
        </div>
        
        <div className="social-buttons">
          <button type="button" className="social-button google">
            <i className="fab fa-google"></i>
            Google ile giriş yap
          </button>
          
          <button type="button" className="social-button facebook">
            <i className="fab fa-facebook-f"></i>
            Facebook ile giriş yap
          </button>
        </div>
      </form>
    </div>
  ];

  return (
    <div className="welcome-screen">
      {pages[currentPage]}
    </div>
  );
};

export default WelcomeScreen;