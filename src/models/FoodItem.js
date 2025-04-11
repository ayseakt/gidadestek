const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const FoodItem = sequelize.define("FoodItem", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  location: {
    type: DataTypes.STRING,
  },
  pickup_time: {
    type: DataTypes.STRING, // alternatif olarak DATE de olabilir
  },
  price: {
    type: DataTypes.STRING,
  },
  image_url: {
    type: DataTypes.STRING,
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 5.0,
  },
  distance: {
    type: DataTypes.STRING,
  },
});

module.exports = FoodItem;
