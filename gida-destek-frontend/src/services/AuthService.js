// AuthService.js - Yeni dosya oluşturalım

/**
 * Kimlik doğrulama işlemlerini merkezileştiren servis sınıfı
 */
class AuthService {
  constructor() {
    this.tokenKey = 'authToken'; // Varsayılan token anahtarı
    this.userKey = 'user'; // Varsayılan kullanıcı anahtarı
  }

  /**
   * Kullanıcı giriş işlemi
   * @param {Object} credentials - Kullanıcı bilgileri {email, password}
   * @param {Function} apiLoginFn - API login fonksiyonu
   * @returns {Promise} Login sonucu
   */
  async login(credentials, apiLoginFn) {
    try {
      const response = await apiLoginFn(credentials);
      
      if (response && response.data && response.data.token) {
        this.setToken(response.data.token);
        
        if (response.data.user) {
          this.setUser(response.data.user);
        }
        
        return {
          success: true,
          data: response.data
        };
      } else {
        throw new Error('Token alınamadı');
      }
    } catch (error) {
      console.error('Login hatası:', error);
      return {
        success: false,
        error: error.message || 'Giriş sırasında bir hata oluştu'
      };
    }
  }

  /**
   * Oturumu sonlandırma
   */
  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.userKey);
  }

  /**
   * Token kaydetme
   * @param {string} token - JWT token
   * @param {boolean} rememberMe - Oturumu hatırla seçeneği
   */
  setToken(token, rememberMe = true) {
    if (rememberMe) {
      localStorage.setItem(this.tokenKey, token);
    } else {
      sessionStorage.setItem(this.tokenKey, token);
    }
  }

  /**
   * Kullanıcı bilgisini kaydetme
   * @param {Object} user - Kullanıcı bilgileri
   * @param {boolean} rememberMe - Oturumu hatırla seçeneği
   */
  setUser(user, rememberMe = true) {
    if (rememberMe) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    } else {
      sessionStorage.setItem(this.userKey, JSON.stringify(user));
    }
  }

  /**
   * Token alma
   * @returns {string|null} Kayıtlı token
   */
  getToken() {
    return (
      localStorage.getItem(this.tokenKey) || 
      sessionStorage.getItem(this.tokenKey) ||
      localStorage.getItem('token') || // Alternatif isimler
      sessionStorage.getItem('token') ||
      localStorage.getItem('userToken') ||
      sessionStorage.getItem('userToken')
    );
  }

  /**
   * Kullanıcı bilgisi alma
   * @returns {Object|null} Kayıtlı kullanıcı
   */
  getUser() {
    const userStr = (
      localStorage.getItem(this.userKey) || 
      sessionStorage.getItem(this.userKey) ||
      localStorage.getItem('userData') || // Alternatif isimler
      sessionStorage.getItem('userData')
    );
    
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.error('Kullanıcı bilgisi parse hatası:', e);
      return null;
    }
  }

  /**
   * Kullanıcının oturum açıp açmadığını kontrol eder
   * @returns {boolean} Oturum durumu
   */
  isAuthenticated() {
    const token = this.getToken();
    
    if (!token) {
      return false;
    }

    // Opsiyonel: Token süresi kontrolü
    try {
      // JWT token basit süresi kontrol (token'ın payload kısmını decode et)
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        this.logout(); // Süresi geçmiş token, oturumu kapat
        return false;
      }
    } catch (e) {
      // Token parse edilemezse, normal devam et
      console.warn('Token süresi kontrol edilemedi');
    }
    
    return true;
  }
}

// Singleton instance
const authService = new AuthService();
export default authService;