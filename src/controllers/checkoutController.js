// controllers/checkoutController.js
const { CartItem, Order, OrderItem, FoodPackage, Seller, User } = require('../models');
const { Op } = require('sequelize');

const checkoutController = {
  // Sepeti sipariş olarak tamamla
  async checkout(req, res) {
    const transaction = await require('../models').sequelize.transaction();
    
    try {
      const userId = req.user.user_id;
      const { payment_method = 'cash', notes } = req.body;

      // Sepet öğelerini al
      const cartItems = await CartItem.findAll({
        where: { user_id: userId },
        include: [{
          model: FoodPackage,
          as: 'package',
          include: [{
            model: Seller,
            as: 'seller'
          }]
        }],
        transaction
      });

      if (cartItems.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Sepetiniz boş'
        });
      }

      // Stok kontrolü yap
      for (let item of cartItems) {
        const currentPackage = await FoodPackage.findByPk(item.package_id, { transaction });
        if (!currentPackage || currentPackage.quantity_available < item.quantity) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `${item.package.package_name} için yeterli stok yok`
          });
        }
      }

      // Toplam tutarı hesapla
      const totalAmount = cartItems.reduce((total, item) => {
        return total + (parseFloat(item.unit_price) * item.quantity);
      }, 0);

      // Sipariş numarası oluştur
      const orderNumber = `SP${Date.now()}${Math.floor(Math.random() * 1000)}`;

      // Siparişi oluştur
      const order = await Order.create({
        user_id: userId,
        order_number: orderNumber,
        total_amount: totalAmount.toFixed(2),
        payment_method,
        notes,
        order_status: 'confirmed',
        payment_status: payment_method === 'cash' ? 'pending' : 'paid'
      }, { transaction });

      // Sipariş öğelerini oluştur ve stokları güncelle
      const orderItems = [];
      
      for (let cartItem of cartItems) {
        // Pickup code oluştur (6 haneli)
        const pickupCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Sipariş öğesi oluştur
        const orderItem = await OrderItem.create({
          order_id: order.order_id,
          package_id: cartItem.package_id,
          seller_id: cartItem.package.seller_id,
          quantity: cartItem.quantity,
          unit_price: cartItem.unit_price,
          total_price: (parseFloat(cartItem.unit_price) * cartItem.quantity).toFixed(2),
          pickup_code: pickupCode
        }, { transaction });

        orderItems.push(orderItem);

        // Paket stokunu güncelle
        await FoodPackage.update(
          {
            quantity_available: cartItem.package.quantity_available - cartItem.quantity
          },
          {
            where: { package_id: cartItem.package_id },
            transaction
          }
        );
      }

      // Sepeti temizle
      await CartItem.destroy({
        where: { user_id: userId },
        transaction
      });

      await transaction.commit();

      // Sipariş detaylarını döndür
      const orderWithDetails = await Order.findByPk(order.order_id, {
        include: [{
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: FoodPackage,
              as: 'package'
            },
            {
              model: Seller,
              as: 'seller',
              attributes: ['store_name', 'phone', 'email']
            }
          ]
        }]
      });

      res.status(201).json({
        success: true,
        message: 'Sipariş başarıyla oluşturuldu',
        data: {
          order: orderWithDetails,
          orderNumber: orderNumber
        },
        redirectUrl: '/orders'
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Checkout hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Sipariş oluşturulurken hata oluştu',
        error: error.message
      });
    }
  },

  // Kullanıcının siparişlerini getir
  async getMyOrders(req, res) {
    try {
      const userId = req.user.user_id;
      const { status, limit = 20, offset = 0 } = req.query;

      const whereClause = { user_id: userId };
      if (status) {
        whereClause.order_status = status;
      }

      const orders = await Order.findAndCountAll({
        where: whereClause,
        include: [{
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: FoodPackage,
              as: 'package'
            },
            {
              model: Seller,
              as: 'seller',
              attributes: ['store_name', 'phone']
            }
          ]
        }],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.status(200).json({
        success: true,
        data: {
          orders: orders.rows,
          totalCount: orders.count,
          hasMore: (parseInt(offset) + parseInt(limit)) < orders.count
        }
      });

    } catch (error) {
      console.error('Siparişleri getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Siparişler getirilirken hata oluştu',
        error: error.message
      });
    }
  },

  // Sipariş detayını getir
  async getOrderDetails(req, res) {
    try {
      const userId = req.user.user_id;
      const { orderId } = req.params;

      const order = await Order.findOne({
        where: {
          order_id: orderId,
          user_id: userId
        },
        include: [{
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: FoodPackage,
              as: 'package'
            },
            {
              model: Seller,
              as: 'seller',
              attributes: ['store_name', 'phone', 'email']
            }
          ]
        }]
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Sipariş bulunamadı'
        });
      }

      res.status(200).json({
        success: true,
        data: order
      });

    } catch (error) {
      console.error('Sipariş detayı getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Sipariş detayı getirilirken hata oluştu',
        error: error.message
      });
    }
  },

  // Siparişi iptal et
  async cancelOrder(req, res) {
    try {
      const userId = req.user.user_id;
      const { orderId } = req.params;
      const { reason } = req.body;

      const order = await Order.findOne({
        where: {
          order_id: orderId,
          user_id: userId,
          order_status: ['pending', 'confirmed']
        },
        include: [{
          model: OrderItem,
          as: 'items'
        }]
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'İptal edilebilir sipariş bulunamadı'
        });
      }

      const transaction = await require('../models').sequelize.transaction();

      try {
        // Sipariş durumunu iptal et
        await order.update({
          order_status: 'cancelled',
          notes: order.notes ? `${order.notes}\n\nİptal nedeni: ${reason}` : `İptal nedeni: ${reason}`
        }, { transaction });

        // Stokları geri ver
        for (let item of order.items) {
          await FoodPackage.increment(
            'quantity_available',
            {
              by: item.quantity,
              where: { package_id: item.package_id },
              transaction
            }
          );
        }

        await transaction.commit();

        res.status(200).json({
          success: true,
          message: 'Sipariş başarıyla iptal edildi'
        });

      } catch (error) {
        await transaction.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Sipariş iptal hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Sipariş iptal edilirken hata oluştu',
        error: error.message
      });
    }
  }
};

module.exports = checkoutController;