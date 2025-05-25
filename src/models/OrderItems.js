// models/OrderItem.js
module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define('OrderItem', {
    item_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    order_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'order_id'
      }
    },
    package_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'food_packages',
        key: 'package_id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        isInt: true
      }
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        isFloat: true
      }
    },
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        isFloat: true
      }
    },
    item_status: {
      type: DataTypes.ENUM('ordered', 'ready', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'ordered'
    }
  }, {
    tableName: 'order_items',
    timestamps: false
  });

  OrderItem.associate = function(models) {
    // Order ile many-to-one ilişki
    OrderItem.belongsTo(models.Order, {
      foreignKey: 'order_id',
      as: 'order'
    });

    // FoodPackage ile many-to-one ilişki
    OrderItem.belongsTo(models.FoodPackage, {
      foreignKey: 'package_id',
      as: 'package'
    });
  };

  return OrderItem;
};