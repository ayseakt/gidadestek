// authMiddleware.js - GELİŞTİRİLMİŞ HATA YÖNETİMİ
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'sofrapay-secret-key';

module.exports = (req, res, next) => {
  console.log('🔐 Auth Middleware çalıştı:', {
    method: req.method,
    url: req.url,
    headers: Object.keys(req.headers)
  });

  try {
    // Bearer token'ı al
    const authHeader = req.headers.authorization;
    console.log('📋 Authorization Header:', authHeader ? 'Mevcut' : 'Yok');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Token formatı geçersiz');
      return res.status(401).json({ 
        success: false, 
        message: 'Yetkilendirme hatası: Token formatı geçersiz',
        debug: 'Authorization header eksik veya Bearer ile başlamıyor'
      });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('🎫 Token alındı:', token ? 'Mevcut' : 'Yok');
    
    if (!token) {
      console.log('❌ Token bulunamadı');
      return res.status(401).json({ 
        success: false, 
        message: 'Yetkilendirme hatası: Token bulunamadı' 
      });
    }
    
    // Token doğrulama
    console.log('🔍 Token doğrulanıyor...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token doğrulandı:', { id: decoded.id, email: decoded.email, isGuest: decoded.isGuest });
    
    // Misafir kontrolü
    if (decoded.isGuest) {
      console.log('❌ Misafir kullanıcı erişim engellendi');
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için üye girişi yapmanız gerekmektedir.'
      });
    }
    
    // Kullanıcı bilgilerini request nesnesine ekle
    req.user = {
      id: decoded.id,
      user_id: decoded.id, // Tutarlılık için
      email: decoded.email
    };
    
    console.log('✅ Auth middleware başarılı, kullanıcı:', req.user);
    next();
    
  } catch (error) {
    console.error('❌ Token doğrulama hatası:', error);
    
    if (error.name === 'TokenExpiredError') {
      console.log('⏰ Token süresi dolmuş');
      return res.status(401).json({ 
        success: false, 
        message: 'Oturum süresi doldu, lütfen tekrar giriş yapın' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      console.log('🔒 Token geçersiz');
      return res.status(401).json({ 
        success: false, 
        message: 'Yetkilendirme hatası: Geçersiz token' 
      });
    }
    
    console.log('🚨 Bilinmeyen auth hatası:', error.message);
    return res.status(401).json({ 
      success: false, 
      message: 'Yetkilendirme hatası: ' + error.message 
    });
  }
};