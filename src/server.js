require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/db");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5050;

// ROUTES
const foodRoutes = require("./routes/food");
app.use("/api/foods", foodRoutes);

// DB Test
sequelize.sync()
  .then(() => console.log("✅ Veritabanı senkronize edildi!"))
  .catch(err => console.error("❌ Veritabanı hatası:", err));

app.get("/", (req, res) => {
  res.send("Gıda Destek API Çalışıyor!");
});

app.listen(PORT, () => {
  console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`);
});