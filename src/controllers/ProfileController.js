const { User, UserProfile, Seller } = require('../models');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
// Kullanıcı profil bilgilerini getir
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findOne({
      where: { user_id: userId },
      include: [{
        model: UserProfile,
        as: 'profile' // ✅ alias burada doğru kullanılmış
      }],
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // ❌ user.UserProfile --> Hatalı çünkü alias 'profile'
    const userProfile = user.profile;

    const firstName = userProfile?.first_name || '';
    const lastName = userProfile?.last_name || '';
    
    const response = {
      success: true,
      user: {
        id: user.user_id,
        email: user.email,
        phone: user.phone_number,
        name: `${firstName} ${lastName}`.trim() || 'Kullanıcı',
        first_name: firstName,
        last_name: lastName,
        profile_picture: userProfile?.profile_picture || null,
        bio: userProfile?.bio || ''
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
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, email, phone, bio } = req.body;

    // E-posta kontrolü - DÜZELTME
    if (email) {
      const existingUser = await User.findOne({
        where: { 
          email, 
          user_id: { [Op.ne]: userId } // ✅ Doğru kullanım
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Bu e-posta adresi başka bir kullanıcı tarafından kullanılmaktadır'
        });
      }
    }

    // Telefon kontrolü - DÜZELTME
    if (phone) {
      const existingPhoneUser = await User.findOne({
        where: { 
          phone_number: phone, 
          user_id: { [Op.ne]: userId } // ✅ Doğru kullanım
        }
      });

      if (existingPhoneUser) {
        return res.status(400).json({
          success: false,
          message: 'Bu telefon numarası başka bir kullanıcı tarafından kullanılmaktadır'
        });
      }
    }

    await User.sequelize.transaction(async (t) => {
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

      if (firstName || lastName || bio !== undefined) {
        let userProfile = await UserProfile.findOne({
          where: { user_id: userId },
          transaction: t
        });

        if (!userProfile) {
          await UserProfile.create({
            user_id: userId,
            first_name: firstName || '',
            last_name: lastName || '',
            bio: bio || '',
            created_at: new Date(),
            updated_at: new Date()
          }, { transaction: t });
        } else {
          await UserProfile.update(
            {
              ...(firstName !== undefined && { first_name: firstName }),
              ...(lastName !== undefined && { last_name: lastName }),
              ...(bio !== undefined && { bio }),
              updated_at: new Date()
            },
            {
              where: { user_id: userId },
              transaction: t
            }
          );
        }
      }
    });

    const updatedUser = await User.findOne({
      where: { user_id: userId },
      include: [{ 
        model: UserProfile,
        as: 'profile'
      }],
      attributes: { exclude: ['password_hash'] }
    });
    
    const userProfile = updatedUser.profile;
    
    res.status(200).json({
      success: true,
      message: 'Profil bilgileri başarıyla güncellendi',
      user: {
        id: updatedUser.user_id,
        email: updatedUser.email,
        phone: updatedUser.phone_number,
        name: `${firstName} ${lastName}`.trim() || 'Kullanıcı',
        first_name: firstName,
        last_name: lastName,
        profile_picture: userProfile?.profile_picture || null,
        bio: userProfile?.bio || ''
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
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findOne({ where: { user_id: userId } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mevcut şifre hatalı'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

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
const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Dosya yüklenemedi'
      });
    }

    const profilePicturePath = `/uploads/profile/${req.file.filename}`;

    // UserProfile var mı kontrol et, yoksa oluştur
    let userProfile = await UserProfile.findOne({
      where: { user_id: userId }
    });

    if (!userProfile) {
      await UserProfile.create({
        user_id: userId,
        first_name: '',
        last_name: '',
        profile_picture: profilePicturePath,
        created_at: new Date(),
        updated_at: new Date()
      });
    } else {
      await UserProfile.update(
        {
          profile_picture: profilePicturePath,
          updated_at: new Date()
        },
        { where: { user_id: userId } }
      );
    }

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

// Satıcı profili getir
const getSellerProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const seller = await Seller.findOne({
      where: { user_id: userId },
      include: [{
        model: User,
        as: 'user', // ✅ DOĞRU! Seller.js'teki alias ile aynı
        attributes: ['email', 'phone_number']
      }]
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Satıcı profili bulunamadı'
      });
    }

    res.json({
      success: true,
      data: {
        seller_id: seller.seller_id,
        business_name: seller.business_name || '',
        business_type: seller.business_type || '',
        business_description: seller.business_description || '',
        rating: seller.rating || 0,
        total_ratings: seller.total_ratings || 0,
        is_verified: seller.is_verified || false,
        // ✅ Alias'ı 'user' olarak değiştir
        email: seller.user?.email || '',
        phone_number: seller.user?.phone_number || '',
        isProfileComplete: !!(seller.business_name && seller.business_type && seller.business_description)
      }
    });
  } catch (error) {
    console.error('Satıcı profili getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// Satıcı profili güncelle
const updateSellerProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { business_name, business_type, business_description } = req.body;

    // Seller kaydı var mı kontrol et
    let seller = await Seller.findOne({
      where: { user_id: userId }
    });

    if (!seller) {
      // Seller kaydı yoksa oluştur
      seller = await Seller.create({
        user_id: userId,
        business_name: business_name || '',
        business_type: business_type || 'other',
        business_description: business_description || '',
        is_verified: false,
        rating: null,
        total_ratings: 0,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    } else {
      // Seller kaydı varsa güncelle
      await seller.update({
        business_name: business_name || seller.business_name,
        business_type: business_type || seller.business_type,
        business_description: business_description || seller.business_description,
        updated_at: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Satıcı profili başarıyla güncellendi',
      data: {
        seller_id: seller.seller_id,
        business_name: seller.business_name,
        business_type: seller.business_type,
        business_description: seller.business_description,
        isProfileComplete: !!(seller.business_name && seller.business_type && seller.business_description)
      }
    });
  } catch (error) {
    console.error('Satıcı profili güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

// === Dışa aktarım ===
module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  uploadProfilePicture,
  getSellerProfile,
  updateSellerProfile
};
