// controllers/LocationController.js - Düzeltilmiş versiyon
const { Location } = require('../models');

module.exports = {
  // Kullanıcının lokasyonlarını listeleme
  getLocations: async (req, res) => {
    try {
      const userId = req.user.id;
      
      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Kullanıcı bulunamadı' 
        });
      }
      
      // Sadece mevcut sütunları seç (address_type, building_info, delivery_notes kaldırıldı)
      const locations = await Location.findAll({
        where: { user_id: userId },
        attributes: [
          'location_id',
          'user_id', 
          'location_name',
          'address',
          'city',
          'district',
          'postal_code',
          'latitude',
          'longitude',
          'is_default',
          'created_at',
          'updated_at'
        ],
        order: [['created_at', 'DESC']]
      });
      
      // Frontend'in beklediği formatta veriyi döndür
      const formattedLocations = locations.map(location => ({
        ...location.toJSON(),
        address_type: 'home', // Varsayılan değer
        building_info: null,
        delivery_notes: null
      }));
      
      return res.status(200).json({
        success: true,
        data: formattedLocations
      });
      
    } catch (error) {
      console.error('Konumları getirme hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Konumlar getirilirken bir hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },
  
  createLocation: async (req, res) => {
    try {
      const userId = req.user.id;
      
      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Kullanıcı bulunamadı' 
        });
      }
      
      const {
        location_name,
        address,
        city,
        district,
        postal_code,
        latitude,
        longitude,
        is_default
        // address_type, building_info, delivery_notes kaldırıldı
      } = req.body;
      
      // Zorunlu alanları kontrol et
      if (!location_name || !address) {
        return res.status(400).json({
          success: false,
          message: 'Konum adı ve adres zorunludur'
        });
      }
      
      // Eğer bu varsayılan adres olacaksa, diğer varsayılan adresleri kaldır
      if (is_default) {
        await Location.update(
          { is_default: false },
          { where: { user_id: userId } }
        );
      }
      
      // Yeni konum oluştur - sadece mevcut sütunları kullan
      const newLocation = await Location.create({
        user_id: userId,
        location_name,
        address,
        city: city || null,
        district: district || null,
        postal_code: postal_code || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        is_default: is_default || false,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      // Frontend'in beklediği formatta veriyi döndür
      const formattedLocation = {
        ...newLocation.toJSON(),
        address_type: 'home',
        building_info: null,
        delivery_notes: null
      };
      
      return res.status(201).json({
        success: true,
        message: 'Konum başarıyla oluşturuldu',
        data: formattedLocation
      });
      
    } catch (error) {
      console.error('Konum oluşturma hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Konum oluşturulurken bir hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },
  
  updateLocation: async (req, res) => {
    try {
      const userId = req.user.id;
      const locationId = req.params.id;
      
      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Kullanıcı bulunamadı' 
        });
      }
      
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
      
      // Güncellenecek alanları belirle - sadece mevcut sütunları kullan
      const updateData = {
        updated_at: new Date()
      };
      
      if (req.body.location_name !== undefined) updateData.location_name = req.body.location_name;
      if (req.body.address !== undefined) updateData.address = req.body.address;
      if (req.body.city !== undefined) updateData.city = req.body.city;
      if (req.body.district !== undefined) updateData.district = req.body.district;
      if (req.body.postal_code !== undefined) updateData.postal_code = req.body.postal_code;
      if (req.body.latitude !== undefined) updateData.latitude = req.body.latitude ? parseFloat(req.body.latitude) : null;
      if (req.body.longitude !== undefined) updateData.longitude = req.body.longitude ? parseFloat(req.body.longitude) : null;
      
      // Eğer varsayılan adres yapılacaksa, diğer varsayılan adresleri kaldır
      if (req.body.is_default) {
        await Location.update(
          { is_default: false, updated_at: new Date() }, 
          { where: { user_id: userId } }
        );
        updateData.is_default = true;
      } else if (req.body.is_default === false) {
        updateData.is_default = false;
      }
      updateData.user_id = userId;
      // Konumu güncelle
      await Location.update(updateData, {
        where: {
          location_id: locationId,
          user_id: userId
        }
      });
      
      // Güncellenmiş konumu getir
      const updatedLocation = await Location.findByPk(locationId);
      
      // Frontend'in beklediği formatta veriyi döndür
      const formattedLocation = {
        ...updatedLocation.toJSON(),
        address_type: 'home',
        building_info: null,
        delivery_notes: null
      };
      
      return res.status(200).json({
        success: true,
        message: 'Konum başarıyla güncellendi',
        data: formattedLocation
      });
      
    } catch (error) {
      console.error('Konum güncelleme hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Konum güncellenirken bir hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  deleteLocation: async (req, res) => {
    try {
      const userId = req.user.id;
      const locationId = req.params.id;
      
      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Kullanıcı bulunamadı' 
        });
      }
      
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
      
      // Konumu sil (hard delete)
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
        message: 'Konum silinirken bir hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },
  
  getSellerLocations: async (req, res) => {
    try {
      const sellerId = req.user.id;
      
      if (!sellerId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Kullanıcı bulunamadı' 
        });
      }
      
      // Sadece mevcut sütunları kullan
      const locations = await Location.findAll({
        where: { 
          user_id: sellerId
        },
        attributes: [
          'location_id',
          'location_name',
          'address',
          'city',
          'district',
          'postal_code',
          'latitude',
          'longitude',
          'is_default',
          'created_at'
        ],
        order: [['location_name', 'ASC']]
      });
      
      // Frontend'in beklediği formatta veriyi döndür
      const formattedLocations = locations.map(location => ({
        ...location.toJSON(),
        address_type: 'home',
        building_info: null,
        delivery_notes: null
      }));
      
      res.status(200).json({
        success: true,
        count: formattedLocations.length,
        data: formattedLocations
      });
    } catch (error) {
      console.error('Lokasyon listeleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Lokasyonlar listelenirken bir hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },
  
};