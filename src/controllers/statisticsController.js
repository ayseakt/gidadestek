
const { Op } = require('sequelize');
// ✅ DÜZELTME: Models/index.js'den import et
const { FoodPackage, Order, OrderItem, Seller, User } = require('../models');
const { sequelize } = require('../models');
// Genel istatistikleri getirme
const getGeneralStatistics = async (req, res) => {
  try {
    const sellerId = req.user.id;
    
    console.log('📊 İstatistik hesaplanıyor, seller_id:', sellerId);
    
    // ✅ DÜZELTME: Seller ID'yi doğrula ve hata durumunu kontrol et
    const seller = await Seller.findOne({
      where: { user_id: sellerId }
    });
    
    console.log('🔍 Seller sorgu sonucu:', seller ? seller.toJSON() : 'null');
    
    if (!seller) {
      console.log('❌ Satıcı profili bulunamadı, user_id:', sellerId);
      return res.status(404).json({
        success: false,
        message: 'Satıcı profili bulunamadı. Lütfen satıcı kaydınızı tamamlayın.'
      });
    }
    
    // ✅ DÜZELTME: seller_id kullan, id değil
    const actualSellerId = seller.seller_id || seller.id;
    console.log('🏪 Gerçek seller_id:', actualSellerId);
    
    // ✅ GÜVENLIK: actualSellerId'nin tanımlı olduğunu kontrol et
    if (!actualSellerId) {
      console.log('❌ Seller ID geçersiz:', actualSellerId);
      return res.status(500).json({
        success: false,
        message: 'Satıcı ID geçersiz'
      });
    }
    
    // Toplam paket sayısı
    const totalPackages = await FoodPackage.count({
      where: { seller_id: actualSellerId }
    });
    console.log('📦 Toplam paket:', totalPackages);
    
    // ✅ DÜZELTME: Order tablosundan doğru veri çek
    // Tamamlanan siparişlerden toplam miktar
    const completedOrders = await Order.findAll({
      where: { 
        seller_id: actualSellerId,
        order_status: 'completed'
      },
      include: [{
        model: OrderItem,
        as: 'items',
        required: false // LEFT JOIN
      }]
    });
    
    // Toplam teslim edilen porsiyon
    let savedPortions = 0;
    completedOrders.forEach(order => {
      if (order.items && order.items.length > 0) {
        savedPortions += order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      }
    });
    
    console.log('🥘 Kurtarılan yemek:', savedPortions);
    
    // Kazanılan toplam tutar - null kontrolü ekle
    const earnedAmount = await Order.sum('total_amount', {
      where: {
        seller_id: actualSellerId,
        payment_status: 'paid',
        total_amount: { [Op.not]: null } // null değerleri hariç tut
      }
    }) || 0;
    
    console.log('💰 Kazanılan tutar:', earnedAmount);
    
    // CO2 hesaplaması (her porsiyon için 3kg CO2 tasarrufu)
    const co2Reduction = savedPortions * 3;
    
    console.log('🌱 CO2 azaltımı:', co2Reduction);
    
    const statisticsData = {
      toplamPaket: totalPackages || 0,
      kurtarilanYemek: savedPortions || 0,
      kazanilanTutar: parseFloat(earnedAmount) || 0,
      azaltilanCO2: co2Reduction || 0
    };
    
    console.log('📊 Final istatistik verisi:', statisticsData);
    
    res.status(200).json({
      success: true,
      data: statisticsData
    });
    
  } catch (error) {
    console.error('❌ İstatistik getirme hatası:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'İstatistikler getirilirken bir hata oluştu',
      error: error.message
    });
  }
};

