// test-seller.js
// Bu dosyayı projenin kök dizininde çalıştırın: node test-seller.js

const { sequelize, User, UserProfile, Seller } = require('../models');

async function testSellerCreation() {
  try {
    console.log('Seller veritabanı testi başlıyor...');
    console.log('------------------------------------');
    
    // 1. Kullanıcı Sorgula
    console.log('Tüm kullanıcılar sorgulanıyor...');
    const users = await User.findAll({ limit: 3 });
    console.log(`${users.length} kullanıcı bulundu.`);
    
    if (users.length > 0) {
      console.log('İlk kullanıcı ID:', users[0].user_id);
      
      // 2. Satıcı Sorgula
      console.log('\nBu kullanıcı için satıcı bilgisi sorgulanıyor...');
      const seller = await Seller.findOne({ where: { user_id: users[0].user_id } });
      
      if (seller) {
        console.log('Satıcı kaydı bulundu!');
        console.log(seller.toJSON());
      } else {
        console.log('Satıcı kaydı bulunamadı.');
        
        // 3. Satıcı Oluştur (eğer yoksa)
        console.log('\nYeni bir satıcı kaydı oluşturuluyor...');
        try {
          const newSeller = await Seller.create({
            user_id: users[0].user_id,
            business_name: 'Test İşletmesi',
            business_type: 'other',
            business_description: 'Bu bir test işletmesidir',
            is_verified: false,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          });
          
          console.log('Satıcı kaydı başarıyla oluşturuldu!');
          console.log(newSeller.toJSON());
        } catch (error) {
          console.error('Satıcı kaydı oluşturma hatası:', error);
          if (error.name === 'SequelizeValidationError') {
            console.error('Validasyon hataları:');
            error.errors.forEach(err => {
              console.error(` - ${err.path}: ${err.message}`);
            });
          }
        }
      }
    } else {
      console.log('Hiç kullanıcı bulunamadı.');
    }
    
    console.log('\nSeller tablosunun açıklaması:');
    try {
      const [results] = await sequelize.query('DESCRIBE sellers');
      console.table(results);
    } catch (error) {
      console.error('Tablo açıklama hatası:', error.message);
    }
    
    console.log('------------------------------------');
    console.log('Test tamamlandı.');
    
  } catch (error) {
    console.error('Test hatası:', error);
  } finally {
    await sequelize.close();
  }
}

testSellerCreation();