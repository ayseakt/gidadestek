// authController.js - Fixed Version
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User, UserProfile, sequelize } = require('../models');
const Seller = require('../models/Seller');

// Yeni kullanıcı kaydı
exports.signup = async (req, res) => {
  try {
    console.log('🔥 Signup isteği geldi:', req.body);
    const { email, password, name, phone } = req.body;

    // Email kontrolü
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bu email adresi zaten kayıtlı' 
      });
    }

    // Telefon kontrolü
    const existingPhone = await User.findOne({ where: { phone_number: phone } });
    if (existingPhone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bu telefon numarası zaten kayıtlı' 
      });
    }

    // Şifre hash'leme
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Transaction başlat
    const result = await sequelize.transaction(async (t) => {
      // Kullanıcı oluştur
      const newUser = await User.create({
        email,
        password_hash: hashedPassword,
        phone_number: phone,
        account_status: 'active'
      }, { transaction: t });

      // İsmi parçala (ad ve soyad)
      const nameParts = name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      // Profil oluştur
      console.log('UserProfile kaydı ekleniyor', newUser.user_id, firstName, lastName);
      const userProfile = await UserProfile.create({
        user_id: newUser.user_id,
        first_name: firstName,
        last_name: lastName,
        created_at: new Date(),
        updated_at: new Date()
      }, { transaction: t });
      console.log('UserProfile kaydı başarılı');
      
      // Seller kaydı oluştur
      console.log('Seller kaydı ekleniyor', newUser.user_id);
      const seller = await Seller.create({
        user_id: newUser.user_id,
        business_name: "Bilinmiyor",
        business_type: "other",  
        business_description: "",
        is_verified: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }, { transaction: t });
      console.log('Seller kaydı başarılı');
      
      return newUser;
    });
    
    // JWT token oluştur
    const token = jwt.sign(
      { id: result.user_id, email: result.email },
      process.env.JWT_SECRET || 'sofra-pay-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu',
      token,
      user: {
        id: result.user_id,
        email: result.email,
        name
      }
    });
  } catch (error) {
      console.error('Kayıt hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Kayıt işlemi sırasında bir hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Sunucu hatası'
      });
    }
};

// Kullanıcı girişi - DÜZELTME - ALIAS EKLENDİ
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validasyonu
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email ve şifre gerekli'
      });
    }

    // Kullanıcıyı bul - ALIAS'LAR EKLENDİ
    const user = await User.findOne({ 
      where: { email },
      include: [
        { 
          model: UserProfile,
          as: 'profile', // User.js'deki alias ile aynı
          required: false // LEFT JOIN yapar, UserProfile yoksa da user'ı getirir
        }, 
        { 
          model: Seller,
          as: 'seller', // User.js'deki alias ile aynı
          required: false // LEFT JOIN yapar, Seller yoksa da user'ı getirir
        }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email veya şifre hatalı'
      });
    }

    // Hesap aktif mi kontrol et
    if (user.account_status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Hesabınız aktif değil veya askıya alınmış'
      });
    }

    // Şifreyi kontrol et
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email veya şifre hatalı'
      });
    }

    // Son giriş zamanını güncelle
    await User.update(
      { last_login: new Date() },
      { where: { user_id: user.user_id } }
    );

    // Token oluştur
    const token = jwt.sign(
      { id: user.user_id, email: user.email },
      process.env.JWT_SECRET || 'sofra-pay-secret-key',
      { expiresIn: '7d' }
    );

    // Kullanıcı bilgilerini hazırla - ALIAS KULLANIMI DÜZELTİLDİ
    const userProfile = user.profile; // user.UserProfile yerine user.profile
    let fullName = 'Kullanıcı'; // Varsayılan isim
    
    if (userProfile && userProfile.first_name) {
      const firstName = userProfile.first_name || '';
      const lastName = userProfile.last_name || '';
      fullName = `${firstName} ${lastName}`.trim();
    }

    res.status(200).json({
      success: true,
      message: 'Giriş başarılı',
      token,
      user: {
        id: user.user_id,
        email: user.email,
        name: fullName,
        phone: user.phone_number,
        isSeller: !!(user.seller) // user.Seller yerine user.seller
      }
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Giriş sırasında bir hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Sunucu hatası'
    });
  }
};

// Misafir olarak devam et
exports.guestLogin = async (req, res) => {
  try {
    // Misafir kullanıcı için geçici bir token oluştur
    const guestToken = jwt.sign(
      { isGuest: true },
      process.env.JWT_SECRET || 'sofra-pay-secret-key',
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      message: 'Misafir girişi başarılı',
      token: guestToken,
      isGuest: true
    });
  } catch (error) {
    console.error('Misafir giriş hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Misafir girişi sırasında bir hata oluştu'
    });
  }
};