const getDetailedStatistics = async (req, res) => {
  try {
    const sellerId = req.user.id;
    
    console.log('📊 Detaylı istatistik hesaplanıyor, seller_id:', sellerId);
    
    // Seller ID'yi doğrula
    const seller = await Seller.findOne({
      where: { user_id: sellerId }
    });
    
    if (!seller) {
      console.log('❌ Satıcı profili bulunamadı veya ID geçersiz');
      return res.status(404).json({
        success: false,
        message: 'Satıcı profili bulunamadı'
      });
    }
    
    // ✅ DÜZELTME: seller_id kullan
    const actualSellerId = seller.seller_id || seller.id;
    console.log('🏪 Detaylı istatistik - seller_id:', actualSellerId);
    
    if (!actualSellerId) {
      console.log('❌ Seller ID geçersiz');
      return res.status(500).json({
        success: false,
        message: 'Seller ID geçersiz'
      });
    }
    
    // Toplam paket sayısı
    const toplamPaket = await FoodPackage.count({
      where: { seller_id: actualSellerId }
    });
    
    // Teslim edilen siparişler
    const teslimEdilen = await Order.count({
      where: { 
        seller_id: actualSellerId,
        order_status: 'completed'
      }
    });
    
    // İptal edilen siparişler
    const iptalEdilen = await Order.count({
      where: { 
        seller_id: actualSellerId,
        order_status: 'cancelled'
      }
    });
    
    // Teslim oranı
    const toplamSiparis = teslimEdilen + iptalEdilen;
    const teslimOrani = toplamSiparis > 0 ? ((teslimEdilen / toplamSiparis) * 100).toFixed(1) : 0;
    
    // Toplam kazanç - null kontrolü
    const toplamKazanc = await Order.sum('total_amount', {
      where: {
        seller_id: actualSellerId,
        payment_status: 'paid',
        total_amount: { [Op.not]: null }
      }
    }) || 0;
    
    // Ortalama fiyat hesaplama - null ve sıfır kontrolü
    const avgPriceResult = await FoodPackage.findOne({
      where: { 
        seller_id: actualSellerId,
        discounted_price: { [Op.not]: null }
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('discounted_price')), 'ortalama_fiyat']
      ]
    });
    
    // Ortalama indirim oranı - sıfır bölme kontrolü
    const avgDiscountResult = await FoodPackage.findOne({
      where: { 
        seller_id: actualSellerId,
        original_price: { [Op.gt]: 0 },
        discounted_price: { [Op.not]: null }
      },
      attributes: [
        [
          sequelize.fn('AVG', 
            sequelize.literal('((original_price - discounted_price) / original_price) * 100')
          ), 
          'ortalama_indirim'
        ]
      ]
    });
    
    // Kurtarılan porsiyon (tamamlanan siparişlerden)
    const completedOrders = await Order.findAll({
      where: { 
        seller_id: actualSellerId,
        order_status: 'completed'
      },
      include: [{
        model: OrderItem,
        as: 'items',
        required: false
      }]
    });
    
    let kurtarilanPorsiyon = 0;
    completedOrders.forEach(order => {
      if (order.items && order.items.length > 0) {
        kurtarilanPorsiyon += order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      }
    });
    
    // CO2 hesaplama (her porsiyon 3kg)
    const azaltilanCO2 = kurtarilanPorsiyon * 3;
    
    const detayliIstatistikler = {
      toplam_paket: toplamPaket || 0,
      teslim_edilen: teslimEdilen || 0,
      iptal_edilen: iptalEdilen || 0,
      teslim_orani: parseFloat(teslimOrani) || 0,
      toplam_kazanc: parseFloat(toplamKazanc) || 0,
      ortalama_fiyat: parseFloat(avgPriceResult?.dataValues?.ortalama_fiyat) || 0,
      ortalama_indirim: parseFloat(avgDiscountResult?.dataValues?.ortalama_indirim) || 0,
      kurtarilan_porsiyon: kurtarilanPorsiyon || 0,
      azaltilan_co2: azaltilanCO2 || 0
    };
    
    console.log('📊 Detaylı istatistikler:', detayliIstatistikler);
    
    res.status(200).json({
      success: true,
      data: detayliIstatistikler
    });
    
  } catch (error) {
    console.error('❌ Detaylı istatistik hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Detaylı istatistikler getirilirken bir hata oluştu',
      error: error.message
    });
  }
};

// Belirli dönem için istatistikler
const getPeriodStatistics = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { period } = req.params; // '7days', '30days', '3months', '1year', 'all'
    
    console.log('📅 Dönem istatistikleri istendi:', period);
    
    // Seller ID'yi doğrula
    const seller = await Seller.findOne({
      where: { user_id: sellerId }
    });
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Satıcı profili bulunamadı'
      });
    }
    
    // ✅ DÜZELTME: seller_id kullan
    const actualSellerId = seller.seller_id || seller.id;
    
    if (!actualSellerId) {
      return res.status(500).json({
        success: false,
        message: 'Seller ID geçersiz'
      });
    }
    
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
    
    console.log('📊 Tarih aralığı:', { startDate, endDate });
    
    // ✅ DÜZELTME: FoodPackage için doğru sorgular - null kontrol ekle
    const totalPackages = await FoodPackage.count({
      where: { 
        seller_id: actualSellerId,
        created_at: { [Op.between]: [startDate, endDate] }
      }
    });
    
    // Tamamlanan siparişler (Order tablosundan)
    const completedOrders = await Order.count({
      where: { 
        seller_id: actualSellerId,
        order_status: 'completed',
        created_at: { [Op.between]: [startDate, endDate] }
      }
    });
    
    // İptal edilen siparişler
    const canceledOrders = await Order.count({
      where: { 
        seller_id: actualSellerId,
        order_status: 'cancelled',
        created_at: { [Op.between]: [startDate, endDate] }
      }
    });
    
    const totalOrders = completedOrders + canceledOrders;
    const deliveryRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    
    const periodData = {
      paketler: {
        toplam: totalPackages,
        teslimEdilen: completedOrders,
        iptalEdilen: canceledOrders,
        teslimOrani: deliveryRate.toFixed(1)
      }
    };
    
    console.log('📊 Dönem verileri:', periodData);
    
    res.status(200).json({
      success: true,
      data: periodData
    });
    
  } catch (error) {
    console.error('❌ Dönem istatistikleri hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Dönem istatistikleri getirilirken bir hata oluştu',
      error: error.message
    });
  }
};

