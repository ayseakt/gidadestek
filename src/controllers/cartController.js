// controllers/cartController.js - DÜZELTME VERSİYONU
const { CartItem, FoodPackage, User, Seller, PackageLocation } = require('../models');
const { Op } = require('sequelize');

const cartController = {
  // Sepete ürün ekle
  async addToCart(req, res) {
    try {
      const userId = req.user.user_id;
      const { package_id, quantity = 1 } = req.body;

      console.log('Sepete ekleme isteği - RAW:', { userId, package_id, quantity, typeof_package_id: typeof package_id });

      // Package ID'yi integer'a çevir - DAHA GÜVENLİ KONTROL
      let packageIdInt;
      if (typeof package_id === 'string') {
        packageIdInt = parseInt(package_id, 10);
      } else if (typeof package_id === 'number') {
        packageIdInt = package_id;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Paket ID formatı geçersiz (string veya number olmalı)'
        });
      }

      if (isNaN(packageIdInt) || packageIdInt <= 0) {
        return res.status(400).json({
          success: false,
          message: `Geçersiz paket ID: ${package_id} -> ${packageIdInt}`
        });
      }

      console.log('Dönüştürülmüş Package ID:', packageIdInt);

      // Paketi kontrol et
      const foodPackage = await FoodPackage.findOne({
        where: { 
          package_id: packageIdInt,
          is_active: 1,
          quantity_available: { [Op.gte]: quantity }
        },
        include: [{
          model: Seller,
          as: 'seller'
        }]
      });

      if (!foodPackage) {
        return res.status(404).json({
          success: false,
          message: 'Paket bulunamadı veya stokta yok'
        });
      }

      // Kendi paketini satın alamaz kontrolü
      if (foodPackage.seller_id === userId) {
        return res.status(400).json({
          success: false,
          message: 'Kendi paketinizi sepete ekleyemezsiniz'
        });
      }

      // Sepette zaten var mı kontrol et
      const existingCartItem = await CartItem.findOne({
        where: {
          user_id: userId,
          package_id: packageIdInt
        }
      });

      if (existingCartItem) {
        return res.status(400).json({
          success: false,
          message: 'Bu ürün sepetinizde zaten mevcut',
          data: {
            alreadyInCart: true,
            currentQuantity: existingCartItem.quantity
          }
        });
      }

      // Yeni sepet öğesi oluştur
      const cartItem = await CartItem.create({
        user_id: userId,
        package_id: packageIdInt,
        quantity: quantity,
        unit_price: foodPackage.discounted_price || foodPackage.original_price
      });

      console.log('Sepete eklenen ürün:', cartItem.toJSON());

      res.status(201).json({
        success: true,
        message: 'Ürün sepete eklendi',
        data: cartItem
      });

    } catch (error) {
      console.error('Sepete ekleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Sepete eklenirken hata oluştu',
        error: error.message
      });
    }
  },

  // ⭐ DÜZELTİLDİ: Sepeti getir
  async getCart(req, res) {
    try {
      const userId = req.user.user_id;

      console.log('Sepet getirme isteği için kullanıcı ID:', userId);

      const cartItems = await CartItem.findAll({
        where: { user_id: userId },
        include: [
          {
            model: FoodPackage,
            as: 'package',
            required: true,
            include: [
              {
                model: Seller,
                as: 'seller',
                attributes: ['seller_id', 'business_name'],
                required: false
              }
            ]
          }
        ],
        order: [['added_at', 'DESC']]
      });

      console.log('Bulunan sepet öğeleri:', cartItems.length);

      // Location bilgilerini manuel olarak ekle
      const enrichedCartItems = [];
      for (const item of cartItems) {
        const itemJson = item.toJSON();
        
        try {
          const packageLocation = await PackageLocation.findOne({
            where: { package_id: item.package_id },
            attributes: ['location_id', 'address', 'district', 'city', 'latitude', 'longitude']
          });
          
          itemJson.package.location = packageLocation ? packageLocation.toJSON() : null;
        } catch (locationError) {
          console.warn('Package location alınamadı:', locationError.message);
          itemJson.package.location = null;
        }
        
        enrichedCartItems.push(itemJson);
      }

      // Toplam tutarı hesapla
      const totalAmount = enrichedCartItems.reduce((total, item) => {
        return total + (parseFloat(item.unit_price) * item.quantity);
      }, 0);

      const totalItems = enrichedCartItems.reduce((total, item) => {
        return total + item.quantity;
      }, 0);

      res.status(200).json({
        success: true,
        data: {
          items: enrichedCartItems,
          summary: {
            totalItems,
            totalAmount: parseFloat(totalAmount.toFixed(2)),
            itemCount: enrichedCartItems.length
          }
        }
      });

    } catch (error) {
      console.error('Sepet getirme hatası:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Sepet getirilirken hata oluştu',
        error: error.message
      });
    }
  },

  // Sepet öğesi güncelle
  async updateCartItem(req, res) {
    try {
      const userId = req.user.user_id;
      const { cart_item_id } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Geçerli bir miktar giriniz'
        });
      }

      const cartItem = await CartItem.findOne({
        where: {
          cart_item_id: cart_item_id,
          user_id: userId
        },
        include: [{
          model: FoodPackage,
          as: 'package'
        }]
      });

      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: 'Sepet öğesi bulunamadı'
        });
      }

      // Stok kontrolü
      if (quantity > cartItem.package.quantity_available) {
        return res.status(400).json({
          success: false,
          message: `Maksimum ${cartItem.package.quantity_available} adet ekleyebilirsiniz`
        });
      }

      cartItem.quantity = quantity;
      await cartItem.save();

      res.status(200).json({
        success: true,
        message: 'Sepet güncellendi',
        data: cartItem
      });

    } catch (error) {
      console.error('Sepet güncelleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Sepet güncellenirken hata oluştu',
        error: error.message
      });
    }
  },

  // ⭐ BÜYÜK DÜZELTME: Sepetten öğe sil
  async removeFromCart(req, res) {
    try {
      const { cart_item_id } = req.params;
      const userId = req.user.user_id;

      console.log(`[DEBUG] removeFromCart başladı:`);
      console.log(`- Kullanıcı ID: ${userId}`);
      console.log(`- Cart Item ID (raw): ${cart_item_id}`);
      console.log(`- Cart Item ID type: ${typeof cart_item_id}`);

      // ⭐ ID'yi güvenli şekilde dönüştür
      const cartItemIdInt = parseInt(cart_item_id, 10);
      
      if (isNaN(cartItemIdInt) || cartItemIdInt <= 0) {
        console.log(`[DEBUG] Geçersiz cart_item_id: ${cart_item_id} -> ${cartItemIdInt}`);
        return res.status(400).json({ 
          success: false, 
          message: 'Geçersiz sepet öğe ID formatı' 
        });
      }

      console.log(`[DEBUG] Dönüştürülmüş Cart Item ID: ${cartItemIdInt}`);

      // ⭐ ÖNCE KAYIT VAR MI KONTROL ET
      const existingCartItem = await CartItem.findOne({
        where: {
          cart_item_id: cartItemIdInt,
          user_id: userId
        }
      });

      console.log(`[DEBUG] Mevcut kayıt kontrolü:`, existingCartItem ? 'BULUNDU' : 'BULUNAMADI');

      if (!existingCartItem) {
        console.log(`[DEBUG] Silinecek ürün bulunamadı veya kullanıcıya ait değil`);
        return res.status(404).json({
          success: false,
          message: 'Silinecek ürün bulunamadı veya bu kullanıcıya ait değil'
        });
      }

      // ⭐ SİLME İŞLEMİ
      const deletedRows = await CartItem.destroy({
        where: {
          cart_item_id: cartItemIdInt,
          user_id: userId
        }
      });

      console.log(`[DEBUG] Silme işlemi tamamlandı. Silinen satır sayısı: ${deletedRows}`);

      if (deletedRows === 0) {
        console.log(`[DEBUG] Hiçbir satır silinmedi - Bu beklenmeyen bir durum`);
        return res.status(500).json({
          success: false,
          message: 'Silme işlemi başarısız oldu'
        });
      }

      console.log(`[DEBUG] Ürün başarıyla silindi!`);
      
      res.status(200).json({
        success: true,
        message: 'Ürün sepetten başarıyla silindi',
        data: {
          deletedCartItemId: cartItemIdInt,
          deletedRows: deletedRows
        }
      });

    } catch (error) {
      console.error('[DEBUG] Sepetten silme hatası:', error);
      console.error('[DEBUG] Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Sepetten silinirken hata oluştu',
        error: error.message
      });
    }
  },

  // ⭐ BÜYÜK DÜZELTME: Sepeti temizle
  async clearCart(req, res) {
    try {
      const userId = req.user.user_id;

      console.log(`[DEBUG] clearCart başladı. Kullanıcı ID: ${userId}`);

      // ⭐ ÖNCE KAÇ TANE KAYIT VAR KONTROL ET
      const cartItemCount = await CartItem.count({
        where: { user_id: userId }
      });

      console.log(`[DEBUG] Silinecek toplam ürün sayısı: ${cartItemCount}`);

      if (cartItemCount === 0) {
        console.log(`[DEBUG] Zaten sepet boş`);
        return res.status(200).json({
          success: true,
          message: 'Sepet zaten boş',
          data: { deletedCount: 0 }
        });
      }

      // ⭐ SİLME İŞLEMİ
      const deletedCount = await CartItem.destroy({
        where: { user_id: userId }
      });

      console.log(`[DEBUG] Sepet temizlendi. Silinen ürün sayısı: ${deletedCount}`);

      if (deletedCount === 0) {
        console.log(`[DEBUG] Hiçbir ürün silinemedi - Bu beklenmeyen bir durum`);
        return res.status(500).json({
          success: false,
          message: 'Sepet temizleme işlemi başarısız oldu'
        });
      }

      res.status(200).json({
        success: true,
        message: `Sepet başarıyla temizlendi (${deletedCount} ürün silindi)`,
        data: { deletedCount }
      });

    } catch (error) {
      console.error('[DEBUG] Sepet temizleme hatası:', error);
      console.error('[DEBUG] Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Sepet temizlenirken hata oluştu',
        error: error.message
      });
    }
  },

  // Sepet öğe sayısını getir
  async getCartCount(req, res) {
    try {
      const userId = req.user.user_id;

      console.log('Sepet sayısı getiriliyor, kullanıcı ID:', userId);

      const count = await CartItem.sum('quantity', {
        where: { user_id: userId }
      }) || 0;

      console.log('Sepet toplam ürün sayısı:', count);

      res.status(200).json({
        success: true,
        data: { count: count }
      });

    } catch (error) {
      console.error('Sepet sayısı getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Sepet sayısı alınamadı',
        error: error.message
      });
    }
  }
};

module.exports = cartController;