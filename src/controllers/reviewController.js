const { 
  Review, 
  User, 
  UserProfile,
  Seller, 
  Order, 
  FoodPackage,
  OrderItem,
  sequelize
} = require('../models');
const { Op } = require('sequelize');
const { PackageImage } = require('../models');
class ReviewController {
  // ✅ Yorum oluşturma (düzeltilmiş - doğru seller_id kullanımı)
// ReviewController.js - createReview metodunu bu şekilde güncelleyin:

static async createReview(req, res) {
  try {
    const userId = req.user.user_id || req.user.id;
    const { 
      order_id,
      package_id, 
      rating,
      food_quality_rating,
      service_rating,
      value_rating,
      comment,
      is_anonymous = false
    } = req.body;

    console.log('📝 Yeni yorum oluşturuluyor:', { 
      userId, 
      order_id, 
      package_id, 
      rating,
      body: req.body 
    });

    // ✅ Temel validasyonlar
    if (!package_id) {
      return res.status(400).json({
        success: false,
        message: 'Ürün ID zorunludur'
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir puan değeri (1-5) giriniz'
      });
    }

    // ✅ Paketi ve sahibini bul
    const foodPackage = await FoodPackage.findByPk(package_id, {
      include: [
        {
          model: Seller,
          as: 'seller',
          attributes: ['seller_id', 'business_name']
        }
      ]
    });

    if (!foodPackage) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    const seller_id = foodPackage.seller.seller_id;
    console.log('🎯 Seller ID:', seller_id);

    // ✅ Kullanıcının satıcı olup olmadığını kontrol et
    const userAsSeller = await Seller.findOne({
      where: { user_id: userId }
    });

    // ✅ Kendi ürününe yorum yapmasını engelle
    if (userAsSeller && userAsSeller.seller_id === seller_id) {
      return res.status(400).json({
        success: false,
        message: 'Kendi ürününüze değerlendirme yapamazsınız'
      });
    }

    // ✅ Duplicate review kontrolü - daha kapsamlı
    let duplicateQuery = {
      user_id: userId,
      package_id: package_id
    };

    // Eğer order_id verilmişse onu da kontrol et
    if (order_id) {
      duplicateQuery.order_id = order_id;
    }

    const existingReview = await Review.findOne({
      where: duplicateQuery
    });

    if (existingReview) {
      console.log('⚠️ Duplicate review detected:', existingReview.review_id);
      return res.status(400).json({
        success: false,
        message: order_id 
          ? 'Bu sipariş için zaten değerlendirme yapmışsınız'
          : 'Bu ürün için zaten değerlendirme yapmışsınız',
        existing_review_id: existingReview.review_id
      });
    }

    // ✅ Sipariş kontrolü (eğer order_id verilmişse)
    if (order_id) {
      const order = await Order.findOne({
        where: {
          order_id: order_id,
          user_id: userId,
          order_status: { [Op.in]: ['completed', 'teslim_edildi'] }
        },
        include: [
          {
            model: OrderItem,
            as: 'items',
            where: { package_id: package_id },
            required: true
          }
        ]
      });

      if (!order) {
        return res.status(400).json({
          success: false,
          message: 'Bu sipariş için değerlendirme yapılamaz veya ürün siparişte bulunmuyor'
        });
      }
    }

    // ✅ Yorumu oluştur
    const review = await Review.create({
      user_id: userId,
      seller_id: seller_id,
      order_id: order_id || null,
      package_id: package_id,
      rating: parseInt(rating),
      food_quality_rating: parseInt(food_quality_rating || rating),
      service_rating: parseInt(service_rating || rating),
      value_rating: parseInt(value_rating || rating),
      comment: comment ? comment.trim() : null,
      is_anonymous: Boolean(is_anonymous),
      is_visible: true,
      helpful_count: 0
    });

    console.log('✅ Yorum başarıyla oluşturuldu:', review.review_id);

    return res.status(201).json({
      success: true,
      message: 'Değerlendirmeniz başarıyla eklendi',
      review: {
        review_id: review.review_id,
        seller_name: foodPackage.seller?.business_name,
        product_name: foodPackage.package_name,
        rating: review.rating,
        created_at: review.created_at
      }
    });

  } catch (error) {
    console.error('❌ Yorum oluşturma hatası:', error);
    
    // ✅ Sequelize validation hatalarını yakala
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Girilen veriler geçersiz',
        errors: error.errors.map(e => e.message)
      });
    }

    // ✅ Unique constraint hatalarını yakala
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Bu ürün için zaten değerlendirme yapmışsınız'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Değerlendirme eklenirken hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

  // ✅ Kullanıcının kendi yorumları (düzeltilmiş - eksik veriler eklendi)
