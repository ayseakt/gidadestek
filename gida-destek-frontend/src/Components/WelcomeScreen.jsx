import React, { useState } from 'react';
import './WelcomeScreen.css';

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

  // Giriş yap fonksiyonu - GÜNCELLENDİ
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

      // Token ve kullanıcı bilgilerini localStorage'a kaydet
      if (result.token) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('authToken', result.token); // Alternatif anahtar
      }
      
      if (result.user) {
        // Kullanıcı bilgilerini normalize et
        const normalizedUser = {
          ...result.user,
          id: result.user.id || result.user.user_id || result.user.userId,
          user_id: result.user.user_id || result.user.id || result.user.userId,
          userId: result.user.userId || result.user.id || result.user.user_id
        };
        
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        
        // Form verilerini temizle
        setFormData({
          email: '',
          password: '',
          name: '',
          phone: '',
        });
        
        // Ana uygulamaya geçiş yap - biraz gecikme ekle
        setTimeout(() => {
          onComplete(normalizedUser);
        }, 100);
      } else {
        throw new Error('Kullanıcı bilgileri alınamadı');
      }
      
    } catch (error) {
      console.error('Giriş hatası:', error);
      setError(error.message || 'Giriş sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Misafir olarak devam et fonksiyonu - GÜNCELLENDİ
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
      
      if (result.success && result.token) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('isGuest', 'true');
        
        // Misafir kullanıcı bilgisi oluştur
        const guestUser = {
          id: 'guest',
          user_id: 'guest',
          userId: 'guest',
          name: 'Misafir Kullanıcı',
          email: '',
          isGuest: true
        };
        
        localStorage.setItem('user', JSON.stringify(guestUser));
        
        setTimeout(() => {
          onComplete(guestUser);
        }, 100);
      } else {
        // API başarısız olsa bile misafir olarak devam et
        const guestUser = {
          id: 'guest',
          user_id: 'guest',
          userId: 'guest',
          name: 'Misafir Kullanıcı',
          email: '',
          isGuest: true
        };
        
        localStorage.setItem('isGuest', 'true');
        localStorage.setItem('user', JSON.stringify(guestUser));
        
        setTimeout(() => {
          onComplete(guestUser);
        }, 100);
      }
    } catch (error) {
      console.error('Misafir giriş hatası:', error);
      
      // Hata olsa bile misafir olarak devam et
      const guestUser = {
        id: 'guest',
        user_id: 'guest',
        userId: 'guest',
        name: 'Misafir Kullanıcı',
        email: '',
        isGuest: true
      };
      
      localStorage.setItem('isGuest', 'true');
      localStorage.setItem('user', JSON.stringify(guestUser));
      
      setTimeout(() => {
        onComplete(guestUser);
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  // Şifremi unuttum sayfasına git
  const handleForgotPassword = () => {
    setCurrentPage(3);
  };

  const pages = [
    // İlk karşılama sayfası
    <div key="welcome" className="welcome-page">
      <div className="welcome-content">
        <img 
          src="/logo1.png" 
          alt="SofraPay Logo" 
          style={{ width: '100px', height: '100px', objectFit: 'contain' }}
        />
        <h1>Gıda israfı tarih oluyor<span className="highlight">,sen tasarruf ediyorsun!</span> </h1>
        <p>Restoran ve marketlerden artık yemekleri uygun fiyatlarla kurtarın. Hem çevreyi koruyun, hem de lezzetli yemeklere ulaşın.</p>
        
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
        

      </div>
    </div>,
    
    // Üye olma sayfası
    <div key="signup" className="auth-page">
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
        

      </form>
    </div>,
    
    // Giriş yapma sayfası
    <div key="login" className="auth-page">
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
          <a 
            href="#" 
            className="forgot-password-link" 
            onClick={(e) => {
              e.preventDefault();
              handleForgotPassword();
            }}
          >
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