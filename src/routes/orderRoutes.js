// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { Order, OrderItem, OrderStatusHistory, FoodPackage, Seller, User } = require('../models');

// ✅ Sipariş oluşturma endpoint'i
router.post('/create', authMiddleware, async (req, res) => {
  const transaction = await Order.sequelize.transaction();
  
  try {
    const { 
      cartItems, 
      totalAmount, 
      paymentMethod, 
      deliveryAddress,
      customerNotes,
      estimatedPickupTime 
    } = req.body;

    const userId = req.user.id;

    console.log('🛒 Sipariş oluşturma başladı:', {
      userId,
      totalAmount,
      cartItemsCount: cartItems?.length || 0
    });

    // 1. Validasyonlar
    if (!cartItems || cartItems.length === 0) {
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

    if (!estimatedPickupTime) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Teslim alma zamanı giriniz'
      });
    }

    // 2. Pickup date ve time'ı ayır
    const pickupDateTime = new Date(estimatedPickupTime);
    const pickupDate = pickupDateTime.toISOString().split('T')[0]; // YYYY-MM-DD
    const pickupTime = pickupDateTime.toTimeString().split(' ')[0]; // HH:MM:SS

    // 3. Seller ID'yi belirle (ilk ürünün seller'ı)
    const firstPackage = await FoodPackage.findByPk(cartItems[0].package_id);
    if (!firstPackage) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    const sellerId = firstPackage.seller_id;

    // 4. Ana siparişi oluştur
    const order = await Order.create({
      user_id: userId,
      seller_id: sellerId,
      total_amount: totalAmount,
      order_status: 'pending',
      payment_status: 'pending',
      pickup_date: pickupDate,
      pickup_time: pickupTime,
      notes: customerNotes || null
    }, { transaction });

    console.log('✅ Ana sipariş oluşturuldu:', order.order_id);

    // 5. Sipariş detaylarını oluştur
    const orderItems = [];
    for (const item of cartItems) {
      const packageInfo = await FoodPackage.findByPk(item.package_id);
      
      if (!packageInfo) {
        console.warn(`⚠️ Package not found: ${item.package_id}`);
        continue;
      }

      const unitPrice = parseFloat(packageInfo.new_price || packageInfo.price || 0);
      const quantity = parseInt(item.quantity || 1);
      const totalPrice = unitPrice * quantity;

      const orderItem = await OrderItem.create({
        order_id: order.order_id,
        package_id: item.package_id,
        quantity: quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        item_status: 'ordered'
      }, { transaction });

      orderItems.push(orderItem);
      console.log(`✅ OrderItem oluşturuldu: ${orderItem.item_id} (Package: ${item.package_id})`);
    }

    // 6. İlk durum geçmişi kaydı
    await OrderStatusHistory.create({
      order_id: order.order_id,
      old_status: null,
      new_status: 'pending',
      changed_by: userId,
      notes: 'Sipariş oluşturuldu'
    }, { transaction });

    // 7. Transaction'ı commit et
    await transaction.commit();

    // 8. Ödeme işlemini simüle et
    let paymentSuccess = true;
    let paymentMessage = 'Ödeme başarılı';

    // Gerçek ödeme gateway entegrasyonu burada yapılacak
    if (paymentMethod === 'card') {
      // Kredi kartı işlemi
      paymentSuccess = Math.random() > 0.1; // %90 başarı oranı
    } else if (paymentMethod === 'paypal') {
      // PayPal işlemi
      paymentSuccess = Math.random() > 0.05; // %95 başarı oranı
    }

    // 9. Ödeme durumunu güncelle
    if (paymentSuccess) {
      await order.update({
        payment_status: 'completed',
        order_status: 'confirmed'
      });

      // Durum geçmişi güncelle
      await OrderStatusHistory.create({
        order_id: order.order_id,
        old_status: 'pending',
        new_status: 'confirmed',
        changed_by: userId,
        notes: 'Ödeme tamamlandı'
      });

      console.log('✅ Ödeme başarılı, sipariş onaylandı');
    } else {
      await order.update({
        payment_status: 'failed',
        order_status: 'cancelled'
      });

      paymentMessage = 'Ödeme işlemi başarısız oldu';
      console.log('❌ Ödeme başarısız, sipariş iptal edildi');
    }

    // 10. Başarılı response
    res.status(201).json({
      success: paymentSuccess,
      message: paymentSuccess ? 'Siparişiniz başarıyla oluşturuldu' : paymentMessage,
      orderId: order.order_id,
      trackingNumber: `SP${order.order_id.toString().padStart(6, '0')}`,
      orderStatus: order.order_status,
      paymentStatus: order.payment_status,
      totalAmount: order.total_amount,
      pickupDate: order.pickup_date,
      pickupTime: order.pickup_time,
      redirectUrl: '/orders' 
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Sipariş oluşturma hatası:', error);
    
    res.status(500).json({
      success: false,
      message: 'Sipariş oluşturulurken hata oluştu',
      error: error.message
    });
  }
});

// ✅ Kullanıcının siparişlerini getirme
router.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
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
              attributes: ['package_id', 'title', 'description', 'price', 'new_price', 'image_url']
            }
          ]
        },
        {
          model: Seller,
          as: 'seller',
          attributes: ['seller_id', 'store_name', 'phone', 'address']
        }
      ],
      order: [['order_date', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Veriyi frontend formatına dönüştür
    const formattedOrders = orders.rows.map(order => ({
      id: order.order_id,
      storeName: order.seller?.store_name || 'Bilinmeyen Mağaza',
      storeImage: 'https://via.placeholder.com/60', // Default image
      productName: order.items?.length > 0 ? order.items[0].package.title : 'Ürün',
      orderDate: order.order_date,
      pickupDate: `${order.pickup_date}T${order.pickup_time}`,
      address: order.seller?.address || 'Adres bilgisi yok',
      price: parseFloat(order.total_amount),
      originalPrice: parseFloat(order.total_amount) * 1.5, // Örnek indirim hesabı
      status: mapOrderStatus(order.order_status),
      items: order.items?.map(item => ({
        name: item.package.title,
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

// ✅ Sipariş detayını getirme
router.get('/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

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

// ✅ Sipariş iptal etme
router.patch('/:orderId/cancel', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

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

    // Sadece pending veya confirmed siparişler iptal edilebilir
    if (!['pending', 'confirmed'].includes(order.order_status)) {
      return res.status(400).json({
        success: false,
        message: 'Bu sipariş iptal edilemez'
      });
    }

    const oldStatus = order.order_status;

    // Siparişi iptal et
    await order.update({
      order_status: 'cancelled',
      cancellation_reason: reason || 'Kullanıcı tarafından iptal edildi'
    });

    // Sipariş detaylarını da iptal et
    await OrderItem.update(
      { item_status: 'cancelled' },
      { where: { order_id: orderId } }
    );

    // Durum geçmişi ekle
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

// ✅ Yardımcı fonksiyon: Order status'ları frontend formatına çevir
function mapOrderStatus(backendStatus) {
  const statusMap = {
    'pending': 'devam_ediyor',
    'confirmed': 'devam_ediyor',
    'ready': 'hazir',
    'completed': 'teslim_edildi',
    'cancelled': 'iptal_edildi'
  };
  
  return statusMap[backendStatus] || 'devam_ediyor';
}

module.exports = router;