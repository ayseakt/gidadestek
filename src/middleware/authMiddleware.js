const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
  try {
    // Token kontrolü şimdilik basit bir yapı olsun
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Yetkilendirme hatası: Token bulunamadı' });
    }
    
    // jwt.verify(token, process.env.JWT_SECRET);
    // Şimdilik yetkilendirme kontrolünü aktif etmiyoruz
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Yetkilendirme hatası' });
  }
};