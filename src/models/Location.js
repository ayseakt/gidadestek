// Location.js - Op import sorunu düzeltilmiş versiyon
const { DataTypes, Op } = require('sequelize'); // ✅ Op eklendi
const sequelize = require('../config/db');

const Location = sequelize.define('locations', {
  location_id: {
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
    },
    onDelete: 'CASCADE'
  },
  location_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [1, 255]
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  city: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  district: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  postal_code: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    validate: {
      min: -90,
      max: 90
    }
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    validate: {
      min: -180,
      max: 180
    }
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    validate: {
      // ✅ DÜZELTİLDİ: Op artık tanımlı
      async checkDefaultAddress(value) {
        if (value === true) {
          try {
            const existingDefault = await Location.findOne({
              where: {
                user_id: this.user_id,
                is_default: true,
                location_id: {
                  [Op.ne]: this.location_id || 0 // ✅ Op artık çalışır
                }
              }
            });

            if (existingDefault) {
              throw new Error('Kullanıcının zaten bir varsayılan adresi var');
            }
          } catch (error) {
            if (error.message === 'Kullanıcının zaten bir varsayılan adresi var') {
              throw error;
            }
            console.error('Default address validation error:', error);
          }
        }
      }
    }
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
  tableName: 'locations',
  timestamps: false,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['user_id', 'is_default']
    },
    {
      fields: ['latitude', 'longitude']
    }
  ],
validate: {
  async checkDefaultAddress() {
    if (this.is_default) {
      if (!this.user_id) {
        throw new Error('user_id eksik. Varsayılan adres kontrolü yapılamaz.');
      }
      const existingDefault = await Location.findOne({
        where: {
          user_id: this.user_id,
          is_default: true,
          location_id: { [Op.ne]: this.location_id }
        }
      });
      if (existingDefault) {
        throw new Error('Bir kullanıcının sadece bir varsayılan adresi olabilir');
      }
    }
  }
},

  hooks: {
    beforeCreate: async (location, options) => {
      if (location.user_id) {
        const existingCount = await Location.count({
          where: { user_id: location.user_id }
        });
        
        if (existingCount === 0) {
          location.is_default = true;
        }
      }
    },
    
    beforeUpdate: async (location, options) => {
      if (location.changed('is_default') && location.is_default === true) {
        await Location.update(
          { is_default: false },
          {
            where: {
              user_id: location.user_id,
              location_id: { [Op.ne]: location.location_id }, // ✅ Op artık tanımlı
            },
            transaction: options.transaction
          }
        );
      }
    }
  }
});

Location.associate = function(models) {
  Location.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  if (models.PackageLocation) {
    Location.hasMany(models.PackageLocation, {
      foreignKey: 'location_id',
      as: 'packageLocations'
    });
  }
};

module.exports = Location;