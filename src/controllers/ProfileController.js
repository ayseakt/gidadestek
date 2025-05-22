// profileController.js
const { User, UserProfile } = require('../models');
const bcrypt = require('bcrypt');

// Kullanıcı profil bilgilerini getir
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // JWT middleware'den gelen kullanıcı ID'si

    // Kullanıcı ve profil bilgilerini birlikte sorgula
    const user = await User.findOne({
      where: { user_id: userId },
      include: [{ model: UserProfile }],
      attributes: { exclude: ['password_hash'] } // Şifreyi hariç tut
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Yanıt formatını oluştur
    const response = {
      success: true,
      user: {
        id: user.user_id,
        email: user.email,
        phone: user.phone_number,
        name: `${user.UserProfile.first_name} ${user.UserProfile.last_name}`.trim(),
        first_name: user.UserProfile.first_name,
        last_name: user.UserProfile.last_name,
        profile_picture: user.UserProfile.profile_picture,
        bio: user.UserProfile.bio
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Profil bilgileri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Profil bilgileri getirilirken bir hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Sunucu hatası'
    });
  }
};

// Profil bilgilerini güncelle
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, email, phone, bio } = req.body;

    // Eğer email değişiyorsa, başka bir kullanıcıda var mı kontrol et
    if (email) {
      const existingUser = await User.findOne({
        where: { email, user_id: { [User.sequelize.Op.ne]: userId } }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Bu e-posta adresi başka bir kullanıcı tarafından kullanılmaktadır'
        });
      }
    }

    // Eğer telefon değişiyorsa, başka bir kullanıcıda var mı kontrol et
    if (phone) {
      const existingPhoneUser = await User.findOne({
        where: { phone_number: phone, user_id: { [User.sequelize.Op.ne]: userId } }
      });
      
      if (existingPhoneUser) {
        return res.status(400).json({
          success: false,
          message: 'Bu telefon numarası başka bir kullanıcı tarafından kullanılmaktadır'
        });
      }
    }

    // Transaction başlat
    await User.sequelize.transaction(async (t) => {
      // Kullanıcı bilgilerini güncelle
      if (email || phone) {
        await User.update(
          { 
            ...(email && { email }),
            ...(phone && { phone_number: phone })
          },
          { 
            where: { user_id: userId },
            transaction: t
          }
        );
      }

      // Profil bilgilerini güncelle
      if (firstName || lastName || bio) {
        await UserProfile.update(
          {
            ...(firstName && { first_name: firstName }),
            ...(lastName && { last_name: lastName }),
            ...(bio && { bio }),
            updated_at: new Date()
          },
          {
            where: { user_id: userId },
            transaction: t
          }
        );
      }
    });

    // Güncellenmiş kullanıcı bilgilerini getir
    const updatedUser = await User.findOne({
      where: { user_id: userId },
      include: [{ model: UserProfile }],
      attributes: { exclude: ['password_hash'] }
    });

    res.status(200).json({
      success: true,
      message: 'Profil bilgileri başarıyla güncellendi',
      user: {
        id: updatedUser.user_id,
        email: updatedUser.email,
        phone: updatedUser.phone_number,
        name: `${updatedUser.UserProfile.first_name} ${updatedUser.UserProfile.last_name}`.trim(),
        first_name: updatedUser.UserProfile.first_name,
        last_name: updatedUser.UserProfile.last_name,
        profile_picture: updatedUser.UserProfile.profile_picture,
        bio: updatedUser.UserProfile.bio
      }
    });
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Profil güncellenirken bir hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Sunucu hatası'
    });
  }
};

// Şifre değiştirme
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Kullanıcıyı bul
    const user = await User.findOne({ where: { user_id: userId } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Mevcut şifreyi kontrol et
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mevcut şifre hatalı'
      });
    }

    // Yeni şifreyi hashle
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Şifreyi güncelle
    await User.update(
      { password_hash: hashedNewPassword },
      { where: { user_id: userId } }
    );

    res.status(200).json({
      success: true,
      message: 'Şifre başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Şifre değiştirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Şifre değiştirilirken bir hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Sunucu hatası'
    });
  }
};

// Profil resmi yükleme
exports.uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // req.file middleware tarafından yüklenir (multer kullanılmalı)
    if (!req.file) {
      return res.status(400).json({
        success: false, 
        message: 'Dosya yüklenemedi'
      });
    }

    // Profil resminin dosya yolunu veritabanına kaydet
    // Bu örnekte dosya adını kullanıyoruz, gerçek uygulamada tam URL veya yol olabilir
    const profilePicturePath = `/uploads/profile/${req.file.filename}`;
    
    await UserProfile.update(
      { 
        profile_picture: profilePicturePath,
        updated_at: new Date()
      },
      { where: { user_id: userId } }
    );

    res.status(200).json({
      success: true,
      message: 'Profil fotoğrafı başarıyla güncellendi',
      profilePicture: profilePicturePath
    });
  } catch (error) {
    console.error('Profil resmi yükleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Profil resmi yüklenirken bir hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Sunucu hatası'
    });
  }
};