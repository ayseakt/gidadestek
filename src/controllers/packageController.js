const {
  FoodPackage,
  PackageLocation,
  Seller
} = require('../models');

const multer = require('multer');
const upload = multer();

const createPackage = async (req, res) => {
  console.log('req.body:', req.body);

  const user_id = req.user?.user_id || req.user?.id;
  if (!user_id) {
    return res.status(400).json({ success: false, message: 'Kullanıcı bulunamadı (user_id yok)' });
  }

  try {
    const seller = await Seller.findOne({ where: { user_id } });
    if (!seller) {
      return res.status(400).json({ success: false, message: 'Satıcı kaydı bulunamadı!' });
    }

    const seller_id = seller.seller_id;

    const {
      package_name,
      original_price,
      discounted_price,
      quantity_available,
      pickup_start_time,
      pickup_end_time,
      description,
      category_id,
      location_id,
      latitude,
      longitude,
      address,
      available_from,
      available_until
    } = req.body;

    const processedLocationId = Array.isArray(location_id)
      ? location_id[0] || ''
      : location_id || '';

    const processedAvailableFrom = Array.isArray(available_from)
      ? available_from[0] || ''
      : available_from;

    const processedAvailableUntil = Array.isArray(available_until)
      ? available_until[0] || ''
      : available_until;

    let startDate = new Date();
    let endDate = new Date();
    endDate.setMonth(startDate.getMonth() + 1);

    if (processedAvailableFrom) {
      try {
        startDate = new Date(processedAvailableFrom);
      } catch (e) {
        console.error('available_from tarih dönüşüm hatası:', e);
      }
    }

    if (processedAvailableUntil) {
      try {
        endDate = new Date(processedAvailableUntil);
      } catch (e) {
        console.error('available_until tarih dönüşüm hatası:', e);
      }
    }

    const originalPriceNum = parseFloat(original_price) || 0;
    const discountedPriceNum = parseFloat(discounted_price) || 0;
    const quantityAvailableNum = parseInt(quantity_available, 10) || 1;

    const hasManualLocation = latitude && longitude;
    const hasSavedLocation = processedLocationId && processedLocationId !== '';

    const packageData = {
      seller_id,
      package_name: package_name || '',
      original_price: originalPriceNum,
      discounted_price: discountedPriceNum,
      quantity_available: quantityAvailableNum,
      pickup_start_time: pickup_start_time || null,
      pickup_end_time: pickup_end_time || null,
      description: description || '',
      category_id: category_id || null,
      available_from: startDate,
      available_until: endDate,
      is_active: 1 // ⭐ Yeni paketler aktif olarak oluşturulur
    };

    console.log('Oluşturulacak paket verisi:', packageData);

    const yeniPaket = await FoodPackage.create(packageData);

    if (hasManualLocation || hasSavedLocation) {
      const locationData = {
        package_id: yeniPaket.package_id,
        location_type: hasManualLocation ? 'manual' : 'saved',
        latitude: hasManualLocation ? parseFloat(latitude) : null,
        longitude: hasManualLocation ? parseFloat(longitude) : null,
        address: address || null
      };

      if (hasSavedLocation) {
        locationData.saved_location_id = parseInt(processedLocationId);
      }

      console.log('Oluşturulacak konum verisi:', locationData);

      try {
        await PackageLocation.create(locationData);
        console.log('Paket konum bilgisi başarıyla kaydedildi');
      } catch (locationError) {
        console.error('Konum kaydedilirken hata:', locationError);
      }
    }

    return res.status(201).json({
      success: true,
      data: yeniPaket,
      message: 'Paket başarıyla oluşturuldu'
    });

  } catch (error) {
    console.error('Paket oluşturma hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Paket oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
};

const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;

    const paket = await FoodPackage.findByPk(id, {
      include: [{
        model: PackageLocation,
        as: 'location',
        required: false
      }]
    });

    if (!paket) {
      return res.status(404).json({ success: false, message: 'Paket bulunamadı' });
    }

    res.status(200).json({ success: true, data: paket });
  } catch (error) {
    console.error('Paket detayı alınırken hata:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// ⭐ GÜNCELLEME: Sadece aktif paketleri getir
const getActivePackages = async (req, res) => {
  try {
    const user_id = req.user?.user_id || req.user?.id;
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }

    const seller = await Seller.findOne({ where: { user_id } });
    if (!seller) {
      return res.status(400).json({ success: false, message: 'Satıcı kaydı bulunamadı!' });
    }

    const packages = await FoodPackage.findAll({
      where: { 
        seller_id: seller.seller_id,
        is_active: 1 // ⭐ Sadece aktif paketler
      },
      include: [{
        model: PackageLocation,
        as: 'location',
        required: false
      }],
      order: [['created_at', 'DESC']]
    });

    console.log('Bulunan aktif paketler:', packages.length);
    res.status(200).json({ success: true, data: packages });
  } catch (error) {
    console.error('Aktif paketler alınırken hata:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
  }
};

// ⭐ GÜNCELLEME: Geçmişe sadece iptal edilenler dahil
const getPackageHistory = async (req, res) => {
  try {
    const user_id = req.user?.user_id || req.user?.id;
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }

    const seller = await Seller.findOne({ where: { user_id } });
    if (!seller) {
      return res.status(400).json({ success: false, message: 'Satıcı kaydı bulunamadı!' });
    }

    const packages = await FoodPackage.findAll({
      where: { 
        seller_id: seller.seller_id,
        is_active: 0 // ⭐ Sadece iptal edilmiş paketler (is_active = 0)
      },
      include: [{
        model: PackageLocation,
        as: 'location',
        required: false
      }],
      order: [['updated_at', 'DESC']] // ⭐ İptal tarihine göre sırala
    });

    console.log('Geçmiş paketler (iptal edilenler):', packages.length);
    res.status(200).json({ success: true, data: packages });
  } catch (error) {
    console.error('Paket geçmişi alınırken hata:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
  }
};

// ⭐ GÜNCELLEME: Tüm paketleri getir (aktif + iptal edilenler)
const getMyPackages = async (req, res) => {
  try {
    console.log('getMyPackages fonksiyonu çağırıldı');
    console.log('req.user:', req.user);
    
    const user_id = req.user?.user_id || req.user?.id;
    
    if (!user_id) {
      console.error('User ID bulunamadı:', req.user);
      return res.status(400).json({ 
        success: false, 
        message: 'Kullanıcı bulunamadı - user_id eksik',
        debug: { user: req.user }
      });
    }

    console.log('User ID:', user_id);

    // Seller kontrolü
    const seller = await Seller.findOne({ where: { user_id } });
    
    if (!seller) {
      console.error('Seller bulunamadı için user_id:', user_id);
      return res.status(400).json({ 
        success: false, 
        message: 'Satıcı kaydı bulunamadı!',
        debug: { user_id, seller: null }
      });
    }

    console.log('Seller bulundu:', seller.seller_id);

    // ⭐ GÜNCELLEME: Aktif paketleri getir (sadece is_active = 1 olanlar)
    let packages;
    try {
      packages = await FoodPackage.findAll({
        where: { 
          seller_id: seller.seller_id,
          is_active: 1 // ⭐ Sadece aktif paketler
        },
        include: [{
          model: PackageLocation,
          as: 'location',
          required: false
        }],
        order: [['created_at', 'DESC']]
      });
      
      console.log('Aktif paketler başarıyla alındı:', packages.length);
    } catch (includeError) {
      console.warn('Location include başarısız, temel paketler döndürülüyor:', includeError.message);
      
      // Include başarısız olsa bile temel paketleri döndür
      packages = await FoodPackage.findAll({
        where: { 
          seller_id: seller.seller_id,
          is_active: 1
        },
        order: [['created_at', 'DESC']]
      });
    }

    console.log('Kullanıcının aktif paketleri:', packages.length);
    
    return res.status(200).json({ 
      success: true, 
      data: packages,
      message: `${packages.length} aktif paket bulundu`
    });
    
  } catch (error) {
    console.error('getMyPackages hatası:', error);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Paketler alınırken hata oluştu', 
      error: error.message,
      debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ⭐ GÜNCELLEME: Paket silmek yerine is_active = 0 yap
const cancelPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user?.user_id || req.user?.id;

    if (!user_id) {
      return res.status(400).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }

    const seller = await Seller.findOne({ where: { user_id } });
    if (!seller) {
      return res.status(400).json({ success: false, message: 'Satıcı kaydı bulunamadı!' });
    }

    // Paketi bul ve kontrol et
    const package = await FoodPackage.findOne({
      where: { 
        package_id: id,
        seller_id: seller.seller_id,
        is_active: 1 // ⭐ Sadece aktif paketler iptal edilebilir
      }
    });

    if (!package) {
      return res.status(404).json({ 
        success: false, 
        message: 'Aktif paket bulunamadı veya size ait değil' 
      });
    }

    // ⭐ GÜNCELLEME: Paketi silmek yerine is_active = 0 yap
    await package.update({
      is_active: 0,
      updated_at: new Date()
    });

    console.log('Paket iptal edildi (is_active = 0):', id);
    res.status(200).json({ 
      success: true, 
      message: 'Paket başarıyla iptal edildi ve geçmişe taşındı' 
    });

  } catch (error) {
    console.error('Paket iptal edilirken hata:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Paket iptal edilirken hata oluştu',
      error: error.message
    });
  }
};

// ⭐ GÜNCELLEME: Sadece aktif paketler güncellenebilir
const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user?.user_id || req.user?.id;

    if (!user_id) {
      return res.status(400).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }

    const seller = await Seller.findOne({ where: { user_id } });
    if (!seller) {
      return res.status(400).json({ success: false, message: 'Satıcı kaydı bulunamadı!' });
    }

    // Paketi bul ve kontrol et
    const package = await FoodPackage.findOne({
      where: { 
        package_id: id,
        seller_id: seller.seller_id,
        is_active: 1 // ⭐ Sadece aktif paketler güncellenebilir
      }
    });

    if (!package) {
      return res.status(404).json({ 
        success: false, 
        message: 'Aktif paket bulunamadı veya size ait değil' 
      });
    }

    // Güncelleme verilerini al
    const {
      package_name,
      original_price,
      discounted_price,
      quantity_available,
      pickup_start_time,
      pickup_end_time,
      description,
      category_id,
      available_from,
      available_until
    } = req.body;

    // Paketi güncelle
    await package.update({
      package_name: package_name || package.package_name,
      original_price: parseFloat(original_price) || package.original_price,
      discounted_price: parseFloat(discounted_price) || package.discounted_price,
      quantity_available: parseInt(quantity_available) || package.quantity_available,
      pickup_start_time: pickup_start_time || package.pickup_start_time,
      pickup_end_time: pickup_end_time || package.pickup_end_time,
      description: description || package.description,
      category_id: category_id || package.category_id,
      available_from: available_from ? new Date(available_from) : package.available_from,
      available_until: available_until ? new Date(available_until) : package.available_until,
      updated_at: new Date()
    });

    console.log('Paket güncellendi:', id);
    
    // Güncellenmiş paketi döndür
    const updatedPackage = await FoodPackage.findByPk(id, {
      include: [{
        model: PackageLocation,
        as: 'location',
        required: false
      }]
    });

    res.status(200).json({ 
      success: true, 
      data: updatedPackage,
      message: 'Paket başarıyla güncellendi' 
    });

  } catch (error) {
    console.error('Paket güncellenirken hata:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Paket güncellenirken hata oluştu',
      error: error.message
    });
  }
};

module.exports = {
  createPackage,
  getPackageById,
  getActivePackages,
  getPackageHistory,
  getMyPackages,
  cancelPackage,
  updatePackage
};