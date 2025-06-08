const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PackageCategory = sequelize.define('PackageCategory', {
  category_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  icon: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'package_categories',
  timestamps: false
});
PackageCategory.associate = function(models) {
  PackageCategory.hasMany(models.FoodPackage, {
    foreignKey: 'category_id',
    as: 'packages'
  });
};

module.exports = PackageCategory;