// routes/orderRoutes.js - UPDATED VERSION WITH CONFIRMATION CODE LOGIC
const { 
  Order, 
  OrderItem, 
  OrderStatusHistory, 
  FoodPackage, 
  Seller, 
  User, 
  UserProfile, // ✅ EKLE
  OrderLog, 
  PackageLocation 
} = require('../models');

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');


// ✅ YARDIMCI FONKSİYONLAR - EN ÜSTTE TANIMLANMIŞ

// Benzersiz onay kodu oluşturma fonksiyonu
async function ensureUniqueCode(OrderModel) {
  let isUnique = false;
  let confirmationCode;
  
  while (!isUnique) {
    // 6 haneli rastgele kod oluştur (harfler ve rakamlar)
    confirmationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Bu kodun daha önce kullanılıp kullanılmadığını kontrol et
    const existingOrder = await OrderModel.findOne({
      where: { confirmationCode: confirmationCode }
    });
    
    if (!existingOrder) {
      isUnique = true;
    }
  }
  
  return confirmationCode;
}

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

// Onay kodu üretme (basit versiyon)
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
          attributes: ['package_id', 'package_name', 'description', 'original_price', 'discounted_price', 'location_id'],
          include: [
            {
              model: PackageLocation,
              as: 'location',
              attributes: ['address', 'latitude', 'longitude']
            }
          ]
        }
      ]
    },
    {
      model: User,
      as: 'user',
      attributes: ['user_id', 'email', 'phone_number'],
      include: [
        {
          model: UserProfile,
          as: 'profile', // ✅ DEĞİŞTİRİLDİ: 'profile' -> 'UserProfile'
          attributes: [ 'first_name', 'last_name']
        }
      ]
    }
  ],
  order: [['order_date', 'DESC']],
  limit: parseInt(limit),
  offset: (parseInt(page) - 1) * parseInt(limit)
});


    console.log(`✅ ${orders.count} sipariş bulundu`);

    // 3. Frontend'in beklediği formata çevir
