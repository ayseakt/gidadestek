const {
  FoodPackage,
  PackageLocation,
  Seller,
  PackageImage,
} = require('../models');
const path = require('path');
// Eğer Category modeli yoksa, models'dan dinamik olarak al
const models = require('../models');
const Category = models.Category || models.PackageCategory; // Her iki ismi de dene
const fs = require('fs');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/packages';
    // Klasör yoksa oluştur
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Dosya adını unique yap
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'package-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const fileFilter = (req, file, cb) => {
  // Sadece resim dosyalarına izin ver
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Sadece resim dosyaları yüklenebilir!'), false);
  }
};
const uploadConfig = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maksimum 5 resim
  }
});
const packageIncludesWithCategory = [
  {
    model: Seller,
    as: 'seller',
    attributes: ['seller_id', 'user_id', 'business_name']
  },
  {
    model: PackageLocation, 
    as: 'location',
    required: false
  }
];

// Category modeli varsa include'a ekle
if (Category) {
  packageIncludesWithCategory.push({
    model: Category,
    as: 'category',
    required: false
  });
}

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
      is_active: 1
    };

    console.log('Oluşturulacak paket verisi:', packageData);

 const result = await models.sequelize.transaction(async (t) => {
      // Paketi oluştur
      const yeniPaket = await FoodPackage.create(packageData, { transaction: t });

      // ⭐ KONUM BİLGİSİNİ KAYDET
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
          await PackageLocation.create(locationData, { transaction: t });
          console.log('Paket konum bilgisi başarıyla kaydedildi');
        } catch (locationError) {
          console.error('Konum kaydedilirken hata:', locationError);
          throw locationError; // Transaction'ı geri al
        }
      }

      // ⭐ RESİMLERİ KAYDET
      if (req.files && req.files.length > 0) {
        console.log(`${req.files.length} resim yükleniyor...`);
        
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const imageData = {
            package_id: yeniPaket.package_id,
            image_path: file.path, // Multer'ın verdiği dosya yolu
            is_primary: i === 0, // İlk resim primary olsun
            display_order: i + 1,
            created_at: new Date()
          };

          await PackageImage.create(imageData, { transaction: t });
          console.log(`Resim ${i + 1} kaydedildi:`, imageData.image_path);
        }
      }

      return yeniPaket;
    });

    // ⭐ OLUŞTURULAN PAKETİ RESİMLERLE BİRLİKTE GETİR
    const createdPackageWithImages = await FoodPackage.findByPk(result.package_id, {
      include: [
        {
          model: PackageLocation,
          as: 'location',
          required: false
        },
        {
          model: PackageImage,
          as: 'images',
          required: false
        }
      ]
    });

    return res.status(201).json({
      success: true,
      data: createdPackageWithImages,
      message: 'Paket başarıyla oluşturuldu',
      imageCount: req.files ? req.files.length : 0
    });

  } catch (error) {
    console.error('Paket oluşturma hatası:', error);
    
    // ⭐ Hata durumunda yüklenen dosyaları temizle
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          console.log('Hata nedeniyle dosya silindi:', file.path);
        }
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Paket oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
};

// ⭐ Diğer fonksiyonlarda include'lara PackageImage ekle
const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;

    const paket = await FoodPackage.findByPk(id, {
      include: [
        {
          model: PackageLocation,
          as: 'location',
          required: false
        },
        {
          model: PackageImage,
          as: 'images',
          required: false
        }
      ]
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
        is_active: 1
      },
      include: [
        {
          model: PackageLocation,
          as: 'location',
          required: false
        },
        {
          model: PackageImage,
          as: 'images',
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    console.log('Bulunan aktif paketler:', packages.length);
    res.status(200).json({ success: true, data: packages });
  } catch (error) {
    console.error('Aktif paketler alınırken hata:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
  }
};

// ⭐ PACKAGE IMAGE FONKSİYONLARI
const addPackageImage = async (req, res) => {
  try {
    const { packageId } = req.params;
    const user_id = req.user?.user_id || req.user?.id;

    if (!user_id) {
      return res.status(400).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }

    // Paketin kullanıcıya ait olup olmadığını kontrol et
    const seller = await Seller.findOne({ where: { user_id } });
    if (!seller) {
      return res.status(400).json({ success: false, message: 'Satıcı kaydı bulunamadı!' });
    }

    const package = await FoodPackage.findOne({
      where: { 
        package_id: packageId,
        seller_id: seller.seller_id,
        is_active: 1
      }
    });

    if (!package) {
      return res.status(404).json({ 
        success: false, 
        message: 'Paket bulunamadı veya size ait değil' 
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Resim dosyası yüklenmedi'
      });
    }

    // Mevcut resim sayısını al
    const existingImageCount = await PackageImage.count({
      where: { package_id: packageId }
    });

    const imageData = {
      package_id: packageId,
      image_path: req.file.path,
      is_primary: existingImageCount === 0, // İlk resimse primary yap
      display_order: existingImageCount + 1,
      created_at: new Date()
    };

    const newImage = await PackageImage.create(imageData);

    res.status(201).json({
      success: true,
      data: newImage,
      message: 'Resim başarıyla eklendi'
    });

  } catch (error) {
    console.error('Resim eklenirken hata:', error);
    
    // Hata durumunda dosyayı sil
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Resim eklenirken hata oluştu',
      error: error.message
    });
  }
};

