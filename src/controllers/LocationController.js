const { Location } = require('../models');

// Tek bir module.exports kullanın
module.exports = {
  // Satıcının lokasyonlarını listeleme
  getLocations: async (req, res) => {
    try {
      const userId = req.user.id; // JWT'den gelen kullanıcı ID'si
      if (!userId) { return res.status(400).json({ success: false, message: 'Kullanıcı bulunamadı (userId yok)' }); }
      
      const locations = await Location.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']]
      });
      
      return res.status(200).json({
        success: true,
        data: locations
      });
      
    } catch (error) {
      console.error('Konumları getirme hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Konumlar getirilirken bir hata oluştu'
      });
    }
  },
  
  createLocation: async (req, res) => {
    try {
      const userId = req.user.id; // JWT'den gelen kullanıcı ID'si
      if (!userId) { return res.status(400).json({ success: false, message: 'Kullanıcı bulunamadı (userId yok)' }); }
      
      const {
        location_name,
        address,
        city,
        district,
        postal_code,
        latitude,
        longitude,
        is_default,
        getLocations
      } = req.body;
      
      // Zorunlu alanları kontrol et
      if (!location_name || !address) {
        return res.status(400).json({
          success: false,
          message: 'Konum adı ve adres zorunludur'
        });
      }
      
      // Yeni konum oluştur
      const newLocation = await Location.create({
        user_id: userId,
        location_name,
        address,
        city: city || null,
        district: district || null,
        postal_code: postal_code || null,
        latitude: latitude || null,
        longitude: longitude || null,
        is_default: is_default || false,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      return res.status(201).json({
        success: true,
        message: 'Konum başarıyla oluşturuldu',
        location: newLocation
      });
      
    } catch (error) {
      console.error('Konum oluşturma hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Konum oluşturulurken bir hata oluştu'
      });
    }
  },
  
  updateLocation: async (req, res) => {
    try {
      const userId = req.user.id; // JWT'den gelen kullanıcı ID'si
      if (!userId) { return res.status(400).json({ success: false, message: 'Kullanıcı bulunamadı (userId yok)' }); }
      const locationId = req.params.id;
      
      // Konumun kullanıcıya ait olup olmadığını kontrol et
      const location = await Location.findOne({
        where: {
          location_id: locationId,
          user_id: userId
        }
      });
      
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Konum bulunamadı veya bu konuma erişim izniniz yok'
        });
      }
      
      // Güncellenecek alanları belirle
      const updateData = {};
      
      if (req.body.location_name) updateData.location_name = req.body.location_name;
      if (req.body.address) updateData.address = req.body.address;
      if (req.body.city) updateData.city = req.body.city;
      if (req.body.district) updateData.district = req.body.district;
      if (req.body.postal_code) updateData.postal_code = req.body.postal_code;
      if (req.body.latitude) updateData.latitude = req.body.latitude;
      if (req.body.longitude) updateData.longitude = req.body.longitude;
      if (req.body.is_default !== undefined) updateData.is_default = req.body.is_default;
      
      updateData.updated_at = new Date();
      
      // Konumu güncelle
      await Location.update(updateData, {
        where: {
          location_id: locationId,
          user_id: userId
        }
      });
      
      // Güncellenmiş konumu getir
      const updatedLocation = await Location.findByPk(locationId);
      
      return res.status(200).json({
        success: true,
        message: 'Konum başarıyla güncellendi',
        location: updatedLocation
      });
      
    } catch (error) {
      console.error('Konum güncelleme hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Konum güncellenirken bir hata oluştu'
      });
    }
  },

  deleteLocation: async (req, res) => {
    try {
      const userId = req.user.id; // JWT'den gelen kullanıcı ID'si
      if (!userId) { return res.status(400).json({ success: false, message: 'Kullanıcı bulunamadı (userId yok)' }); }
      const locationId = req.params.id;
      
      // Konumun kullanıcıya ait olup olmadığını kontrol et
      const location = await Location.findOne({
        where: {
          location_id: locationId,
          user_id: userId
        }
      });
      
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Konum bulunamadı veya bu konuma erişim izniniz yok'
        });
      }
      
      // Konumu sil
      await Location.destroy({
        where: {
          location_id: locationId,
          user_id: userId
        }
      });
      
      return res.status(200).json({
        success: true,
        message: 'Konum başarıyla silindi'
      });
      
    } catch (error) {
      console.error('Konum silme hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Konum silinirken bir hata oluştu'
      });
    }
  },
  
  getSellerLocations: async (req, res) => {
    try {
      const sellerId = req.user.id;
      if (!sellerId) { return res.status(400).json({ success: false, message: 'Kullanıcı bulunamadı (sellerId yok)' }); }
      
      const locations = await Location.findAll({
        where: { 
          user_id: sellerId,
          is_active: true
        },
        order: [['location_name', 'ASC']]
      });
      
      res.status(200).json({
        success: true,
        count: locations.length,
        data: locations
      });
    } catch (error) {
      console.error('Lokasyon listeleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Lokasyonlar listelenirken bir hata oluştu',
        error: error.message
      });
    }
  }
};