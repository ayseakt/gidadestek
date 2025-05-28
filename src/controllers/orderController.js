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

  // 📋 Kullanıcının siparişlerini getirme
  getMyOrders: async (req, res) => {
    try {
      console.log('📋 Kullanıcı siparişleri getiriliyor...', req.user.user_id);

      const orders = await Order.findAll({
        where: {
          user_id: req.user.user_id
        },
        include: [
         {
            model: User,
            as: 'user' // ✅ DOĞRU: Order modelindeki alias ile aynı
          },
          {
            model: Seller,
            as: 'seller',
            attributes: ['seller_id', 'business_name', 'address', 'phone']
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
          }
        ],
        order: [['order_date', 'DESC']]
      });

      // Frontend'in beklediği formata dönüştür
      const formattedOrders = orders.map(order => ({
        id: order.order_id,
        storeName: order.seller.business_name,
        storeImage: '/api/placeholder-store.jpg', // Placeholder
        productName: order.items.map(item => item.package.name).join(', '),
        price: parseFloat(order.total_amount),
        originalPrice: parseFloat(order.total_amount),
        orderDate: order.order_date,
        pickupDate: `${order.pickup_date} ${order.pickup_time}`,
        address: order.seller.address,
        status: order.order_status,
        items: order.items.map(item => ({
          name: item.package.name,
          quantity: item.quantity,
          price: parseFloat(item.unit_price)
        })),
        confirmationCode: order.order_id.toString().padStart(6, '0'),
        trackingNumber: `SPY${order.order_id.toString().padStart(8, '0')}`
      }));

      console.log('✅ Siparişler başarıyla getirildi:', formattedOrders.length, 'adet');

      res.json({
        success: true,
        orders: formattedOrders
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
            attributes: ['seller_id', 'business_name', 'address', 'phone']
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

      // Frontend formatına dönüştür
      const formattedOrder = {
        id: order.order_id,
        storeName: order.seller.business_name,
        storeImage: '/api/placeholder-store.jpg',
        productName: order.items.map(item => item.package.name).join(', '),
        price: parseFloat(order.total_amount),
        orderDate: order.order_date,
        pickupDate: `${order.pickup_date} ${order.pickup_time}`,
        address: order.seller.address,
        status: order.order_status,
        items: order.items.map(item => ({
          name: item.package.name,
          quantity: item.quantity,
          price: parseFloat(item.unit_price)
        })),
        confirmationCode: order.order_id.toString().padStart(6, '0'),
        trackingNumber: `SPY${order.order_id.toString().padStart(8, '0')}`,
        statusHistory: order.statusHistory
      };

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
            attributes: ['seller_id', 'business_name', 'address']
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