const deletePackageImage = async (req, res) => {
  try {
    const { packageId, imageId } = req.params;
    const user_id = req.user?.user_id || req.user?.id;

    if (!user_id) {
      return res.status(400).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }

    // Paketin kullanıcıya ait olup olmadığını kontrol et
    const seller = await Seller.findOne({ where: { user_id } });
    if (!seller) {
      return res.status(400).json({ success: false, message: 'Satıcı kaydı bulunamadı!' });
    }

    const package = await FoodPackage.findOne({
      where: { 
        package_id: packageId,
        seller_id: seller.seller_id
      }
    });

    if (!package) {
      return res.status(404).json({ 
        success: false, 
        message: 'Paket bulunamadı veya size ait değil' 
      });
    }

    const image = await PackageImage.findOne({
      where: {
        image_id: imageId,
        package_id: packageId
      }
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Resim bulunamadı'
      });
    }

    // Dosyayı diskten sil
    if (fs.existsSync(image.image_path)) {
      fs.unlinkSync(image.image_path);
      console.log('Dosya silindi:', image.image_path);
    }

    // Veritabanından sil
    await image.destroy();

    res.status(200).json({
      success: true,
      message: 'Resim başarıyla silindi'
    });

  } catch (error) {
    console.error('Resim silinirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Resim silinirken hata oluştu',
      error: error.message
    });
  }
};


