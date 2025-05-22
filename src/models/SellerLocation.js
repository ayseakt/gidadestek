// src/models/SellerLocation.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SellerLocation = sequelize.define('SellerLocation', {
  id: {
  type: DataTypes.INTEGER,
  primaryKey: true,
  autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  createdAt: {
  type: DataTypes.DATE,
  allowNull: false,
  defaultValue: DataTypes.NOW
  },
  updatedAt: {
  type: DataTypes.DATE,
  allowNull: false,
  defaultValue: DataTypes.NOW
  }
});

module.exports = SellerLocation;
