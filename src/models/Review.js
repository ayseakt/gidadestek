const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define('Review', {
    review_id: {
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
    order_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'orders',
        key: 'order_id'
      }
    },
    package_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'food_packages',
        key: 'package_id'
      }
    },
    rating: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 5,
      validate: {
        min: 1,
        max: 5
      }
    },
    food_quality_rating: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 5,
      validate: {
        min: 1,
        max: 5
      }
    },
    service_rating: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 5,
      validate: {
        min: 1,
        max: 5
      }
    },
    value_rating: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 5,
      validate: {
        min: 1,
        max: 5
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_visible: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    is_anonymous: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    helpful_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: 0
    },
    response_text: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    response_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'reviews_new',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  });

  // İlişkiler
  Review.associate = (models) => {
    // Kullanıcı ile ilişki
    Review.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // Satıcı ile ilişki
    Review.belongsTo(models.Seller, {
      foreignKey: 'seller_id',
      as: 'seller'
    });

    // Sipariş ile ilişki (optional)
    Review.belongsTo(models.Order, {
      foreignKey: 'order_id',
      as: 'order'
    });

    // Paket ile ilişki (optional)
    Review.belongsTo(models.FoodPackage, {
      foreignKey: 'package_id',
      as: 'package'
    });
  };

  return Review;
};