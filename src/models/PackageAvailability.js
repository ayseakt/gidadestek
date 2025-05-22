// models/PackageAvailability.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PackageAvailability = sequelize.define('PackageAvailability', {
  availability_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  package_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'food_packages',
      key: 'package_id'
    }
  },
  day_of_week: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 6
    }
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'package_availability',
  timestamps: false
});

module.exports = PackageAvailability;