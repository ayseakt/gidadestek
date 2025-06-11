const {
  FoodPackage,
  PackageLocation,
  Seller,
  PackageImage,
} = require('../models');
const path = require('path');
// Eğer Category modeli yoksa, models'dan dinamik olarak al
const models = require('../models');
const Category = models.Category; // Her iki ismi de dene
const fs = require('fs');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join('uploads', 'packages');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
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
const processPackageImages = (packages, req) => {
  return packages.map(pkg => {
    const packageObj = pkg.toJSON();
    
    if (packageObj.images && packageObj.images.length > 0) {
      console.log(`🖼️ Paket ${packageObj.package_id} için ${packageObj.images.length} resim işleniyor`);
      
      packageObj.images = packageObj.images.map(img => {
        // Windows backslash'lerini düzelt ve doğru URL oluştur
        const cleanPath = img.image_path ? img.image_path.replace(/\\/g, '/') : null;
        const webUrl = cleanPath 
          ? `${req.protocol}://${req.get('host')}/${cleanPath}`
          : null;
          
        console.log('📸 Resim yolu düzeltme:', img.image_path, '->', cleanPath, '->', webUrl);
        
        return {
          ...img,
          image_path: cleanPath, // Düzeltilmiş yol
          web_url: webUrl        // Web URL'si
        };
      });
    } else {
      console.log(`📦 Paket ${packageObj.package_id} için resim bulunamadı`);
    }
    
    return packageObj;
  });
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

    // ⭐ Yardımcı fonksiyonu kullan
    const packagesWithWebUrls = processPackageImages(packages, req);

    console.log('Bulunan aktif paketler:', packagesWithWebUrls.length);
    res.status(200).json({ success: true, data: packagesWithWebUrls });

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

    // YOL DÜZELTME
    const result = packages.map(pkg => {
      const pkgObj = pkg.toJSON();
      if (pkgObj.images && pkgObj.images.length > 0) {
        pkgObj.images = pkgObj.images.map(img => ({
          ...img,
          image_path: img.image_path.replace(/\\\\/g, '/')
        }));
      }
      return pkgObj;
    });

    res.status(200).json({ success: true, data: result });

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
      where: { seller_id: seller.seller_id, is_active: 0 },
      include: [
        { model: PackageLocation, as: 'location', required: false },
        { model: PackageImage, as: 'images', required: false }
      ],
      order: [['updated_at', 'DESC']]
    });

    // YOL DÜZELTME + WEB_URL EKLEME
    const result = packages.map(pkg => {
      const pkgObj = pkg.toJSON();
      if (pkgObj.images && pkgObj.images.length > 0) {
        pkgObj.images = pkgObj.images.map(img => {
          const cleanPath = img.image_path ? img.image_path.replace(/\\\\/g, '/') : null;
          const webUrl = cleanPath
            ? `${req.protocol}://${req.get('host')}/${cleanPath}`
            : null;
          return {
            ...img,
            image_path: cleanPath,
            web_url: webUrl
          };
        });
      }
      return pkgObj;
    });

    res.status(200).json({ success: true, data: result });

  } catch (error) {
    console.error('Paket geçmişi alınırken hata:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
  }
};
const getMyPackages = async (req, res) => {
  try {
    console.log('getMyPackages fonksiyonu çağırıldı');
    
    const user_id = req.user?.user_id || req.user?.id;
    
    if (!user_id) {
      console.error('User ID bulunamadı:', req.user);
      return res.status(400).json({ 
        success: false, 
        message: 'Kullanıcı bulunamadı - user_id eksik'
      });
    }

    const seller = await Seller.findOne({ where: { user_id } });
    
    if (!seller) {
      return res.status(400).json({ 
        success: false, 
        message: 'Satıcı kaydı bulunamadı!'
      });
    }

    // ⭐ PackageImage modelini include et ve resim URL'lerini oluştur
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
          model: PackageImage, // ⭐ BU EKLENDİ
          as: 'images',
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // ⭐ Resim URL'lerini web formatına çevir - DÜZELTME
    const packagesWithWebUrls = packages.map(pkg => {
      const packageObj = pkg.toJSON();
      
      if (packageObj.images && packageObj.images.length > 0) {
        console.log(`🖼️ Paket ${packageObj.package_id} için ${packageObj.images.length} resim işleniyor`);
        
        packageObj.images = packageObj.images.map(img => {
          // ⭐ Windows backslash'lerini düzelt ve doğru URL oluştur
          const cleanPath = img.image_path ? img.image_path.replace(/\\/g, '/') : null;
          const webUrl = cleanPath 
            ? `${req.protocol}://${req.get('host')}/${cleanPath}`
            : null;
            
          console.log('📸 Resim yolu düzeltme:', img.image_path, '->', cleanPath, '->', webUrl);
          
          return {
            ...img,
            image_path: cleanPath, // Düzeltilmiş yol
            web_url: webUrl        // Web URL'si
          };
        });
      } else {
        console.log(`📦 Paket ${packageObj.package_id} için resim bulunamadı`);
      }
      
      return packageObj;
    });

    console.log('Kullanıcının aktif paketleri:', packagesWithWebUrls.length);
    
    return res.status(200).json({ 
      success: true, 
      data: packagesWithWebUrls,
      message: `${packagesWithWebUrls.length} aktif paket bulundu`
    });
    
  } catch (error) {
    console.error('getMyPackages hatası:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Paketler alınırken hata oluştu', 
      error: error.message
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
    
    // ⭐ Güncellenmiş paketi resimlerle birlikte getir
    const updatedPackage = await FoodPackage.findByPk(id, {
      include: [
        {
          model: PackageLocation,
          as: 'location',
          required: false
        },
        {
          model: PackageImage, // ⭐ BU EKLENDİ
          as: 'images',
          required: false
        }
      ]
    });

    // ⭐ Resim URL'lerini web formatına çevir
    const packageWithWebUrls = updatedPackage.toJSON();
    if (packageWithWebUrls.images && packageWithWebUrls.images.length > 0) {
      packageWithWebUrls.images = packageWithWebUrls.images.map(img => ({
        ...img,
        web_url: img.image_path 
          ? `${req.protocol}://${req.get('host')}/${img.image_path.replace(/\\/g, '/')}`
          : null
      }));
    }

    res.status(200).json({ 
      success: true, 
      data: packageWithWebUrls,
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
        },
        {
          model: PackageImage,
          as: 'images',
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    // ⭐ RESİM URL'LERİNİ DÜZELT
    const packagesWithWebUrls = packages.map(pkg => {
      const packageObj = pkg.toJSON();
      
      if (packageObj.images && packageObj.images.length > 0) {
        packageObj.images = packageObj.images.map(img => ({
          ...img,
          image_path: img.image_path ? img.image_path.replace(/\\/g, '/') : null,
          web_url: img.image_path 
            ? `${req.protocol}://${req.get('host')}/${img.image_path.replace(/\\/g, '/')}`
            : null
        }));
      }
      
      return packageObj;
    });
    
    console.log('Tüm aktif paketler alındı:', packagesWithWebUrls.length);
    res.status(200).json({ 
      success: true, 
      data: packagesWithWebUrls,
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

    // ⭐ PackageImage'ı packageIncludesWithCategory'ye ekle
    const includesWithImages = [
      {
        model: Seller,
        as: 'seller',
        attributes: ['seller_id', 'user_id', 'business_name']
      },
      {
        model: PackageLocation, 
        as: 'location',
        required: false
      },
      {
        model: PackageImage, // ⭐ BU EKLENDİ
        as: 'images',
        required: false
      }
    ];

    // Category modeli varsa ekle
    if (Category) {
      includesWithImages.push({
        model: Category,
        as: 'category',
        required: false
      });
    }

    const packages = await FoodPackage.findAll({
      where: { 
        seller_id: seller.seller_id,
        is_active: 1
      },
      include: includesWithImages,
      order: [['created_at', 'DESC']]
    });

    // ⭐ Resim URL'lerini web formatına çevir
    const packagesWithWebUrls = packages.map(pkg => {
      const packageObj = pkg.toJSON();
      
      if (packageObj.images && packageObj.images.length > 0) {
        packageObj.images = packageObj.images.map(img => ({
          ...img,
          web_url: img.image_path 
            ? `${req.protocol}://${req.get('host')}/${img.image_path.replace(/\\/g, '/')}`
            : null
        }));
      }
      
      return packageObj;
    });
    
    res.status(200).json({ 
      success: true, 
      data: packagesWithWebUrls,
      message: `${packagesWithWebUrls.length} aktif paket bulundu`
    });
  } catch (error) {
    console.error('Kategori ile paketler alınırken hata:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
  }
};

const getAllActivePackagesWithCategories = async (req, res) => {
  try {
    console.log('🔍 getAllActivePackagesWithCategories fonksiyonu çağırıldı');
    
    const userId = req.user?.id || req.user?.user_id;
    let userLocation = null;
    
    if (userId) {
      try {
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
      } catch (locationError) {
        console.warn('⚠️ Kullanıcı konumu alınamadı:', locationError.message);
      }
    }

    const includesWithImages = [
      {
        model: Seller,
        as: 'seller',
        attributes: ['seller_id', 'user_id', 'business_name'],
        required: false
      },
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
    ];

    try {
      if (models.Category) {
        includesWithImages.push({
          model: models.Category,
          as: 'category',
          required: false
        });
        console.log('✅ Category modeli include edildi');
      } else if (models.PackageCategory) {
        includesWithImages.push({
          model: models.PackageCategory,
          as: 'packageCategory',
          required: false
        });
        console.log('✅ PackageCategory modeli include edildi');
      }
    } catch (categoryError) {
      console.warn('⚠️ Category eklenirken hata:', categoryError.message);
    }

    const packages = await FoodPackage.findAll({
      where: { 
        is_active: 1
      },
      include: includesWithImages,
      order: [['created_at', 'DESC']]
    });
    
    console.log('📦 Ham paketler alındı:', packages.length);
    
    // ⭐ DOĞRU URL OLUŞTURMA
    const packagesWithWebUrls = packages.map(pkg => {
      const packageObj = pkg.toJSON();
      
      if (packageObj.images && packageObj.images.length > 0) {
        console.log(`🖼️ Paket ${packageObj.package_id} için ${packageObj.images.length} resim işleniyor`);
        
        packageObj.images = packageObj.images.map(img => {
          // Windows backslash'lerini düzelt ve doğru URL oluştur
          const cleanPath = img.image_path ? img.image_path.replace(/\\/g, '/') : null;
          const webUrl = cleanPath 
            ? `${req.protocol}://${req.get('host')}/${cleanPath}`
            : null;
            
          console.log('📸 Resim yolu düzeltme:', img.image_path, '->', cleanPath, '->', webUrl);
          
          return {
            ...img,
            image_path: cleanPath, // Düzeltilmiş yol
            web_url: webUrl        // Web URL'si
          };
        });
      }
      
      return packageObj;
    });
    
    console.log('✅ Kategori ve resimlerle tüm aktif paketler hazırlandı:', packagesWithWebUrls.length);
    
    res.status(200).json({ 
      success: true, 
      data: packagesWithWebUrls,
      userLocation: userLocation 
    });
    
  } catch (error) {
    console.error('❌ getAllActivePackagesWithCategories hatası:', error);
    
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
  upload: uploadConfig,
  processPackageImages 
};