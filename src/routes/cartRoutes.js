// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');

// Auth middleware'i tüm route'lara uygula
router.use(authMiddleware);

// Sepet işlemleri
router.post('/add', cartController.addToCart);           // Sepete ekle
router.get('/', cartController.getCart);                 // Sepeti getir
router.get('/count', cartController.getCartCount);       // Sepet öğe sayısı
router.put('/item/:cart_item_id', cartController.updateCartItem); // Sepet öğesi güncelle
router.delete('/item/:cart_item_id', cartController.removeFromCart); // Sepetten sil
router.delete('/clear', cartController.clearCart);       // Sepeti temizle

module.exports = router;