// ✅ Düzeltilmiş getUserReviews metodu - ReviewController.js içinde değiştirilecek kısım

static async getUserReviews(req, res) {
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
          attributes: [
            'package_id', 
            'package_name', 
            'discounted_price'
          ],
          required: false,
          include: [
            {
              model: PackageImage,
              as: 'images',
              attributes: ['image_path', 'is_primary'],
              where: { is_primary: true },
              required: false
            },
            {
              model: Seller,
              as: 'seller',
              attributes: ['business_name']
            }
          ]
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
      review_id: review.review_id,
      seller_name: review.seller?.business_name || 'Satıcı Bulunamadı',
      product_name: review.package?.package_name || 'Ürün Bulunamadı',
      product_image: review.package?.images?.[0]?.image_path || '/default-food.jpg',
      
      // ✅ Rating alanları düzgün şekilde eklendi
      rating: review.rating,
      food_quality_rating: review.food_quality_rating,
      service_rating: review.service_rating,
      value_rating: review.value_rating,
      
      // ✅ Yorum metni eklendi
      comment: review.comment,
      
      // ✅ Diğer önemli alanlar
      helpful_count: review.helpful_count,
      is_visible: review.is_visible,
      is_anonymous: review.is_anonymous,
      created_at: review.created_at,
      
      // ✅ Satıcı yanıtı alanları
      response_text: review.response_text,
      response_date: review.response_date,
      
      // ✅ Sipariş tarihi
      order_date: review.order?.order_date || null
    }));

    return res.json({
      success: true,
      reviews: formattedReviews,
      totalCount: reviews.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(reviews.count / parseInt(limit))
    });

  } catch (error) {
    console.error('❌ Kullanıcı yorumları getirme hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Yorumlar getirilemedi', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

  // ✅ Yorumlanabilir siparişleri getirme (düzeltilmiş)
  static async getReviewableOrders(req, res) {
    try {
      const userId = req.user.user_id || req.user.id;

      console.log('📋 Yorumlanabilir siparişler getiriliyor:', userId);

      // Tamamlanmış siparişleri getir
      const completedOrders = await Order.findAll({
        where: {
          user_id: userId,
          order_status: { [Op.in]: ['completed', 'teslim_edildi'] }
        },
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [
              {
                model: FoodPackage,
                as: 'package',
                attributes: ['package_id', 'package_name'],
                include: [
                  {
                    model: Seller,
                    as: 'seller',
                    attributes: ['seller_id', 'business_name']
                  }
                ]
              }
            ]
          }
        ],
        order: [['order_date', 'DESC']]
      });

      // Her sipariş için yorumlanabilir ürünleri kontrol et
      const reviewableItems = [];

      for (const order of completedOrders) {
        for (const item of order.items) {
          // Bu ürün için daha önce yorum yapılmış mı kontrol et
          const existingReview = await Review.findOne({
            where: {
              user_id: userId,
              package_id: item.package_id,
              order_id: order.order_id
            }
          });

          if (!existingReview && item.package) {
            reviewableItems.push({
              orderId: order.order_id,
              orderNumber: `SP${order.order_id.toString().padStart(6, '0')}`,
              orderDate: order.order_date,
              packageId: item.package_id,
              packageName: item.package.package_name,
              // packageImage: item.package.image_url,
              sellerId: item.package.seller?.seller_id,
              sellerName: item.package.seller?.business_name || 'Satıcı',
              quantity: item.quantity
            });
          }
        }
      }

      return res.json({
        success: true,
        reviewableItems: reviewableItems,
        message: reviewableItems.length === 0 ? 'Yorumlanabilir ürün bulunmuyor' : null
      });

    } catch (error) {
      console.error('❌ Yorumlanabilir siparişler getirme hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Siparişler getirilemedi',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  // ReviewController.js - Bu metodu ekleyin

static async getMySellerReviews(req, res) {
  try {
    const userId = req.user.user_id || req.user.id;
    const { page = 1, limit = 20, filter = 'all', sort = 'newest' } = req.query;

    console.log('📋 Satıcının aldığı yorumlar getiriliyor:', { userId, filter, sort });

    // Kullanıcının satıcı hesabını bul
    const seller = await Seller.findOne({
      where: { user_id: userId },
      attributes: ['seller_id', 'business_name']
    });

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için satıcı yetkisi gereklidir'
      });
    }

    // Filtreleme koşulları
    let whereConditions = {
      seller_id: seller.seller_id,
      is_visible: true
    };

    // Tarih filtreleri
    if (filter === 'recent') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      whereConditions.created_at = {
        [Op.gte]: weekAgo
      };
    } else if (filter === 'high-rated') {
      whereConditions.rating = {
        [Op.gte]: 4
      };
    } else if (filter === 'low-rated') {
      whereConditions.rating = {
        [Op.lte]: 3
      };
    } else if (filter === 'responded') {
      whereConditions.response_text = {
        [Op.not]: null
      };
    } else if (filter === 'needs-response') {
      whereConditions.response_text = null;
    }

    // Sıralama
    let orderClause;
    switch (sort) {
      case 'oldest':
        orderClause = [['created_at', 'ASC']];
        break;
      case 'rating-high':
        orderClause = [['rating', 'DESC'], ['created_at', 'DESC']];
        break;
      case 'rating-low':
        orderClause = [['rating', 'ASC'], ['created_at', 'DESC']];
        break;
      case 'needs-response':
        orderClause = [
          [sequelize.literal('CASE WHEN response_text IS NULL THEN 0 ELSE 1 END'), 'ASC'],
          ['created_at', 'DESC']
        ];
        break;
      default: // newest
        orderClause = [['created_at', 'DESC']];
    }

    const reviews = await Review.findAndCountAll({
      where: whereConditions,
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
        },
        {
          model: Order,
          as: 'order',
          attributes: ['order_id', 'order_date'],
          required: false
        }
      ],
      order: orderClause,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // İstatistikleri hesapla
    const stats = await Review.findOne({
      where: {
        seller_id: seller.seller_id,
        is_visible: true
      },
      attributes: [
        [Review.sequelize.fn('COUNT', Review.sequelize.col('review_id')), 'total'],
        [Review.sequelize.fn('AVG', Review.sequelize.col('rating')), 'average_rating'],
        [
          Review.sequelize.fn('COUNT', 
            Review.sequelize.literal('CASE WHEN response_text IS NOT NULL THEN 1 END')
          ), 
          'responded'
        ],
        [
          Review.sequelize.fn('COUNT', 
            Review.sequelize.literal('CASE WHEN response_text IS NULL THEN 1 END')
          ), 
          'needs_response'
        ]
      ],
      raw: true
    });

    // Yorumları formatla
    const formattedReviews = reviews.rows.map(review => {
      const customerName = review.is_anonymous 
        ? 'Anonim Müşteri'
        : (review.user?.profile?.first_name && review.user?.profile?.last_name)
          ? `${review.user.profile.first_name} ${review.user.profile.last_name}`
          : 'Müşteri';

      return {
        review_id: review.review_id,
        customer_name: customerName,
        product_name: review.package?.package_name || 'Ürün Bulunamadı',
        // product_image: review.package?.image_url || '/default-food.jpg',
        
        // Rating bilgileri
        rating: review.rating,
        food_quality_rating: review.food_quality_rating,
        service_rating: review.service_rating,
        value_rating: review.value_rating,
        
        // Yorum detayları
        comment: review.comment,
        helpful_count: review.helpful_count,
        is_anonymous: review.is_anonymous,
        is_visible: review.is_visible,
        created_at: review.created_at,
        
        // Satıcı yanıtı
        response_text: review.response_text,
        response_date: review.response_date,
        
        // Sipariş bilgisi
        order_date: review.order?.order_date || null
      };
    });

    return res.json({
      success: true,
      reviews: formattedReviews,
      totalCount: reviews.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(reviews.count / parseInt(limit)),
      stats: {
        total: parseInt(stats?.total || 0),
        averageRating: parseFloat(stats?.average_rating || 0).toFixed(1),
        responded: parseInt(stats?.responded || 0),
        needsResponse: parseInt(stats?.needs_response || 0)
      }
    });

  } catch (error) {
    console.error('❌ Satıcı yorumları getirme hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Yorumlar getirilemedi',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

  // Diğer methodlar aynı kalıyor...
  static async getSellerReviews(req, res) {
    try {
      const { sellerId } = req.params;
      const { page = 1, limit = 10, sort = 'newest' } = req.query;

      console.log('📋 Satıcı yorumları getiriliyor:', { sellerId, page, limit, sort });

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

      const formattedReviews = reviews.rows.map(review => {
        const userName = review.is_anonymous 
          ? 'Anonim Kullanıcı'
          : (review.user?.profile?.first_name && review.user?.profile?.last_name)
            ? `${review.user.profile.first_name} ${review.user.profile.last_name}`
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

      return res.json({
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
      return res.status(500).json({
        success: false,
        message: 'Yorumlar getirilemedi',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Diğer methodlar (respondToReview, markHelpful, updateVisibility, updateReview, deleteReview) aynı kalıyor...
  static async respondToReview(req, res) {
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
          message: 'Yorum bulunamadı veya size ait değil'
        });
      }

      await review.update({
        response_text: response_text.trim(),
        response_date: new Date()
      });

      console.log('✅ Yoruma yanıt verildi:', reviewId);

      return res.json({
        success: true,
        message: 'Yanıtınız başarıyla eklendi',
        response: {
          text: response_text.trim(),
          date: new Date()
        }
      });

    } catch (error) {
      console.error('❌ Yoruma yanıt verme hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Yanıt eklenirken hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async markHelpful(req, res) {
    try {
      const { reviewId } = req.params;
      const { helpful } = req.body;

      const review = await Review.findByPk(reviewId);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Yorum bulunamadı'
        });
      }

      const increment = helpful === true ? 1 : (helpful === false ? -1 : 0);
      const newCount = Math.max(0, review.helpful_count + increment);

      await review.update({
        helpful_count: newCount
      });

      return res.json({
        success: true,
        message: helpful ? 'Yorum faydalı olarak işaretlendi' : 'Faydalı işareti kaldırıldı',
        helpfulCount: newCount
      });

    } catch (error) {
      console.error('❌ Faydalı işaretleme hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'İşlem tamamlanamadı',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async updateVisibility(req, res) {
    try {
      const { reviewId } = req.params;
      const { is_visible } = req.body;
      const userId = req.user.user_id || req.user.id;

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

      return res.json({
        success: true,
        message: `Yorum ${is_visible ? 'görünür' : 'gizli'} olarak ayarlandı`
      });

    } catch (error) {
      console.error('❌ Görünürlük değiştirme hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'İşlem tamamlanamadı',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async updateReview(req, res) {
    try {
      const { reviewId } = req.params;
      const userId = req.user.user_id || req.user.id;
      const {
        rating,
        food_quality_rating,
        service_rating,
        value_rating,
        comment,
        is_anonymous
      } = req.body;

      console.log('✏️ Yorum güncelleniyor:', { reviewId, userId });

      const review = await Review.findOne({
        where: {
          review_id: reviewId,
          user_id: userId
        }
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Yorum bulunamadı veya size ait değil'
        });
      }

      const updateData = {};
      if (rating !== undefined) updateData.rating = parseInt(rating);
      if (food_quality_rating !== undefined) updateData.food_quality_rating = parseInt(food_quality_rating);
      if (service_rating !== undefined) updateData.service_rating = parseInt(service_rating);
      if (value_rating !== undefined) updateData.value_rating = parseInt(value_rating);
      if (comment !== undefined) updateData.comment = comment;
      if (is_anonymous !== undefined) updateData.is_anonymous = Boolean(is_anonymous);

      await review.update(updateData);

      console.log('✅ Yorum başarıyla güncellendi:', reviewId);

      return res.json({
        success: true,
        message: 'Yorumunuz başarıyla güncellendi'
      });

    } catch (error) {
      console.error('❌ Yorum güncelleme hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Yorum güncellenirken hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  static async deleteReview(req, res) {
    try {
      const { reviewId } = req.params;
      const userId = req.user.user_id || req.user.id;

      console.log('🗑️ Yorum siliniyor:', { reviewId, userId });

      const review = await Review.findOne({
        where: {
          review_id: reviewId,
          user_id: userId
        }
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Yorum bulunamadı veya size ait değil'
        });
      }

      await review.destroy();

      console.log('✅ Yorum başarıyla silindi:', reviewId);

      return res.json({
        success: true,
        message: 'Yorumunuz başarıyla silindi'
      });

    } catch (error) {
      console.error('❌ Yorum silme hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Yorum silinirken hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = ReviewController;