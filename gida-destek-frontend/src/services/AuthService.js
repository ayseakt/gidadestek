// AuthService.js - İyileştirilmiş versiyon

/**
 * Kimlik doğrulama işlemlerini merkezileştiren servis sınıfı
 */
class AuthService {
  constructor() {
    this.tokenKey = 'authToken';
    this.userKey = 'user';
  }

  /**
   * Kullanıcı giriş işlemi
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
    // Tüm olası token key'lerini temizle
    const keysToRemove = [
      this.tokenKey, this.userKey, 
      'token', 'user', 'userData', 'userToken',
      'authToken', 'auth_token'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }

  /**
   * Token kaydetme
   */
  setToken(token, rememberMe = true) {
    if (!token) {
      console.warn('Boş token kaydetilmeye çalışıldı');
      return;
    }
    
    if (rememberMe) {
      localStorage.setItem(this.tokenKey, token);
    } else {
      sessionStorage.setItem(this.tokenKey, token);
    }
  }

  /**
   * Kullanıcı bilgisini kaydetme
   */
  setUser(user, rememberMe = true) {
    if (!user || typeof user !== 'object') {
      console.warn('Geçersiz kullanıcı verisi kaydetilmeye çalışıldı:', user);
      return;
    }
    
    try {
      const userString = JSON.stringify(user);
      if (rememberMe) {
        localStorage.setItem(this.userKey, userString);
      } else {
        sessionStorage.setItem(this.userKey, userString);
      }
    } catch (error) {
      console.error('Kullanıcı bilgisi kaydetme hatası:', error);
    }
  }

  /**
   * Token alma
   */
  getToken() {
    const possibleKeys = [
      this.tokenKey, 'token', 'userToken', 'auth_token'
    ];
    
    for (const key of possibleKeys) {
      const token = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (token && token.trim()) {
        return token;
      }
    }
    
    return null;
  }

  /**
   * Kullanıcı bilgisi alma - Geliştirilmiş
   */
  getUser() {
    const possibleKeys = [
      this.userKey, 'user', 'userData', 'userInfo'
    ];
    
    for (const key of possibleKeys) {
      const userStr = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (userStr && userStr.trim()) {
        try {
          const user = JSON.parse(userStr);
          if (user && typeof user === 'object') {
            return user;
          }
        } catch (error) {
          console.warn(`${key} anahtarındaki kullanıcı bilgisi parse edilemedi:`, error);
          // Hatalı veriyi temizle
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        }
      }
    }
    
    return null;
  }
  getUserInfo() {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        return null;
      }
      
      const user = JSON.parse(userStr);
      console.log('AuthService.getUserInfo - Raw user:', user);
      
      // Kullanıcı verisini normalize et
      const normalizedUser = {
        ...user,
        id: user.id || user.user_id || user.userId,
        user_id: user.user_id || user.id || user.userId,
        userId: user.userId || user.id || user.user_id
      };
      
      console.log('AuthService.getUserInfo - Normalized user:', normalizedUser);
      return normalizedUser;
      
    } catch (error) {
      console.error('getUserInfo hatası:', error);
      return null;
    }
  }

  /**
   * Kullanıcının oturum açıp açmadığını kontrol eder
   */
  isAuthenticated() {
    const token = this.getToken();
    
    if (!token) {
      return false;
    }

    // JWT token süresi kontrolü
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.warn('Geçersiz JWT token formatı');
        return false;
      }
      
      const payload = JSON.parse(atob(tokenParts[1]));
      
      // Token süresi kontrolü
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        console.warn('Token süresi dolmuş');
        this.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('Token süresi kontrol edilemedi, token geçerli kabul ediliyor:', error);
      return true; // Parse edilemeyen tokenları geçerli kabul et
    }
  }

  /**
   * Kullanıcı bilgilerini güncelle
   */
  updateUser(updates) {
    const currentUser = this.getUser();
    if (currentUser && typeof updates === 'object') {
      const updatedUser = { ...currentUser, ...updates };
      this.setUser(updatedUser);
      return updatedUser;
    }
    return null;
  }

  /**
   * Debugging için kullanıcı durumunu logla
   */
  debugAuthState() {
    console.log('=== Auth Debug Info ===');
    console.log('Token:', this.getToken() ? 'Mevcut' : 'Yok');
    console.log('User:', this.getUser());
    console.log('Is Authenticated:', this.isAuthenticated());
    console.log('========================');
  }
}

// Singleton instance
const authService = new AuthService();
export default authService;