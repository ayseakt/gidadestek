// models/OrderStatusHistory.js
module.exports = (sequelize, DataTypes) => {
  const OrderStatusHistory = sequelize.define('OrderStatusHistory', {
    history_id: {
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
    old_status: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    new_status: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    changed_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    changed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'order_status_history',
    timestamps: false
  });

  OrderStatusHistory.associate = function(models) {
    // Order ile many-to-one ilişki
    OrderStatusHistory.belongsTo(models.Order, {
      foreignKey: 'order_id',
      as: 'order'
    });

    // User ile many-to-one ilişki (değişikliği yapan kişi)
    OrderStatusHistory.belongsTo(models.User, {
      foreignKey: 'changed_by',
      as: 'changedBy'
    });
  };

  return OrderStatusHistory;
};