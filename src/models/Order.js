// models/Order.js
module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    order_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    seller_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'sellers',
        key: 'seller_id'
      }
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        isFloat: true
      }
    },
    order_status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'ready', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'pending'
    },
    order_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    pickup_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    pickup_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cancellation_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'orders',
    timestamps: true,
    createdAt: 'order_date',
    updatedAt: 'updated_at'
  });

  Order.associate = function(models) {
    // User ile many-to-one ilişki
    Order.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // Seller ile many-to-one ilişki
    Order.belongsTo(models.Seller, {
      foreignKey: 'seller_id',
      as: 'seller'
    });

    // OrderItems ile one-to-many ilişki
    Order.hasMany(models.OrderItem, {
      foreignKey: 'order_id',
      as: 'items'
    });

    // OrderStatusHistory ile one-to-many ilişki
    Order.hasMany(models.OrderStatusHistory, {
      foreignKey: 'order_id',
      as: 'statusHistory'
    });
  };

  return Order;
};