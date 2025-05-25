// routes/orderRoutes.js - UPDATED VERSION WITH INCOMING ORDERS
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { Order, OrderItem, OrderStatusHistory, FoodPackage, Seller, User } = require('../models');

// ✅ YENİ: Satıcıya gelen siparişler endpoint'i
router.get('/incoming-orders', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    console.log('📋 Satıcıya gelen siparişler getiriliyor:', { userId, page, limit, status });

    // 1. Önce bu user'ın satıcı olup olmadığını kontrol et
    const seller = await Seller.findOne({
      where: { user_id: userId }
    });

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için satıcı yetkisi gereklidir'
      });
    }

    console.log('✅ Satıcı bulundu:', seller.seller_id);

    // 2. Bu satıcıya ait siparişleri getir
    const whereClause = { seller_id: seller.seller_id };
    if (status && status !== 'all') {
      whereClause.order_status = status;
    }

    const orders = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: FoodPackage,
              as: 'package',
              attributes: ['package_id', 'package_name', 'description', 'original_price', 'discounted_price', 'image_url']
            }
          ]
        },
        {
          model: User,
          as: 'customer', // Order model'inde customer ilişkisi tanımlanmalı
          attributes: ['user_id', 'name', 'email', 'phone']
        }
      ],
      order: [['order_date', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    console.log(`✅ ${orders.count} sipariş bulundu`);

    // 3. Frontend'in beklediği formata çevir
    const formattedOrders = orders.rows.map(order => {
      // İlk item'dan ürün bilgisini al (çoğu siparişte tek ürün olur)
      const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
      const packageInfo = firstItem?.package;

      return {
        id: order.order_id,
        customerName: order.customer?.name || 'Müşteri',
        customerPhone: order.customer?.phone || null,
        productName: packageInfo?.package_name || 'Ürün',
        description: packageInfo?.description || '',
        price: parseFloat(order.total_amount),
        orderDate: order.order_date,
        pickupDate: order.pickup_date && order.pickup_time ? 
          `${order.pickup_date}T${order.pickup_time}` : null,
        address: order.delivery_address || 'Mağazadan alınacak',
        status: mapBackendToFrontendStatus(order.order_status),
        specialRequests: order.notes || null,
        estimatedTime: calculateEstimatedTime(order.order_status, order.order_date),
        confirmationCode: generateConfirmationCode(order.order_id),
        lastUpdated: order.updated_at || order.order_date,
        items: order.items?.map(item => ({
          name: item.package?.package_name || 'Ürün',
          quantity: item.quantity,
          price: parseFloat(item.unit_price),
          totalPrice: parseFloat(item.total_price)
        })) || []
      };
    });

    res.json({
      success: true,
      orders: formattedOrders,
      totalCount: orders.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(orders.count / parseInt(limit))
    });

  } catch (error) {
    console.error('❌ Gelen siparişler getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Gelen siparişler getirilemedi',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ✅ YENİ: Sipariş durumu güncelleme endpoint'i (satıcı için)
router.patch('/:orderId/status', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, reason, updatedBy } = req.body;
    const userId = req.user.user_id || req.user.id;

    console.log('🔄 Sipariş durumu güncelleniyor:', { orderId, status, reason, updatedBy });

    // 1. Satıcı kontrolü
    const seller = await Seller.findOne({
      where: { user_id: userId }
    });

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için satıcı yetkisi gereklidir'
      });
    }

    // 2. Siparişi bul ve satıcının siparişi olduğunu kontrol et
    const order = await Order.findOne({
      where: {
        order_id: orderId,
        seller_id: seller.seller_id
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı veya bu siparişe erişim yetkiniz yok'
      });
    }

    // 3. Durum geçişinin geçerli olup olmadığını kontrol et
    const validTransitions = {
      'pending': ['confirmed', 'cancelled', 'rejected'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready', 'cancelled'],
      'ready': ['completed', 'cancelled'],
      'completed': [], // Tamamlanan sipariş değiştirilemez
      'cancelled': [], // İptal edilen sipariş değiştirilemez
      'rejected': [] // Reddedilen sipariş değiştirilemez
    };

    const frontendToBackendStatus = {
      'yeni': 'pending',
      'onaylandi': 'confirmed',
      'hazirlaniyor': 'preparing',
      'hazir': 'ready',
      'teslim_edildi': 'completed',
      'iptal_edildi': 'cancelled',
      'reddedildi': 'rejected'
    };

    const backendStatus = frontendToBackendStatus[status] || status;
    const currentStatus = order.order_status;

    if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(backendStatus)) {
      return res.status(400).json({
        success: false,
        message: `Sipariş durumu ${currentStatus}'dan ${backendStatus}'ya değiştirilemez`
      });
    }

    // 4. Siparişi güncelle
    const oldStatus = order.order_status;
    await order.update({
      order_status: backendStatus,
      updated_at: new Date()
    });

    // 5. Durum geçmişi kaydet
    await OrderStatusHistory.create({
      order_id: orderId,
      old_status: oldStatus,
      new_status: backendStatus,
      changed_by: userId,
      notes: reason || `Satıcı tarafından ${status} olarak güncellendi`
    });

    // 6. OrderItem'ları da güncelle
    await OrderItem.update(
      { item_status: backendStatus },
      { where: { order_id: orderId } }
    );

    console.log('✅ Sipariş durumu güncellendi:', { orderId, oldStatus, newStatus: backendStatus });

    res.json({
      success: true,
      message: 'Sipariş durumu başarıyla güncellendi',
      orderId: orderId,
      oldStatus: mapBackendToFrontendStatus(oldStatus),
      newStatus: status,
      updatedAt: new Date()
    });

  } catch (error) {
    console.error('❌ Sipariş durum güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş durumu güncellenirken hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ✅ Sipariş oluşturma endpoint'i - MODEL UYUMLU (ESKİ KOD)
router.post('/create', authMiddleware, async (req, res) => {
  const transaction = await Order.sequelize.transaction();
  
  try {
    const { 
      trackingNumber,
      totalAmount, 
      paymentMethod, 
      deliveryAddress,
      customerNotes,
      estimatedPickupTime,
      items,
      isSimulation,
      transactionId,
      confirmationCode,
      authorizationCode,
      status,
      estimatedReadyTime
    } = req.body;

    const userId = req.user.user_id || req.user.id;

    console.log('🛒 Sipariş oluşturma başladı:', {
      userId,
      totalAmount,
      itemsCount: items?.length || 0,
      trackingNumber
    });

    // 1. Validasyonlar
    if (!items || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Sepetinizde ürün bulunmuyor'
      });
    }

    if (!totalAmount || totalAmount <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir toplam tutar giriniz'
      });
    }

    // 2. İlk paketten seller_id'yi al
    const firstPackage = await FoodPackage.findByPk(items[0].package_id);
    if (!firstPackage) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    const sellerId = firstPackage.seller_id;

    // 3. Pickup date ve time'ı ayır veya default değer oluştur
    let pickupDate, pickupTime;
    if (estimatedPickupTime) {
      const pickupDateTime = new Date(estimatedPickupTime);
      pickupDate = pickupDateTime.toISOString().split('T')[0];
      pickupTime = pickupDateTime.toTimeString().split(' ')[0];
    } else {
      const defaultTime = new Date(Date.now() + 30 * 60 * 1000);
      pickupDate = defaultTime.toISOString().split('T')[0];
      pickupTime = defaultTime.toTimeString().split(' ')[0];
    }

    // 4. Order model'e uyumlu ana sipariş oluştur
    const order = await Order.create({
      user_id: userId,
      seller_id: sellerId,
      total_amount: totalAmount,
      order_status: 'pending', // Yeni siparişler pending olarak başlar
      payment_status: 'completed',
      pickup_date: pickupDate,
      pickup_time: pickupTime,
      notes: customerNotes || null,
      delivery_address: deliveryAddress || null
    }, { transaction });

    console.log('✅ Ana sipariş oluşturuldu:', order.order_id);

    // 5. Sipariş detaylarını oluştur
    const orderItems = [];
    for (const item of items) {
      const packageInfo = await FoodPackage.findByPk(item.package_id);
      
      if (!packageInfo) {
        console.warn(`⚠️ Package not found: ${item.package_id}`);
        continue;
      }

      const unitPrice = parseFloat(item.unit_price || packageInfo.discounted_price || packageInfo.original_price || 0);
      const quantity = parseInt(item.quantity || 1);
      const totalPrice = unitPrice * quantity;

      const orderItem = await OrderItem.create({
        order_id: order.order_id,
        package_id: item.package_id,
        seller_id: packageInfo.seller_id,
        quantity: quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        pickup_code: Math.floor(100000 + Math.random() * 900000).toString()
      }, { transaction });

      orderItems.push(orderItem);
      console.log(`✅ OrderItem oluşturuldu: ${orderItem.order_item_id || 'ID pending'}`);
    }

    // 6. İlk durum geçmişi kaydı
    await OrderStatusHistory.create({
      order_id: order.order_id,
      old_status: null,
      new_status: order.order_status,
      changed_by: userId,
      notes: 'Sipariş oluşturuldu'
    }, { transaction });

    // 7. Transaction'ı commit et
    await transaction.commit();

    console.log('✅ Sipariş başarıyla oluşturuldu');

    // 8. Response format
    res.status(201).json({
      success: true,
      message: 'Siparişiniz başarıyla oluşturuldu',
      orderId: order.order_id,
      trackingNumber: trackingNumber || `TRK${order.order_id}${Date.now()}`,
      orderStatus: order.order_status,
      paymentStatus: order.payment_status,
      totalAmount: order.total_amount,
      pickupDate: order.pickup_date,
      pickupTime: order.pickup_time,
      confirmationCode: confirmationCode,
      transactionId: transactionId,
      estimatedReadyTime: estimatedReadyTime
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Sipariş oluşturma hatası:', error);
    
    res.status(500).json({
      success: false,
      message: 'Sipariş oluşturulurken hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ✅ Müşteri siparişleri endpoint'i (ESKİ KOD)
router.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    console.log('📋 Siparişler getiriliyor:', { userId, page, limit, status });

    const whereClause = { user_id: userId };
    if (status && status !== 'all') {
      whereClause.order_status = status;
    }

    const orders = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: FoodPackage,
              as: 'package',
              attributes: ['package_id', 'package_name', 'description', 'original_price', 'discounted_price']
            }
          ]
        },
        {
          model: Seller,
          as: 'seller',
          attributes: ['seller_id', 'business_name']
        }
      ],
      order: [['order_date', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    const formattedOrders = orders.rows.map(order => ({
      id: order.order_id,
      storeName: order.seller?.business_name || 'Bilinmeyen Mağaza',
      storeImage: 'https://via.placeholder.com/60',
      productName: order.items?.length > 0 ? order.items[0].package?.package_name : 'Ürün',
      orderDate: order.order_date,
      pickupDate: `${order.pickup_date}T${order.pickup_time}`,
      address: order.seller?.address || 'Adres bilgisi yok',
      price: parseFloat(order.total_amount),
      originalPrice: parseFloat(order.total_amount) * 1.2,
      status: mapBackendToFrontendStatus(order.order_status),
      trackingNumber: `TRK${order.order_id}${Date.now()}`,
      confirmationCode: Math.floor(100000 + Math.random() * 900000),
      items: order.items?.map(item => ({
        name: item.package?.package_name || 'Ürün',
        quantity: item.quantity,
        price: parseFloat(item.total_price)
      })) || []
    }));

    res.json({
      success: true,
      orders: formattedOrders,
      totalCount: orders.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(orders.count / parseInt(limit))
    });

  } catch (error) {
    console.error('❌ Siparişler getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Siparişler getirilemedi',
      error: error.message
    });
  }
});

