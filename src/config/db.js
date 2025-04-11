const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false, // SQL sorgularını terminale yazdırmamak için
  }
);

sequelize
  .authenticate()
  .then(() => console.log("✅ MySQL bağlantısı başarılı!"))
  .catch((err) => console.error("❌ MySQL bağlantı hatası:", err));

module.exports = sequelize;
