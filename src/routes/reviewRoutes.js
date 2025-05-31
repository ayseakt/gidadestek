const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { 
  Review, 
  User, 
  UserProfile,
  Seller, 
  Order, 
  FoodPackage,
  OrderItem
} = require('../models');
const { Op } = require('sequelize');

// ✅ Yorum oluşturma (sadece teslim edilmiş siparişler için)
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { 
      order_id,
      seller_id,
      package_id,
      rating,
      food_quality_rating,
      service_rating,
      value_rating,
      comment,
      is_anonymous = false
    } = req.body;

    console.log('📝 Yeni yorum oluşturuluyor:', { userId, order_id, seller_id, rating });

    // Validasyonlar
    if (!seller_id || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Satıcı ID ve genel puan zorunludur'
      });
    }

    // Eğer order_id verilmişse, siparişin teslim edilmiş olup olmadığını kontrol et
    if (order_id) {
      const order = await Order.findOne({
        where: {
          order_id: order_id,
          user_id: userId,
          order_status: 'completed'
        }
      });

      if (!order) {
        return res.status(400).json({
          success: false,
          message: 'Bu sipariş için yorum yapılamaz (tamamlanmamış veya size ait değil)'
        });
      }

      // Bu sipariş için daha önce yorum yapılmış mı kontrol et
      const existingReview = await Review.findOne({
        where: {
          user_id: userId,
          order_id: order_id
        }
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'Bu sipariş için zaten yorum yapmışsınız'
        });
      }
    }

    // Satıcının var olup olmadığını kontrol et
    const seller = await Seller.findByPk(seller_id);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Satıcı bulunamadı'
      });
    }

    // Package kontrolü (eğer verilmişse)
    if (package_id) {
      const packageInfo = await FoodPackage.findByPk(package_id);
      if (!packageInfo || packageInfo.seller_id !== seller_id) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz ürün ID'
        });
      }
    }

    // Yorumu oluştur
    const review = await Review.create({
      user_id: userId,
      seller_id: seller_id,
      order_id: order_id || null,
      package_id: package_id || null,
      rating: parseInt(rating),
      food_quality_rating: parseInt(food_quality_rating || rating),
      service_rating: parseInt(service_rating || rating),
      value_rating: parseInt(value_rating || rating),
      comment: comment || null,
      is_anonymous: Boolean(is_anonymous),
      is_visible: true,
      helpful_count: 0
    });

    console.log('✅ Yorum başarıyla oluşturuldu:', review.review_id);

    // Yorumu ilişkiler ile birlikte getir
    const createdReview = await Review.findByPk(review.review_id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_id'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['first_name', 'last_name']
            }
          ]
        },
        {
          model: Seller,
          as: 'seller',
          attributes: ['seller_id', 'business_name']
        },
        {
          model: FoodPackage,
          as: 'package',
          attributes: ['package_id', 'package_name']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Yorumunuz başarıyla eklendi',
      review: createdReview
    });

  } catch (error) {
    console.error('❌ Yorum oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Yorum eklenirken hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ✅ Satıcının aldığı yorumları getirme
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    console.log('📋 Satıcı yorumları getiriliyor:', { sellerId, page, limit, sort });

    // Sıralama seçenekleri
    let orderClause;
    switch (sort) {
      case 'oldest':
        orderClause = [['created_at', 'ASC']];
        break;
      case 'highest_rating':
        orderClause = [['rating', 'DESC'], ['created_at', 'DESC']];
        break;
      case 'lowest_rating':
        orderClause = [['rating', 'ASC'], ['created_at', 'DESC']];
        break;
      case 'most_helpful':
        orderClause = [['helpful_count', 'DESC'], ['created_at', 'DESC']];
        break;
      default: // newest
        orderClause = [['created_at', 'DESC']];
    }

    const reviews = await Review.findAndCountAll({
      where: {
        seller_id: sellerId,
        is_visible: true
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_id'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['first_name', 'last_name']
            }
          ]
        },
        {
          model: FoodPackage,
          as: 'package',
          attributes: ['package_id', 'package_name'],
          required: false
        }
      ],
      order: orderClause,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Ortalama puanları hesapla
    const avgRatings = await Review.findOne({
      where: {
        seller_id: sellerId,
        is_visible: true
      },
      attributes: [
        [Review.sequelize.fn('AVG', Review.sequelize.col('rating')), 'avg_rating'],
        [Review.sequelize.fn('AVG', Review.sequelize.col('food_quality_rating')), 'avg_food_quality'],
        [Review.sequelize.fn('AVG', Review.sequelize.col('service_rating')), 'avg_service'],
        [Review.sequelize.fn('AVG', Review.sequelize.col('value_rating')), 'avg_value'],
        [Review.sequelize.fn('COUNT', Review.sequelize.col('review_id')), 'total_reviews']
      ],
      raw: true
    });

    // Puan dağılımını hesapla
    const ratingDistribution = await Review.findAll({
      where: {
        seller_id: sellerId,
        is_visible: true
      },
      attributes: [
        'rating',
        [Review.sequelize.fn('COUNT', Review.sequelize.col('rating')), 'count']
      ],
      group: ['rating'],
      raw: true
    });

    // Frontend formatına çevir
    const formattedReviews = reviews.rows.map(review => {
      const userName = review.is_anonymous 
        ? 'Anonim Kullanıcı'
        : (review.user?.UserProfile?.first_name && review.user?.UserProfile?.last_name)
          ? `${review.user.UserProfile.first_name} ${review.user.UserProfile.last_name}`
          : 'Kullanıcı';

      return {
        id: review.review_id,
        userName: userName,
        userId: review.is_anonymous ? null : review.user_id,
        rating: review.rating,
        foodQuality: review.food_quality_rating,
        service: review.service_rating,
        value: review.value_rating,
        comment: review.comment,
        packageName: review.package?.package_name || null,
        helpfulCount: review.helpful_count,
        isAnonymous: review.is_anonymous,
        createdAt: review.created_at,
        response: review.response_text ? {
          text: review.response_text,
          date: review.response_date
        } : null
      };
    });

    const distributionObj = {};
    for (let i = 1; i <= 5; i++) {
      const found = ratingDistribution.find(item => item.rating === i);
      distributionObj[i] = found ? parseInt(found.count) : 0;
    }

    res.json({
      success: true,
      reviews: formattedReviews,
      totalCount: reviews.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(reviews.count / parseInt(limit)),
      statistics: {
        averageRating: parseFloat(avgRatings?.avg_rating || 0).toFixed(1),
        averageFoodQuality: parseFloat(avgRatings?.avg_food_quality || 0).toFixed(1),
        averageService: parseFloat(avgRatings?.avg_service || 0).toFixed(1),
        averageValue: parseFloat(avgRatings?.avg_value || 0).toFixed(1),
        totalReviews: parseInt(avgRatings?.total_reviews || 0),
        ratingDistribution: distributionObj
      }
    });

  } catch (error) {
    console.error('❌ Satıcı yorumları getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Yorumlar getirilemedi',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ✅ Kullanıcının kendi yorumları
router.get('/my-reviews', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { page = 1, limit = 10 } = req.query;

    console.log('📋 Kullanıcı yorumları getiriliyor:', userId);

    const reviews = await Review.findAndCountAll({
      where: {
        user_id: userId
      },
      include: [
        {
          model: Seller,
          as: 'seller',
          attributes: ['seller_id', 'business_name']
        },
        {
          model: FoodPackage,
          as: 'package',
          attributes: ['package_id', 'package_name'],
          required: false
        },
        {
          model: Order,
          as: 'order',
          attributes: ['order_id', 'order_date'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    const formattedReviews = reviews.rows.map(review => ({
      id: review.review_id,
      sellerName: review.seller?.business_name || 'Satıcı',
      packageName: review.package?.package_name || null,
      rating: review.rating,
      foodQuality: review.food_quality_rating,
      service: review.service_rating,
      value: review.value_rating,
      comment: review.comment,
      helpfulCount: review.helpful_count,
      isVisible: review.is_visible,
      isAnonymous: review.is_anonymous,
      createdAt: review.created_at,
      orderDate: review.order?.order_date || null,
      response: review.response_text ? {
        text: review.response_text,
        date: review.response_date
      } : null
    }));

    res.json({
      success: true,
      reviews: formattedReviews,
      totalCount: reviews.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(reviews.count / parseInt(limit))
    });

  } catch (error) {
    console.error('❌ Kullanıcı yorumları getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Yorumlar getirilemedi',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ✅ Satıcının yorumlara yanıt vermesi
router.post('/:reviewId/response', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { response_text } = req.body;
    const userId = req.user.user_id || req.user.id;

    console.log('💬 Yoruma yanıt veriliyor:', { reviewId, userId });

    if (!response_text || response_text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Yanıt metni boş olamaz'
      });
    }

    // Satıcı kontrolü
    const seller = await Seller.findOne({
      where: { user_id: userId }
    });

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için satıcı yetkisi gereklidir'
      });
    }

    // Yorumun bu satıcıya ait olup olmadığını kontrol et
    const review = await Review.findOne({
      where: {
        review_id: reviewId,
        seller_id: seller.seller_id
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Yorum bulunamadı veya size ait değil'
      });
    }

    // Yanıtı güncelle
    await review.update({
      response_text: response_text.trim(),
      response_date: new Date()
    });

    console.log('✅ Yoruma yanıt verildi:', reviewId);

    res.json({
      success: true,
      message: 'Yanıtınız başarıyla eklendi',
      response: {
        text: response_text.trim(),
        date: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Yoruma yanıt verme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Yanıt eklenirken hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ✅ Yorum faydalı bulma/bulmama
router.post('/:reviewId/helpful', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { helpful } = req.body; // true veya false

    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Yorum bulunamadı'
      });
    }

    // Faydalı sayısını güncelle
    const increment = helpful === true ? 1 : (helpful === false ? -1 : 0);
    const newCount = Math.max(0, review.helpful_count + increment);

    await review.update({
      helpful_count: newCount
    });

    res.json({
      success: true,
      message: helpful ? 'Yorum faydalı olarak işaretlendi' : 'Faydalı işareti kaldırıldı',
      helpfulCount: newCount
    });

  } catch (error) {
    console.error('❌ Faydalı işaretleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İşlem tamamlanamadı',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ✅ Yorum görünürlüğünü değiştirme (admin/satıcı)
router.patch('/:reviewId/visibility', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { is_visible } = req.body;
    const userId = req.user.user_id || req.user.id;

    // Satıcı kontrolü
    const seller = await Seller.findOne({
      where: { user_id: userId }
    });

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için satıcı yetkisi gereklidir'
      });
    }

    const review = await Review.findOne({
      where: {
        review_id: reviewId,
        seller_id: seller.seller_id
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Yorum bulunamadı'
      });
    }

    await review.update({
      is_visible: Boolean(is_visible)
    });

    res.json({
      success: true,
      message: `Yorum ${is_visible ? 'görünür' : 'gizli'} olarak ayarlandı`
    });

  } catch (error) {
    console.error('❌ Görünürlük değiştirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İşlem tamamlanamadı',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ✅ Yorum yorumlanabilir siparişleri getirme
router.get('/reviewable-orders', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;

    console.log('📋 Yorumlanabilir siparişler getiriliyor:', userId);

    // Tamamlanmış ve henüz yorumlanmamış siparişleri getir
    const reviewableOrders = await Order.findAll({
      where: {
        user_id: userId,
        order_status: 'completed'
      },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: FoodPackage,
              as: 'package',
              attributes: ['package_id', 'package_name', 'image_url']
            }
          ]
        },
        {
          model: Seller,
          as: 'seller',
          attributes: ['seller_id', 'business_name']
        },
        {
          model: Review,
          as: 'reviews',
          where: { user_id: userId },
          required: false
        }
      ],
      order: [['order_date', 'DESC']]
    });

    // Henüz yorumlanmamış siparişleri filtrele
    const unreviewed = reviewableOrders.filter(order => 
      !order.reviews || order.reviews.length === 0
    );

    const formattedOrders = unreviewed.map(order => ({
      orderId: order.order_id,
      orderNumber: `SP${order.order_id.toString().padStart(6, '0')}`,
      sellerName: order.seller?.business_name || 'Satıcı',
      sellerId: order.seller?.seller_id,
      orderDate: order.order_date,
      totalAmount: parseFloat(order.total_amount),
      items: order.items?.map(item => ({
        packageId: item.package_id,
        packageName: item.package?.package_name || 'Ürün',
        quantity: item.quantity,
        imageUrl: item.package?.image_url
      })) || []
    }));

    res.json({
      success: true,
      orders: formattedOrders,
      message: formattedOrders.length === 0 ? 'Yorumlanabilir sipariş bulunmuyor' : null
    });

  } catch (error) {
    console.error('❌ Yorumlanabilir siparişler getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Siparişler getirilemedi',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;