// Diğer endpoint'ler (ESKİ KOD)
router.get('/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.user_id || req.user.id;

    const order = await Order.findOne({
      where: {
        order_id: orderId,
        user_id: userId
      },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: FoodPackage,
              as: 'package'
            }
          ]
        },
        {
          model: Seller,
          as: 'seller'
        },
        {
          model: OrderStatusHistory,
          as: 'statusHistory',
          order: [['changed_at', 'ASC']]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    res.json({
      success: true,
      order: order
    });

  } catch (error) {
    console.error('❌ Sipariş detay hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş detayı getirilemedi',
      error: error.message
    });
  }
});

router.patch('/:orderId/cancel', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user.user_id || req.user.id;

    const order = await Order.findOne({
      where: {
        order_id: orderId,
        user_id: userId
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    if (!['pending', 'confirmed'].includes(order.order_status)) {
      return res.status(400).json({
        success: false,
        message: 'Bu sipariş iptal edilemez'
      });
    }

    const oldStatus = order.order_status;

    await order.update({
      order_status: 'cancelled',
      cancellation_reason: reason || 'Kullanıcı tarafından iptal edildi'
    });

    await OrderItem.update(
      { item_status: 'cancelled' },
      { where: { order_id: orderId } }
    );

    await OrderStatusHistory.create({
      order_id: orderId,
      old_status: oldStatus,
      new_status: 'cancelled',
      changed_by: userId,
      notes: reason || 'Kullanıcı tarafından iptal edildi'
    });

    res.json({
      success: true,
      message: 'Sipariş başarıyla iptal edildi'
    });

  } catch (error) {
    console.error('❌ Sipariş iptal hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş iptal edilemedi',
      error: error.message
    });
  }
});

// ✅ YARDIMCI FONKSİYONLAR

// Backend durumlarını frontend durumlarına çevirme
function mapBackendToFrontendStatus(backendStatus) {
  const statusMap = {
    'pending': 'yeni',
    'confirmed': 'onaylandi',
    'preparing': 'hazirlaniyor',
    'ready': 'hazir',
    'completed': 'teslim_edildi',
    'cancelled': 'iptal_edildi',
    'rejected': 'reddedildi'
  };
  
  return statusMap[backendStatus] || 'yeni';
}

// Tahmini süre hesaplama
function calculateEstimatedTime(status, orderDate) {
  switch (status) {
    case 'pending':
      return 15; // Onay bekliyor, tahmini 15 dk
    case 'confirmed':
      return 20; // Onaylandı, tahmini 20 dk
    case 'preparing':
      return 10; // Hazırlanıyor, tahmini 10 dk kaldı
    case 'ready':
      return 0; // Hazır
    default:
      return null;
  }
}

// Onay kodu üretme
function generateConfirmationCode(orderId) {
  // OrderID'den 6 haneli kod üret
  const seed = orderId.toString();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString().substr(0, 6).padStart(6, '0');
}

module.exports = router;