// models/CartItem.js - Düzeltilmiş ve güncellenmiş versiyon
module.exports = (sequelize, DataTypes) => {
  const CartItem = sequelize.define('CartItem', {
    cart_item_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    package_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'food_packages',
        key: 'package_id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
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
    added_at: {
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
    tableName: 'shopping_cart',
    timestamps: true,
    createdAt: 'added_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'package_id']
      }
    ]
  });

  // ⭐ DÜZELTME: Associate function'ı models yüklendikten sonra çalışacak şekilde ayarla
  CartItem.associate = function(models) {
    console.log('CartItem associations being set up...');
    
    // User ile many-to-one ilişki
    if (models.User) {
      CartItem.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      console.log('✅ CartItem -> User association created');
    } else {
      console.warn('⚠️ User model not found for CartItem association');
    }

    // FoodPackage ile many-to-one ilişki
    if (models.FoodPackage) {
      CartItem.belongsTo(models.FoodPackage, {
        foreignKey: 'package_id',
        as: 'package'
      });
      console.log('✅ CartItem -> FoodPackage association created');
    } else {
      console.warn('⚠️ FoodPackage model not found for CartItem association');
    }
  };

  return CartItem;
};