const formattedOrders = orders.rows.map(order => {
  const firstItem = order.items?.[0];
  const packageInfo = firstItem?.package;

  // ✅ DÜZELTİLDİ: UserProfile alias'ı değiştirildi
  const userName = order.user?.UserProfile?.name || 
                   (order.user?.UserProfile?.first_name && order.user?.UserProfile?.last_name 
                     ? `${order.user.UserProfile.first_name} ${order.user.UserProfile.last_name}`
                     : order.user?.email?.split('@')[0] || 'Müşteri');

  return {
    id: order.order_id,
    UserName: userName,
    UserPhone: order.user?.phone_number || null,
    productName: packageInfo?.package_name || 'Ürün',
    description: packageInfo?.description || '',
    price: parseFloat(order.total_amount),
    orderDate: order.order_date,
    pickupDate: order.pickup_date && order.pickup_time ? 
      `${order.pickup_date}T${order.pickup_time}` : null,
    address: firstItem?.package?.location?.address || order.delivery_address || 'Mağazadan alınacak',
    status: mapBackendToFrontendStatus(order.order_status),
    specialRequests: order.notes || null,
    estimatedTime: calculateEstimatedTime(order.order_status, order.order_date),
    confirmationCode: order.confirmationCode || null,
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

// ✅ GÜNCELLENEN: Sipariş durumu güncelleme endpoint'i (ONAY KODU LOGİĞİ İLE)
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
  },
  include: [
    {
      model: User,
      as: 'user',
      attributes: ['user_id', 'phone_number'],
      include: [
        {
          model: UserProfile,
          as: 'profile', // ✅ DEĞİŞTİRİLDİ: 'profile' -> 'UserProfile'
          attributes: [ 'first_name', 'last_name']
        }
      ]
    },
    {
      model: Seller,
      as: 'seller',
      attributes: ['seller_id', 'business_name']
    }
  ]
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

    // 🔑 ONAY KODU OLUŞTURMA LOGİĞİ (İLK DOSYADAN)
    let updateData = {
      order_status: backendStatus,
      updated_at: new Date()
    };

    // Sipariş onaylandığında onay kodu oluştur
    if (backendStatus === 'confirmed' && !order.confirmationCode) {
      const confirmationCode = await ensureUniqueCode(Order);
      updateData.confirmationCode = confirmationCode;
      updateData.codeGeneratedAt = new Date();
      
      console.log(`🔐 Sipariş #${orderId} için onay kodu oluşturuldu: ${confirmationCode}`);
    }

    // Teslim edildi durumunda doğrulama
    if (backendStatus === 'completed') {
      if (!order.confirmationCode) {
        return res.status(400).json({
          success: false,
          message: 'Bu siparişte onay kodu bulunmuyor'
        });
      }
      
      updateData.deliveredAt = new Date();
      updateData.deliveredBy = userId;
    }

    // 4. Siparişi güncelle
    const oldStatus = order.order_status;
    await order.update(updateData);

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

    // 7. Güncellenen siparişi yeniden getir
    const updatedOrder = await Order.findByPk(orderId, {
      include: [
        { model: User, as: 'user', attributes: ['user_id',  'phone_number'] },
        { model: Seller, as: 'seller', attributes: ['seller_id', 'business_name'] }
      ]
    });

    console.log('✅ Sipariş durumu güncellendi:', { orderId, oldStatus, newStatus: backendStatus });

    res.json({
      success: true,
      message: 'Sipariş durumu başarıyla güncellendi',
      order: updatedOrder,
      orderId: orderId,
      oldStatus: mapBackendToFrontendStatus(oldStatus),
      newStatus: status,
      confirmationCode: updatedOrder.confirmationCode,
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

// ✅ YENİ: Onay kodu ile teslim doğrulama endpoint'i (İLK DOSYADAN)
router.post('/:orderId/verify-delivery', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { enteredCode } = req.body;
    const userId = req.user.user_id || req.user.id;

    console.log('🔍 Teslim doğrulama:', { orderId, enteredCode });

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

    const order = await Order.findOne({
      where: {
        order_id: orderId,
        seller_id: seller.seller_id
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    if (order.order_status !== 'ready') {
      return res.status(400).json({
        success: false,
        message: 'Bu sipariş henüz hazır durumda değil'
      });
    }

    // Onay kodu doğrulama
    if (enteredCode.trim().toUpperCase() !== order.confirmationCode.toUpperCase()) {
      // Başarısız denemeyi logla (eğer OrderLog modeli varsa)
      try {
        await OrderLog.create({
          orderId: orderId,
          action: 'DELIVERY_ATTEMPT_FAILED',
          details: {
            enteredCode: enteredCode,
            expectedCode: order.confirmationCode,
            attemptedBy: userId,
            timestamp: new Date()
          }
        });
      } catch (logError) {
        console.warn('⚠️ OrderLog kayıt edilemedi:', logError.message);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Onay kodu yanlış'
      });
    }

    // Başarılı teslim
    await order.update({
      order_status: 'completed',
      deliveredAt: new Date(),
      deliveredBy: userId
    });

    // OrderItem'ları da güncelle
    await OrderItem.update(
      { item_status: 'completed' },
      { where: { order_id: orderId } }
    );

    // Durum geçmişi kaydet
    await OrderStatusHistory.create({
      order_id: orderId,
      old_status: 'ready',
      new_status: 'completed',
      changed_by: userId,
      notes: 'Onay kodu ile teslim edildi'
    });

    // Başarılı teslimi logla (eğer OrderLog modeli varsa)
    try {
      await OrderLog.create({
        orderId: orderId,
        action: 'DELIVERED_SUCCESSFULLY',
        details: {
          confirmationCode: order.confirmationCode,
          deliveredBy: userId,
          deliveredAt: new Date()
        }
      });
    } catch (logError) {
      console.warn('⚠️ OrderLog kayıt edilemedi:', logError.message);
    }

    console.log('✅ Sipariş başarıyla teslim edildi:', orderId);

    res.json({
      success: true,
      message: 'Sipariş başarıyla teslim edildi',
      order: order
    });

  } catch (error) {
    console.error('❌ Teslim doğrulama hatası:', error);
    res.status(500).json({
      success: false,
      message: error.message
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
      UserNotes,
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
      notes: UserNotes || null,
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

    console.log('🚀 Müşteri siparişleri getiriliyor:', { userId, page, limit, status });

    // User ID kontrol
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Kullanıcı kimliği bulunamadı' 
      });
    }

    // Where clause oluştur
    const whereClause = { user_id: userId };
    if (status && status !== 'all') {
      whereClause.order_status = status;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // ✅ ÖNCE BASIT SORGU - DEBUG İÇİN
    console.log('🔍 Debug: Basit sorgu yapılıyor...');
    const simpleTest = await Order.findAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: 'items',
          required: false,
          include: [
            {
              model: FoodPackage, 
              as: 'package',
              required: false,
              attributes: ['package_id', 'package_name', 'description', 'original_price', 'discounted_price']
            }
          ]
        }
      ],
      limit: 3,
      logging: console.log // SQL'i göster
    });

    console.log('🔍 Basit test sonuç:', {
      count: simpleTest.length,
      firstOrderItems: simpleTest[0]?.items?.length || 0,
      firstPackage: simpleTest[0]?.items?.[0]?.package ? {
        id: simpleTest[0].items[0].package.package_id,
        name: simpleTest[0].items[0].package.package_name,
        price: simpleTest[0].items[0].package.discounted_price
      } : 'PACKAGE NULL'
    });

    // ✅ ASIL SORGU - seller_id dahil edildi
    const orders = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: 'items',
          required: false,
          include: [
            {
              model: FoodPackage, 
              as: 'package',
              required: false,
              attributes: [
                'package_id', 
                'package_name', 
                'description', 
                'original_price', 
                'discounted_price',
                'location_id'
              ]
            }
          ]
        },
        { 
          model: Seller, 
          as: 'seller',
          required: false,
          attributes: ['seller_id', 'business_name'] 
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['order_date', 'DESC']]
    });

    console.log(`📦 ${orders.count} sipariş bulundu`);
    
    // ✅ DETAYLI DEBUG
    if (orders.rows.length > 0) {
      const firstOrder = orders.rows[0];
      console.log('🔍 İlk sipariş detayı:', {
        orderId: firstOrder.order_id,
        sellerId: firstOrder.seller?.seller_id || 'NULL', // ✅ seller_id debug
        sellerName: firstOrder.seller?.business_name || 'NULL',
        itemsCount: firstOrder.items?.length || 0,
        firstItem: firstOrder.items?.[0] ? {
          packageId: firstOrder.items[0].package_id,
          packageExists: !!firstOrder.items[0].package,
          packageName: firstOrder.items[0].package?.package_name || 'NULL',
          unitPrice: firstOrder.items[0].unit_price,
          totalPrice: firstOrder.items[0].total_price,
          quantity: firstOrder.items[0].quantity
        } : 'NO ITEMS'
      });
    }

    // ✅ DÜZELTİLMİŞ: Frontend'in beklediği format - seller_id eklendi
    const formattedOrders = orders.rows.map(order => {
      // Items kontrolü
      console.log(`🔍 Order ${order.order_id} formatlanıyor:`, {
        itemsLength: order.items?.length || 0,
        hasItems: !!(order.items && order.items.length > 0),
        sellerId: order.seller?.seller_id || 'NULL' // ✅ seller_id debug
      });

      // İlk item'ı al (sipariş ismi için)
      const firstItem = order.items?.[0];
      const packageInfo = firstItem?.package;
      
      // Her item için debug
      if (order.items) {
        order.items.forEach((item, index) => {
          console.log(`  📦 Item ${index}:`, {
            packageId: item.package_id,
            hasPackage: !!item.package,
            packageName: item.package?.package_name || 'NULL',
            unitPrice: item.unit_price,
            totalPrice: item.total_price,
            quantity: item.quantity
          });
        });
      }

      // Adres bilgisini al - Geçici olarak basit
      const address = order.delivery_address || 'Mağazadan alınacak';

      // Sipariş durumunu frontend formatına çevir
      const frontendStatus = mapBackendToFrontendStatus(order.order_status);

      const formattedOrder = {
        // ✅ SİPARİŞ NUMARASI - Her iki format da
        orderId: order.order_id,
        order_id: order.order_id, // ✅ Frontend için eklendi
        orderNumber: `SP${order.order_id.toString().padStart(6, '0')}`,
        
        // ✅ SİPARİŞ İSMİ - NULL kontrolü ile
        orderName: (() => {
          if (!order.items || order.items.length === 0) {
            return 'Ürün bilgisi bulunamadı';
          }
          
          const firstName = packageInfo?.package_name;
          if (!firstName) {
            return 'Ürün adı bulunamadı';
          }
          
          return order.items.length === 1 
            ? firstName
            : `${firstName} ve ${order.items.length - 1} diğer ürün`;
        })(),

        // ✅ ADRES BİLGİSİ
        address: address,
        pickupAddress: address,
        
        // ✅ SİPARİŞ DURUMU
        status: frontendStatus,
        statusText: getStatusText(frontendStatus),
        
        // ✅ FİYAT BİLGİLERİ - Daha güvenli
        totalAmount: parseFloat(order.total_amount || 0),
        formattedPrice: `${parseFloat(order.total_amount || 0).toFixed(2)} ₺`,
        
        // ✅ SATICI BİLGİLERİ - seller_id eklendi
        sellerId: order.seller?.seller_id || null, // ✅ BURADA EKLENDİ
        seller: order.seller?.business_name || 'Satıcı Bulunamadı',
        sellerPhone: order.seller?.phone_number || null,
        
        // Diğer bilgiler
        orderDate: order.order_date || order.createdAt,
        pickupDate: order.pickup_date,
        pickupTime: order.pickup_time,
        estimatedTime: calculateEstimatedTime(order.order_status, order.order_date),
        confirmationCode: order.confirmationCode || null,
        
        // ✅ ITEMS DETAYİ - NULL kontrolü ile
        items: order.items?.map(item => {
          const unitPrice = parseFloat(item.unit_price || 0);
          const quantity = parseInt(item.quantity || 1);
          const totalPrice = parseFloat(item.total_price || unitPrice * quantity);
          
          return {
            packageId: item.package_id,
            packageName: item.package?.package_name || `Ürün #${item.package_id}`,
            description: item.package?.description || '',
            quantity: quantity,
            unitPrice: unitPrice,
            totalPrice: totalPrice,
            formattedUnitPrice: `${unitPrice.toFixed(2)} ₺`,
            formattedTotalPrice: `${totalPrice.toFixed(2)} ₺`,
            originalPrice: parseFloat(item.package?.original_price || 0),
            discountedPrice: parseFloat(item.package?.discounted_price || unitPrice),
            hasDiscount: item.package?.original_price && item.package?.discounted_price && 
                        parseFloat(item.package.original_price) > parseFloat(item.package.discounted_price)
          };
        }) || [],
        
        itemsCount: order.items?.length || 0,
        lastUpdated: order.updated_at || order.order_date
      };

      console.log(`✅ Order ${order.order_id} formatlandı:`, {
        orderId: formattedOrder.orderId,
        order_id: formattedOrder.order_id, // ✅ Debug için eklendi
        orderName: formattedOrder.orderName,
        totalAmount: formattedOrder.totalAmount,
        itemsCount: formattedOrder.itemsCount,
        sellerId: formattedOrder.sellerId, // ✅ seller_id debug
        firstItemName: formattedOrder.items[0]?.packageName || 'NONE'
      });

      return formattedOrder;
    });

    console.log('✅ Formatlanmış siparişler hazır:', {
      ordersCount: formattedOrders.length,
      firstOrder: formattedOrders[0] ? {
        orderId: formattedOrders[0].orderId,
        order_id: formattedOrders[0].order_id, // ✅ Debug için eklendi
        orderNumber: formattedOrders[0].orderNumber,
        orderName: formattedOrders[0].orderName,
        address: formattedOrders[0].address,
        status: formattedOrders[0].status,
        sellerId: formattedOrders[0].sellerId // ✅ seller_id debug
      } : null
    });

    return res.json({
      success: true,
      orders: formattedOrders,
      totalCount: orders.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(orders.count / parseInt(limit)),
      message: orders.count === 0 ? 'Henüz siparişiniz bulunmuyor' : null
    });

  } catch (error) {
    console.error('❌ Müşteri siparişleri hatası:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Siparişler getirilemedi',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ✅ YARDIMCI FONKSİYON: Durum metinleri
function getStatusText(status) {
  const statusTexts = {
    'yeni': 'Yeni Sipariş',
    'onaylandi': 'Onaylandı',
    'hazirlaniyor': 'Hazırlanıyor',
    'hazir': 'Hazır',
    'teslim_edildi': 'Teslim Edildi',
    'iptal_edildi': 'İptal Edildi',
    'reddedildi': 'Reddedildi'
  };
  
  return statusTexts[status] || 'Bilinmeyen Durum';
}
function getStatusText(status) {
  const statusTexts = {
    'yeni': 'Yeni Sipariş',
    'onaylandi': 'Onaylandı',
    'hazirlaniyor': 'Hazırlanıyor',
    'hazir': 'Hazır',
    'teslim_edildi': 'Teslim Edildi',
    'iptal_edildi': 'İptal Edildi',
    'reddedildi': 'Reddedildi'
  };
  
  return statusTexts[status] || 'Bilinmeyen Durum';
}
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

module.exports = router;