// Grafik verileri
const getChartData = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { type } = req.params; // 'daily', 'weekly', 'monthly'
    const { period } = req.query; // '30days', '3months', vb.
    
    console.log('📈 Grafik verisi istendi:', { type, period });
    
    // Seller ID'yi doğrula
    const seller = await Seller.findOne({
      where: { user_id: sellerId }
    });
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Satıcı profili bulunamadı'
      });
    }
    
    // ✅ DÜZELTME: seller_id kullan
    const actualSellerId = seller.seller_id || seller.id;
    
    if (!actualSellerId) {
      return res.status(500).json({
        success: false,
        message: 'Seller ID geçersiz'
      });
    }
    
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
    
    // ✅ DÜZELTME: SQL sorgusunu database tipine göre ayarla
    // PostgreSQL için DATE_TRUNC, MySQL için DATE_FORMAT kullan
    let query;
    if (sequelize.getDialect() === 'postgres') {
      query = `
        SELECT 
          DATE_TRUNC('${interval}', created_at) as time_interval,
          COUNT(*) as package_count,
          COALESCE(SUM(quantity_available), 0) as total_portions,
          COALESCE(SUM(discounted_price * quantity_available), 0) as total_amount
        FROM food_packages
        WHERE 
          seller_id = :sellerId AND
          created_at BETWEEN :startDate AND :endDate AND
          discounted_price IS NOT NULL AND
          quantity_available IS NOT NULL
        GROUP BY time_interval
        ORDER BY time_interval ASC
      `;
    } else {
      // MySQL için
      let mysqlFormat;
      switch(interval) {
        case 'day':
          mysqlFormat = '%Y-%m-%d';
          break;
        case 'week':
          mysqlFormat = '%Y-%u';
          break;
        case 'month':
          mysqlFormat = '%Y-%m';
          break;
        default:
          mysqlFormat = '%Y-%m-%d';
      }
      
      query = `
        SELECT 
          DATE_FORMAT(created_at, '${mysqlFormat}') as time_interval,
          COUNT(*) as package_count,
          COALESCE(SUM(quantity_available), 0) as total_portions,
          COALESCE(SUM(discounted_price * quantity_available), 0) as total_amount
        FROM food_packages
        WHERE 
          seller_id = :sellerId AND
          created_at BETWEEN :startDate AND :endDate AND
          discounted_price IS NOT NULL AND
          quantity_available IS NOT NULL
        GROUP BY time_interval
        ORDER BY time_interval ASC
      `;
    }
    
    const results = await sequelize.query(query, {
      replacements: { sellerId: actualSellerId, startDate, endDate },
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('📊 Grafik sonuçları:', results);
    
    res.status(200).json({
      success: true,
      data: results || []
    });
    
  } catch (error) {
    console.error('❌ Grafik verisi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Grafik verileri getirilirken bir hata oluştu',
      error: error.message
    });
  }
};
// Genel istatistikler
const getStatistics = async (req, res) => {
  try {
    const [data] = await sequelize.query('SELECT * FROM statistics_view');
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ success: false, message: 'İstatistikler alınamadı', error: err.message });
  }
};

// Haftalık satışlar
const getWeeklySales = async (req, res) => {
  try {
    const [data] = await sequelize.query('SELECT * FROM weekly_sales_view');
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Haftalık satışlar alınamadı', error: err.message });
  }
};

// Kategori dağılımı
const getCategoryDistribution = async (req, res) => {
  try {
    const [data] = await sequelize.query('SELECT * FROM category_distribution_view');
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Kategori dağılımı alınamadı', error: err.message });
  }
};

// Aylık trend
const getMonthlyTrend = async (req, res) => {
  try {
    const [data] = await sequelize.query('SELECT * FROM monthly_trend_view');
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Aylık trend alınamadı', error: err.message });
  }
};

// Saatlik dağılım
const getHourlyDistribution = async (req, res) => {
  try {
    const [data] = await sequelize.query('SELECT * FROM hourly_distribution_view');
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Saatlik dağılım alınamadı', error: err.message });
  }
};

module.exports = {
  getGeneralStatistics,
  getPeriodStatistics,
  getChartData,
  getDetailedStatistics,
  getStatistics,
  getWeeklySales,
  getCategoryDistribution,
  getMonthlyTrend,
  getHourlyDistribution
};