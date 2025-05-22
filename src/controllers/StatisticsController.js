const { sequelize } = require('../config/db');
const { Op } = require('sequelize');
const FoodPackage = require('../models/FoodPackage');
const Order = require('../models/Order');

// Genel istatistikleri getirme
exports.getGeneralStatistics = async (req, res) => {
  try {
    const sellerId = req.user.id;
    
    // Toplam paket sayısı
    const totalPackages = await FoodPackage.count({
      where: { seller_id: sellerId }
    });
    
    // Teslim edilen toplam porsiyon sayısı
    const savedPortions = await Order.sum('quantity', {
      where: { 
        seller_id: sellerId,
        order_status: 'completed'
      }
    });
    
    // Kazanılan toplam tutar
    const earnedAmount = await Order.sum('total_amount', {
      where: {
        seller_id: sellerId,
        payment_status: 'paid'
      }
    });
    
    // Çevresel etki (örnek hesaplama - gerçek senaryoya göre değiştirilmeli)
    // Her porsiyon başına 3kg CO2 tasarrufu gibi bir katsayı kullanıldı
    const co2Reduction = savedPortions * 3;
    
    res.status(200).json({
      success: true,
      data: {
        toplamPaket: totalPackages || 0,
        kurtarilanYemek: savedPortions || 0,
        kazanilanTutar: earnedAmount || 0,
        azaltilanCO2: co2Reduction || 0
      }
    });
  } catch (error) {
    console.error('İstatistik getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İstatistikler getirilirken bir hata oluştu',
      error: error.message
    });
  }
};

// Belirli dönem için istatistikler
exports.getPeriodStatistics = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { period } = req.params; // '7days', '30days', '3months', '1year', 'all'
    
    let startDate;
    const endDate = new Date();
    
    // Dönem başlangıç tarihini hesapla
    switch(period) {
      case '7days':
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30days':
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '3months':
        startDate = new Date(endDate);
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case '1year':
        startDate = new Date(endDate);
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date(0); // Unix epoch başlangıcı, tüm zamanlar
    }
    
    // İstatistikleri belirli dönem için hesapla
    // Bu örnekte sadece temel istatistikleri getiriyoruz, detaylı istatistikler için genişletebilirsiniz
    
    // Paket istatistikleri
    const totalPackages = await FoodPackage.count({
      where: { 
        seller_id: sellerId,
        created_at: { [Op.between]: [startDate, endDate] }
      }
    });
    
    const completedPackages = await FoodPackage.count({
      where: { 
        seller_id: sellerId,
        created_at: { [Op.between]: [startDate, endDate] },
        is_active: false,
        order_status: 'completed'
      }
    });
    
    const canceledPackages = await FoodPackage.count({
      where: { 
        seller_id: sellerId,
        created_at: { [Op.between]: [startDate, endDate] },
        is_active: false,
        order_status: 'canceled'
      }
    });
    
    const deliveryRate = totalPackages > 0 ? (completedPackages / totalPackages) * 100 : 0;
    
    res.status(200).json({
      success: true,
      data: {
        paketler: {
          toplam: totalPackages,
          teslimEdilen: completedPackages,
          iptalEdilen: canceledPackages,
          teslimOrani: deliveryRate.toFixed(1)
        },
        // Diğer istatistik grupları...
      }
    });
  } catch (error) {
    console.error('Dönem istatistikleri hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Dönem istatistikleri getirilirken bir hata oluştu',
      error: error.message
    });
  }
};

// Grafik verileri
exports.getChartData = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { type } = req.params; // 'daily', 'weekly', 'monthly'
    const { period } = req.query; // '30days', '3months', vb.
    
    // Grafik verilerini hesapla
    // Bu örnek basitleştirilmiş - gerçek uygulamada daha karmaşık sorgular gerekebilir
    
    let interval, startDate, endDate = new Date();
    
    // Dönem ve aralığı belirle
    if (period === '30days') {
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 30);
      interval = 'day';
    } else if (period === '3months') {
      startDate = new Date(endDate);
      startDate.setMonth(endDate.getMonth() - 3);
      interval = 'week';
    } else {
      startDate = new Date(endDate);
      startDate.setFullYear(endDate.getFullYear() - 1);
      interval = 'month';
    }
    
    // SQL ile tarih aralıklarında gruplandırma örneği
    // Bu kısım veritabanınıza ve ORM'inize göre değişiklik gösterebilir
    const results = await sequelize.query(`
      SELECT 
        DATE_TRUNC('${interval}', created_at) as time_interval,
        COUNT(*) as package_count,
        SUM(quantity_available) as total_portions,
        SUM(discounted_price * quantity_available) as total_amount
      FROM food_packages
      WHERE 
        seller_id = :sellerId AND
        created_at BETWEEN :startDate AND :endDate
      GROUP BY time_interval
      ORDER BY time_interval ASC
    `, {
      replacements: { sellerId, startDate, endDate },
      type: sequelize.QueryTypes.SELECT
    });
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Grafik verisi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Grafik verileri getirilirken bir hata oluştu',
      error: error.message
    });
  }
};