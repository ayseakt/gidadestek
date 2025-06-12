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
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
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

      // Token ve kullanıcı bilgilerini localStorage'a kaydet
      if (result.token) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('authToken', result.token);
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
        
        // Ana uygulamaya geçiş yap
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

  // Şifre sıfırlama fonksiyonu
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5051/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Şifre sıfırlama e-postası gönderilemedi');
      }
      
      console.log('Şifre sıfırlama e-postası gönderildi:', result);
      setResetEmailSent(true);
      
      // 3 saniye sonra giriş sayfasına yönlendir
      setTimeout(() => {
        setCurrentPage(2);
        setResetEmailSent(false);
        setFormData({ ...formData, email: '' });
      }, 3000);

    } catch (error) {
      console.error('Şifre sıfırlama hatası:', error);
      setError(error.message || 'Şifre sıfırlama e-postası gönderilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Google ile giriş fonksiyonu - YENİ
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Google OAuth URL'ini oluştur
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.REACT_APP_GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(window.location.origin + '/auth/google/callback')}&` +
        `response_type=code&` +
        `scope=email profile&` +
        `state=${Math.random().toString(36).substring(7)}`;

      // Google OAuth sayfasına yönlendir
      window.location.href = googleAuthUrl;
      
    } catch (error) {
      console.error('Google giriş hatası:', error);
      setError('Google ile giriş yapılırken bir hata oluştu');
      setLoading(false);
    }
  };

  // Şifremi unuttum sayfasına git
  const handleForgotPassword = () => {
    setCurrentPage(3);
    setError('');
    setFormData({ ...formData, email: '', password: '' });
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
        
        <div className="social-buttons">
          <button 
            type="button" 
            className="social-button google"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <i className="fab fa-google"></i>
            {loading ? 'Yükleniyor...' : 'Google ile kayıt ol'}
          </button>
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
          <button 
            type="button" 
            className="social-button google"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <i className="fab fa-google"></i>
            {loading ? 'Yükleniyor...' : 'Google ile giriş yap'}
          </button>
        </div>
      </form>
    </div>,

    // Şifremi Unuttum sayfası
    <div key="forgot-password" className="auth-page">
      <div className="page-header">
        <button className="back-button" onClick={() => setCurrentPage(2)}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2>Şifremi Unuttum</h2>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {resetEmailSent && (
        <div className="success-message">
          Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. E-postanızı kontrol edin ve gelen bağlantıya tıklayarak şifrenizi sıfırlayın.
        </div>
      )}
      
      <div className="forgot-password-info">
        <p>E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.</p>
      </div>
      
      <form onSubmit={handleForgotPasswordSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="forgot-email">E-posta</label>
          <input
            type="email"
            id="forgot-email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="E-posta adresiniz"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="primary-button full-width"
          disabled={loading || resetEmailSent}
        >
          {loading ? 'Gönderiliyor...' : resetEmailSent ? 'E-posta Gönderildi' : 'Şifre Sıfırlama Bağlantısı Gönder'}
        </button>
      </form>
      
      <div className="auth-footer">
        <p>
          Şifrenizi hatırladınız mı? 
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(2);
            }}
          >
            Giriş Yap
          </a>
        </p>
      </div>
    </div>
  ];

  return (
    <div className="welcome-screen">
      {pages[currentPage]}
    </div>
  );
};

export default WelcomeScreen;