const setPrimaryImage = async (req, res) => {
  try {
    const { packageId, imageId } = req.params;
    const user_id = req.user?.user_id || req.user?.id;

    if (!user_id) {
      return res.status(400).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }

    // Paketin kullanıcıya ait olup olmadığını kontrol et
    const seller = await Seller.findOne({ where: { user_id } });
    if (!seller) {
      return res.status(400).json({ success: false, message: 'Satıcı kaydı bulunamadı!' });
    }

    const package = await FoodPackage.findOne({
      where: { 
        package_id: packageId,
        seller_id: seller.seller_id
      }
    });

    if (!package) {
      return res.status(404).json({ 
        success: false, 
        message: 'Paket bulunamadı veya size ait değil' 
      });
    }

    // Transaction ile primary resmi değiştir
    await models.sequelize.transaction(async (t) => {
      // Önce tüm resimlerin primary durumunu false yap
      await PackageImage.update(
        { is_primary: false },
        { 
          where: { package_id: packageId },
          transaction: t
        }
      );

      // Seçilen resmi primary yap
      await PackageImage.update(
        { is_primary: true },
        { 
          where: { 
            image_id: imageId,
            package_id: packageId
          },
          transaction: t
        }
      );
    });

    res.status(200).json({
      success: true,
      message: 'Ana resim başarıyla değiştirildi'
    });

  } catch (error) {
    console.error('Ana resim değiştirilirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Ana resim değiştirilirken hata oluştu',
      error: error.message
    });
  }
};
const getActivePackagesWithCategories = async (req, res) => {
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
        is_active: 1
      },
      include: packageIncludesWithCategory,
      order: [['created_at', 'DESC']]
    });
    
    res.status(200).json({ success: true, data: packages });
  } catch (error) {
    console.error('Kategori ile aktif paketler alınırken hata:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
  }
};
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
        is_active: 0
      },
      include: [{
        model: PackageLocation,
        as: 'location',
        required: false
      }],
      order: [['updated_at', 'DESC']]
    });

    console.log('Geçmiş paketler (iptal edilenler):', packages.length);
    res.status(200).json({ success: true, data: packages });
  } catch (error) {
    console.error('Paket geçmişi alınırken hata:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
  }
};
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

    let packages;
    try {
      packages = await FoodPackage.findAll({
        where: { 
          seller_id: seller.seller_id,
          is_active: 1
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

    const package = await FoodPackage.findOne({
      where: { 
        package_id: id,
        seller_id: seller.seller_id,
        is_active: 1
      }
    });

    if (!package) {
      return res.status(404).json({ 
        success: false, 
        message: 'Aktif paket bulunamadı veya size ait değil' 
      });
    }

    await package.update({
      is_active: 0,
      cancellation_reason: req.body.cancellation_reason || "Satıcı tarafından iptal edildi",
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

    const package = await FoodPackage.findOne({
      where: { 
        package_id: id,
        seller_id: seller.seller_id,
        is_active: 1
      }
    });

    if (!package) {
      return res.status(404).json({ 
        success: false, 
        message: 'Aktif paket bulunamadı veya size ait değil' 
      });
    }

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

const getAllActivePackagesForShopping = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.user_id;
    let userLocation = null;
    
    if (userId) {
      const { Location } = require('../models');
      const defaultLocation = await Location.findOne({
        where: { 
          user_id: userId, 
          is_default: true 
        }
      });
      
      if (defaultLocation && defaultLocation.latitude && defaultLocation.longitude) {
        userLocation = {
          lat: parseFloat(defaultLocation.latitude),
          lng: parseFloat(defaultLocation.longitude)
        };
        console.log('Kullanıcının varsayılan adresi:', userLocation);
      }
    }

    const packages = await FoodPackage.findAll({
      where: { 
        is_active: 1
      },
      include: [
        {
          model: PackageLocation,
          as: 'location',
          required: false
        },
        {
          model: Seller,
          as: 'seller',
          required: false,
          attributes: ['seller_id', 'user_id', 'business_name']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    console.log('Tüm aktif paketler alındı:', packages.length);
    res.status(200).json({ 
      success: true, 
      data: packages,
      userLocation: userLocation 
    });
  } catch (error) {
    console.error('Tüm aktif paketler alınırken hata:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası', 
      error: error.message 
    });
  }
};

// ID'ye göre kategori ile paket
const getPackageByIdWithCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const paket = await FoodPackage.findByPk(id, {
      include: packageIncludesWithCategory
    });
    
    if (!paket) {
      return res.status(404).json({ success: false, message: 'Paket bulunamadı' });
    }
    
    res.status(200).json({ success: true, data: paket });
  } catch (error) {
    console.error('Paket detayı alınırken hata:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
  }
};

// Kullanıcının kategori ile paketleri
const getMyPackagesWithCategories = async (req, res) => {
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
        is_active: 1
      },
      include: packageIncludesWithCategory,
      order: [['created_at', 'DESC']]
    });
    
    res.status(200).json({ 
      success: true, 
      data: packages,
      message: `${packages.length} aktif paket bulundu`
    });
  } catch (error) {
    console.error('Kategori ile paketler alınırken hata:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
  }
};

// Tüm aktif paketler kategori ile (alışveriş için gelişmiş)
const getAllActivePackagesWithCategories = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.user_id;
    let userLocation = null;
    
    if (userId) {
      const { Location } = require('../models');
      const defaultLocation = await Location.findOne({
        where: { 
          user_id: userId, 
          is_default: true 
        }
      });
      
      if (defaultLocation && defaultLocation.latitude && defaultLocation.longitude) {
        userLocation = {
          lat: parseFloat(defaultLocation.latitude),
          lng: parseFloat(defaultLocation.longitude)
        };
      }
    }

    const packages = await FoodPackage.findAll({
      where: { 
        is_active: 1
      },
      include: packageIncludesWithCategory,
      order: [['created_at', 'DESC']]
    });
    
    console.log('Kategori ile tüm aktif paketler alındı:', packages.length);
    res.status(200).json({ 
      success: true, 
      data: packages,
      userLocation: userLocation 
    });
  } catch (error) {
    console.error('Kategori ile tüm aktif paketler alınırken hata:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası', 
      error: error.message 
    });
  }
};
module.exports = {
  createPackage,
  getPackageById,
  getActivePackages,
  getActivePackagesWithCategories, // ⭐ BU FONKSİYON ARTIK TANIMLI
  getPackageHistory,
  getMyPackages,
  getMyPackagesWithCategories,
  cancelPackage,
  updatePackage,
  getAllActivePackagesForShopping,
  getPackageByIdWithCategory,
  addPackageImage,
  deletePackageImage,
  setPrimaryImage,
  getAllActivePackagesWithCategories,
  upload: uploadConfig
};