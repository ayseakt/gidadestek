// config/db.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'sofrapay',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql', // veya kullandığınız veritabanı ('postgres', 'sqlite', 'mariadb', 'mssql' vb.)
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);



// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database bağlantısı başarılı.');
  } catch (error) {
    console.error('❌ Database bağlantı hatası:', error);
  }
};

testConnection();

module.exports = sequelize;