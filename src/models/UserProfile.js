const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserProfile = sequelize.define('UserProfile', {
  profile_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: {
      model: 'Users',
      key: 'user_id'
    }
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  profile_picture: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
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
  tableName: 'user_profiles',
  timestamps: false
});

// 🔗 İlişki tanımı - ALIAS DEĞİŞTİRİLDİ
UserProfile.associate = (models) => {
  UserProfile.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user' // 'profile' yerine 'user' kullanıldı
  });
};

module.exports = UserProfile;