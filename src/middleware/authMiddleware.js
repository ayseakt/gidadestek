// authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'sofrapay-secret-key';

module.exports = (req, res, next) => {
  try {
    // Bearer token'ı al
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Yetkilendirme hatası: Token formatı geçersiz' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Yetkilendirme hatası: Token bulunamadı' 
      });
    }
    
    // Token doğrulama
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Misafir kontrolü
    if (decoded.isGuest) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için üye girişi yapmanız gerekmektedir.'
      });
    }
    
    // Kullanıcı bilgilerini request nesnesine ekle
    req.user = {
      id: decoded.id,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Oturum süresi doldu, lütfen tekrar giriş yapın' 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Yetkilendirme hatası: Geçersiz token' 
    });
  }
};