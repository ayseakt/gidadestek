// controllers/orderController.js
const { Order, OrderItem, User, Seller, FoodPackage, OrderStatusHistory } = require('../models');
const { Op } = require('sequelize');

const orderController = {
  // ✅ Sipariş oluşturma
  createOrder: async (req, res) => {
    try {
      console.log('📝 Yeni sipariş oluşturuluyor...', req.body);
      console.log('👤 User ID:', req.user.user_id);

      const { seller_id, items, pickup_time, pickup_date, notes, payment_method } = req.body;
      const user_id = req.user.user_id;

      // Validasyon
      if (!seller_id || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz sipariş bilgileri'
        });
      }

      // Toplam tutarı hesapla
      let total_amount = 0;
      const validatedItems = [];

      for (const item of items) {
        // Package bilgilerini al
        const package = await FoodPackage.findByPk(item.package_id);
        if (!package) {
          return res.status(400).json({
            success: false,
            message: `Paket bulunamadı: ${item.package_id}`
          });
        }

        const itemTotal = parseFloat(package.price) * parseInt(item.quantity);
        total_amount += itemTotal;

        validatedItems.push({
          package_id: item.package_id,
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(package.price),
          total_price: itemTotal
        });
      }

      // Siparişi oluştur
      const order = await Order.create({
        user_id,
        seller_id,
        total_amount,
        pickup_time,
        pickup_date,
        notes,
        order_status: 'pending',
        payment_status: 'pending',
        order_date: new Date()
      });

      // Sipariş öğelerini oluştur
      const orderItems = await Promise.all(
        validatedItems.map(item =>
          OrderItem.create({
            order_id: order.order_id,
            ...item
          })
        )
      );

      // İlk durum değişikliğini kaydet
      await OrderStatusHistory.create({
        order_id: order.order_id,
        old_status: null,
        new_status: 'pending',
        changed_by: user_id,
        notes: 'Sipariş oluşturuldu'
      });

      console.log('✅ Sipariş başarıyla oluşturuldu:', order.order_id);

      res.status(201).json({
        success: true,
        message: 'Sipariş başarıyla oluşturuldu',
        order: {
          id: order.order_id,
          order_id: order.order_id,
          total_amount: order.total_amount,
          status: order.order_status,
          pickup_date: order.pickup_date,
          pickup_time: order.pickup_time
        }
      });

    } catch (error) {
      console.error('❌ Sipariş oluşturma hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Sipariş oluşturulurken hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },
 testAssociations: async (req, res) => {
    try {
      console.log('🔍 ASSOCIATION TEST BAŞLIYOR...');
      
      // 1. Order modelini kontrol et
      console.log('📦 Order associations:', Object.keys(Order.associations || {}));
      
      // 2. Seller modelini kontrol et  
      console.log('🏪 Seller associations:', Object.keys(Seller.associations || {}));
      
      // 3. Basit bir Order query'si test et
      const testOrder = await Order.findOne({
        include: [
          {
            model: Seller,
            as: 'seller',
            required: false
          }
        ],
        limit: 1
      });
      
      if (testOrder) {
        console.log('✅ Test order bulundu:', {
          order_id: testOrder.order_id,
          seller_id: testOrder.seller_id,
          seller_data: testOrder.seller ? 'VAR' : 'YOK'
        });
      } else {
        console.log('❌ Hiç order bulunamadı');
      }
      
      // 4. Seller'ları kontrol et
      const sellers = await Seller.findAll({ limit: 3 });
      console.log('🏪 Toplam seller sayısı:', sellers.length);
      sellers.forEach(seller => {
        console.log(`Seller ${seller.seller_id}: ${seller.business_name}`);
      });
      
      res.json({
        success: true,
        message: 'Association test tamamlandı',
        data: {
          orderAssociations: Object.keys(Order.associations || {}),
          sellerAssociations: Object.keys(Seller.associations || {}),
          testOrderFound: !!testOrder,
          sellerCount: sellers.length
        }
      });
      
    } catch (error) {
      console.error('❌ Association test hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Association test başarısız',
        error: error.message
      });
    }
  },

  // 📋 DÜZELTME: Basitleştirilmiş getMyOrders
  getMyOrders: async (req, res) => {
    try {
      console.log('📋 Kullanıcı siparişleri getiriliyor...', req.user.user_id);

      // 🔍 ADIM 1: Önce sadece Order'ları çek
      const orders = await Order.findAll({
        where: {
          user_id: req.user.user_id
        },
        order: [['order_date', 'DESC']],
        raw: false // ÖNEMLİ: raw mode kapalı
      });

      console.log('📦 Bulunan sipariş sayısı:', orders.length);

      if (orders.length === 0) {
        return res.json({
          success: true,
          orders: [],
          message: 'Hiç sipariş bulunamadı'
        });
      }

      // 🔍 ADIM 2: Her sipariş için ayrı ayrı seller bilgilerini çek
      const enrichedOrders = [];

      for (const order of orders) {
        console.log(`\n🔍 Sipariş ${order.order_id} işleniyor...`);
        console.log('- Seller ID:', order.seller_id);

        // Seller bilgilerini ayrı query ile çek
        let seller = null;
        if (order.seller_id) {
          try {
            seller = await Seller.findByPk(order.seller_id, {
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['full_name', 'phone', 'email'],
                  required: false
                }
              ]
            });
            
            if (seller) {
              console.log('✅ Seller bulundu:', {
                seller_id: seller.seller_id,
                business_name: seller.business_name,
                address: seller.address,
                hasUser: !!seller.user
              });
            } else {
              console.log('❌ Seller bulunamadı, seller_id:', order.seller_id);
            }
          } catch (sellerError) {
            console.error('❌ Seller query hatası:', sellerError.message);
          }
        }

        // OrderItem'ları ayrı query ile çek
        let items = [];
        try {
          items = await OrderItem.findAll({
            where: { order_id: order.order_id },
            include: [
              {
                model: FoodPackage,
                as: 'package',
                attributes: ['package_id', 'name', 'description', 'price', 'image_url'],
                required: false
              }
            ]
          });
          console.log(`✅ ${items.length} adet item bulundu`);
        } catch (itemError) {
          console.error('❌ OrderItem query hatası:', itemError.message);
        }

        // Seller name belirleme
        let sellerName = 'İş Yeri Adı Belirtilmemiş';
        if (seller?.business_name) {
          sellerName = seller.business_name;
        } else if (seller?.user?.full_name) {
          sellerName = seller.user.full_name;
        }

        // Enriched order objesi oluştur
        enrichedOrders.push({
          id: order.order_id,
          storeName: sellerName,
          storeImage: '/api/placeholder-store.jpg',
          productName: items.map(item => item.package?.name).filter(Boolean).join(', ') || 'Ürün Bilgisi Yok',
          price: parseFloat(order.total_amount),
          originalPrice: parseFloat(order.total_amount),
          orderDate: order.order_date,
          pickupDate: order.pickup_date && order.pickup_time ? 
                     `${order.pickup_date} ${order.pickup_time}` : 
                     'Tarih Belirtilmemiş',
          address: seller?.address || 'Adres Belirtilmemiş',
          status: order.order_status,
          items: items.map(item => ({
            name: item.package?.name || 'Ürün Adı Yok',
            quantity: item.quantity || 0,
            price: parseFloat(item.unit_price || 0)
          })),
          confirmationCode: order.confirmationCode || order.order_id.toString().padStart(6, '0'),
          trackingNumber: `SPY${order.order_id.toString().padStart(8, '0')}`,
          
          // DEBUG bilgileri
          debug: {
            seller_id: order.seller_id,
            sellerFound: !!seller,
            sellerBusinessName: seller?.business_name,
            itemCount: items.length
          }
        });

        console.log(`✅ Sipariş ${order.order_id} işlendi: ${sellerName}`);
      }

      console.log(`✅ Toplam ${enrichedOrders.length} sipariş işlendi`);

      res.json({
        success: true,
        orders: enrichedOrders
      });

    } catch (error) {
      console.error('❌ Siparişleri getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Siparişler getirilemedi',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },
  // 🔍 Belirli bir siparişin detayını getirme
getOrderById: async (req, res) => {
  try {
    const { orderId } = req.params;
    const user_id = req.user.user_id;

    console.log('🔍 Sipariş detayı getiriliyor:', orderId, 'User:', user_id);

    const order = await Order.findOne({
      where: {
        order_id: orderId,
        user_id: user_id
      },
      include: [
        {
          model: Seller,
          as: 'seller',
          attributes: ['seller_id', 'business_name', 'phone'],
          // Satıcının user bilgilerini de çek
          include: [
            {
              model: User,
              as: 'user', // Seller modelinde User ile olan association alias'ı
              attributes: ['phone', 'email', 'full_name']
            }
          ]
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: FoodPackage,
              as: 'package',
              attributes: ['package_id', 'name', 'description', 'price', 'image_url']
            }
          ]
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

    // Satıcı telefon numarasını belirle (önce seller tablosundan, yoksa user tablosundan)
    const sellerPhone = order.seller.phone || 
                       (order.seller.user ? order.seller.user.phone : null);

    // Frontend formatına dönüştür - EKSİK BİLGİLER EKLENDİ
    const formattedOrder = {
      id: order.order_id,
      storeName: order.seller.business_name,
      storeImage: '/api/placeholder-store.jpg',
      productName: order.items.map(item => item.package.name).join(', '),
      price: parseFloat(order.total_amount), // ✅ SİPARİŞ TUTARI
      totalAmount: parseFloat(order.total_amount), // ✅ Alternatif alan adı
      orderDate: order.order_date,
      pickupDate: `${order.pickup_date} ${order.pickup_time}`,
      address: order.seller.address,
      status: order.order_status,
      
      // ✅ SATICI BİLGİLERİ EKLENDİ
      seller: {
        name: order.seller.business_name,
        phone: sellerPhone, // ✅ SATICI TELEFON NUMARASI
        address: order.seller.address,
        email: order.seller.user ? order.seller.user.email : null
      },
      
      items: order.items.map(item => ({
        name: item.package.name,
        quantity: item.quantity,
        price: parseFloat(item.unit_price),
        totalPrice: parseFloat(item.total_price) // Ürün toplam fiyatı
      })),
      
      confirmationCode: order.order_id.toString().padStart(6, '0'),
      trackingNumber: `SPY${order.order_id.toString().padStart(8, '0')}`,
      statusHistory: order.statusHistory,
      
      // ✅ EK BİLGİLER
      notes: order.notes,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method
    };

    console.log('✅ Sipariş detayı başarıyla getirildi:', {
      orderId: order.order_id,
      storeName: order.seller.business_name,
      totalAmount: order.total_amount,
      sellerPhone: sellerPhone
    });

    res.json({
      success: true,
      order: formattedOrder
    });

  } catch (error) {
    console.error('❌ Sipariş detayı getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş detayı getirilemedi',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
},

  // ❌ Sipariş iptal etme
  cancelOrder: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { reason = 'Kullanıcı tarafından iptal edildi' } = req.body;
      const user_id = req.user.user_id;

      console.log('❌ Sipariş iptal ediliyor:', orderId, 'Sebep:', reason);

      const order = await Order.findOne({
        where: {
          order_id: orderId,
          user_id: user_id
        }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Sipariş bulunamadı'
        });
      }

      // Sadece pending veya confirmed durumundaki siparişler iptal edilebilir
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
        cancellation_reason: reason
      });

      // Durum değişikliğini kaydet
      await OrderStatusHistory.create({
        order_id: orderId,
        old_status: oldStatus,
        new_status: 'cancelled',
        changed_by: user_id,
        notes: reason
      });

      console.log('✅ Sipariş başarıyla iptal edildi:', orderId);

      res.json({
        success: true,
        message: 'Sipariş başarıyla iptal edildi'
      });

    } catch (error) {
      console.error('❌ Sipariş iptal etme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Sipariş iptal edilirken hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // 📊 Sipariş durumunu güncelleme (satıcı için)
  updateOrderStatus: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status, notes } = req.body;
      const user_id = req.user.user_id;

      const validStatuses = ['pending', 'confirmed', 'ready', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz durum'
        });
      }

      const order = await Order.findByPk(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Sipariş bulunamadı'
        });
      }

      const oldStatus = order.order_status;

      await order.update({
        order_status: status
      });

      // Durum değişikliğini kaydet
      await OrderStatusHistory.create({
        order_id: orderId,
        old_status: oldStatus,
        new_status: status,
        changed_by: user_id,
        notes: notes || `Durum ${oldStatus}'dan ${status}'a değiştirildi`
      });

      res.json({
        success: true,
        message: 'Sipariş durumu güncellendi'
      });

    } catch (error) {
      console.error('❌ Sipariş durumu güncelleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Sipariş durumu güncellenemedi',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // 📈 Sipariş geçmişi getirme
  getOrderHistory: async (req, res) => {
    try {
      const user_id = req.user.user_id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const { count, rows: orders } = await Order.findAndCountAll({
        where: {
          user_id: user_id
        },
        include: [
          {
            model: Seller,
            as: 'seller',
            attributes: ['seller_id', 'business_name']
          },
          {
            model: OrderItem,
            as: 'items',
            include: [
              {
                model: FoodPackage,
                as: 'package',
                attributes: ['name', 'price']
              }
            ]
          }
        ],
        order: [['order_date', 'DESC']],
        limit,
        offset
      });

      const formattedOrders = orders.map(order => ({
        id: order.order_id,
        storeName: order.seller.business_name,
        totalAmount: parseFloat(order.total_amount),
        status: order.order_status,
        orderDate: order.order_date,
        itemCount: order.items.length
      }));

      res.json({
        success: true,
        orders: formattedOrders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalOrders: count,
          hasNext: page < Math.ceil(count / limit),
          hasPrev: page > 1
        }
      });

    } catch (error) {
      console.error('❌ Sipariş geçmişi getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Sipariş geçmişi getirilemedi',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = orderController;