const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const ReviewController = require('../controllers/reviewController');
const { getSellerAverageRating } = require('./reviewController');
// ✅ Yorum oluşturma (sadece teslim edilmiş siparişler için)
router.post('/create', authMiddleware, ReviewController.createReview);

// ✅ Satıcının aldığı yorumları getirme (public)
router.get('/seller/:sellerId', ReviewController.getSellerReviews);

// ✅ Satıcının kendi aldığı yorumları getirme (private) - YENİ EKLENEN
router.get('/seller-reviews', authMiddleware, ReviewController.getMySellerReviews);

// ✅ Kullanıcının kendi yorumları
router.get('/my-reviews', authMiddleware, ReviewController.getUserReviews);

// ✅ Satıcının yorumlara yanıt vermesi
router.post('/:reviewId/response', authMiddleware, ReviewController.respondToReview);

// ✅ Yorum faydalı bulma/bulmama
router.post('/:reviewId/helpful', authMiddleware, ReviewController.markHelpful);

// ✅ Yorum görünürlüğünü değiştirme (admin/satıcı)
router.patch('/:reviewId/visibility', authMiddleware, ReviewController.updateVisibility);

// ✅ Yorumlanabilir siparişleri getirme
router.get('/reviewable-orders', authMiddleware, ReviewController.getReviewableOrders);

// ✅ Yorum güncelleme
router.put('/:reviewId', authMiddleware, ReviewController.updateReview);

// ✅ Yorum silme
router.delete('/:reviewId', authMiddleware, ReviewController.deleteReview);

router.get('/seller/:seller_id/average-rating', ReviewController.getSellerAverageRating);

module.exports = router;