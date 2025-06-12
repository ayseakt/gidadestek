// authRoutes.js - Düzeltilmiş Sürüm
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Kayıt ol route
router.post('/signup', authController.signup);

// Giriş route
router.post('/login', authController.login);

// Misafir giriş route
router.post('/guest', authController.guestLogin);

// Şifre sıfırlama route - YENİ
router.post('/forgot-password', authController.forgotPassword);

// Şifre sıfırlama onaylama route (opsiyonel - şifre sıfırlama linkinden gelecek)
router.post('/reset-password', authController.resetPassword);

// Export router
module.exports = router;