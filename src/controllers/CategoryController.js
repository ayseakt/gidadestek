const PackageCategory = require('../models/PackageCategory');

// Tüm kategorileri listeleme
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await PackageCategory.findAll({
      order: [['name', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Kategori listeleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kategoriler listelenirken bir hata oluştu',
      error: error.message
    });
  }
};

// Diğer kategori işlemleri (create, update, delete)