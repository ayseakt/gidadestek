import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaShieldAlt, FaCamera, FaCheck, FaSave,FaCreditCard, FaPlus, FaTrash, FaEdit, FaStar } from 'react-icons/fa';
import { 
  getUserProfile, 
  updateUserProfile, 
  changePassword, 
  uploadProfilePicture,
  enableTwoFactor,
  verifyTwoFactor,
  disableTwoFactor 
} from '../services/userService';
import './UserProfile.css';
import { 
  getUserPaymentCards, 
  addPaymentCard, 
  updatePaymentCard, 
  deletePaymentCard, 
  setDefaultPaymentCard,
  formatCardNumber,
  detectCardBrand,
  validateCardNumber 
} from '../services/paymentCardService';

function UserProfile() {
  // User data state
  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    profileImage: null,
  });

  // Form states
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [activeTab, setActiveTab] = useState('personal');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [imageFile, setImageFile] = useState(null);
  const [paymentCards, setPaymentCards] = useState([]);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [cardFormData, setCardFormData] = useState({
    card_number: '',
    card_holder_name: '',
    expiry_month: '',
    expiry_year: '',
    card_nickname: '',
    card_type: 'credit'
  });
  // Profil bilgilerini yükle
  useEffect(() => {

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await getUserProfile();
        
        if (response.success) {
          const profileData = {
            first_name: response.user.first_name || '',
            last_name: response.user.last_name || '',
            name: response.user.name || '',
            email: response.user.email || '',
            phone: response.user.phone || '',
            profileImage: response.user.profile_picture 
              ? `http://localhost:5051${response.user.profile_picture}` 
              : null,
            bio: response.user.bio || ''
          };
          
          setUserData(profileData);
          setFormData(profileData);
          setTwoFactorEnabled(response.user.two_factor_enabled || false);
        } else {
          showNotification('Profil bilgileri yüklenemedi.', 'error');
        }
      } catch (error) {
        console.error('Profil yükleme hatası:', error);
        showNotification('Profil bilgileri yüklenemedi.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
    // Kullanıcının kartlarını yükle
    const fetchPaymentCards = async () => {
      try {
        const response = await getUserPaymentCards();
        if (response.success) {
          setPaymentCards(response.cards || []);
        }
      } catch (error) {
        console.error('Kartlar yüklenemedi:', error);
      }
    };

    fetchPaymentCards();
  }, []);

  // Handle input changes for personal info
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle input changes for password form
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({
      ...passwordForm,
      [name]: value
    });
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (editMode) {
      // If exiting edit mode without saving, reset form data
      setFormData({...userData});
    }
    setEditMode(!editMode);
  };

  // Save personal information
  const savePersonalInfo = async () => {
    try {
      // API request data'yı hazırla
      const updateData = {
        firstName: formData.first_name,
        lastName: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio
      };

      const response = await updateUserProfile(updateData);
      
      if (response.success) {
        // Profil resmini yükle (eğer değiştiyse)
        if (imageFile) {
          await handleProfileImageUpload();
        }
        
        setUserData({...formData});
        setEditMode(false);
        showNotification('Bilgileriniz başarıyla güncellendi.', 'success');
      } else {
        showNotification(response.message || 'Bir hata oluştu.', 'error');
      }
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      showNotification(error.message || 'Bilgiler güncellenirken bir hata oluştu.', 'error');
    }
  };

  // Profil resmini yükle
  const handleProfileImageUpload = async () => {
    try {
      if (!imageFile) return;

      const response = await uploadProfilePicture(imageFile);
      
      if (response.success) {
        setFormData({
          ...formData,
          profileImage: `http://localhost:5051${response.profilePicture}`
        });
        setUserData({
          ...userData,
          profileImage: `http://localhost:5051${response.profilePicture}`
        });
        setImageFile(null);
        return true;
      } else {
        showNotification(response.message || 'Profil resmi yüklenemedi.', 'error');
        return false;
      }
    } catch (error) {
      console.error('Profil resmi yükleme hatası:', error);
      showNotification('Profil resmi yüklenirken bir hata oluştu.', 'error');
      return false;
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotification('Yeni şifreler eşleşmiyor.', 'error');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      showNotification('Şifreniz en az 8 karakter olmalıdır.', 'error');
      return;
    }
    
    try {
      const response = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      if (response.success) {
        // Reset form and show success message
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        showNotification('Şifreniz başarıyla değiştirildi.', 'success');
      } else {
        showNotification(response.message || 'Şifre değiştirilemedi.', 'error');
      }
    } catch (error) {
      console.error('Şifre değiştirme hatası:', error);
      showNotification(error.message || 'Şifre değiştirilirken bir hata oluştu.', 'error');
    }
  };

  // Toggle two-factor authentication
  const toggleTwoFactor = async () => {
    try {
      if (!twoFactorEnabled) {
        // İki adımlı doğrulamayı etkinleştir
        const response = await enableTwoFactor();
        
        if (response.success) {
          setShowVerificationModal(true);
        } else {
          showNotification(response.message || 'İki adımlı doğrulama etkinleştirilemedi.', 'error');
        }
      } else {
        // İki adımlı doğrulamayı devre dışı bırak
        const response = await disableTwoFactor();
        
        if (response.success) {
          setTwoFactorEnabled(false);
          showNotification('İki adımlı doğrulama devre dışı bırakıldı.', 'info');
        } else {
          showNotification(response.message || 'İki adımlı doğrulama devre dışı bırakılamadı.', 'error');
        }
      }
    } catch (error) {
      console.error('İki adımlı doğrulama hatası:', error);
      showNotification('İşlem sırasında bir hata oluştu.', 'error');
    }
  };

  // Verify code for two-factor auth
  const verifyCode = async () => {
    try {
      if (verificationCode.length !== 6) {
        showNotification('Geçersiz doğrulama kodu.', 'error');
        return;
      }
      
      const response = await verifyTwoFactor(verificationCode);
      
      if (response.success) {
        setTwoFactorEnabled(true);
        setShowVerificationModal(false);
        showNotification('İki adımlı doğrulama başarıyla etkinleştirildi!', 'success');
        setVerificationCode('');
      } else {
        showNotification(response.message || 'Doğrulama kodunu doğrulama başarısız.', 'error');
      }
    } catch (error) {
      console.error('Doğrulama kodu hatası:', error);
      showNotification('Doğrulama işlemi sırasında bir hata oluştu.', 'error');
    }
  };

  // Handle profile image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({
          ...formData,
          profileImage: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Show notification
  const showNotification = (message, type) => {
    setNotification({
      show: true,
      message,
      type
    });

    // Hide notification after 3 seconds
    setTimeout(() => {
      setNotification({
        show: false,
        message: '',
        type: ''
      });
    }, 3000);
  };
  // Kart formu submit
const handleCardSubmit = async (e) => {
  e.preventDefault();
  
  // Validasyon
  if (!validateCardNumber(cardFormData.card_number)) {
    showNotification('Geçersiz kart numarası.', 'error');
    return;
  }
  
  if (!cardFormData.card_holder_name.trim()) {
    showNotification('Kart sahibi adı gerekli.', 'error');
    return;
  }
  
  if (!cardFormData.expiry_month || !cardFormData.expiry_year) {
    showNotification('Son kullanma tarihi gerekli.', 'error');
    return;
  }
  
  try {
    const cardData = {
      ...cardFormData,
      card_brand: detectCardBrand(cardFormData.card_number),
      last_four_digits: cardFormData.card_number.slice(-4)
    };
    
    let response;
    if (editingCard) {
      response = await updatePaymentCard(editingCard.card_id, cardData);
    } else {
      response = await addPaymentCard(cardData);
    }
    
    if (response.success) {
      // Kartları yeniden yükle
      const cardsResponse = await getUserPaymentCards();
      if (cardsResponse.success) {
        setPaymentCards(cardsResponse.cards || []);
      }
      
      setShowCardModal(false);
      setEditingCard(null);
      resetCardForm();
      showNotification(
        editingCard ? 'Kart başarıyla güncellendi.' : 'Kart başarıyla eklendi.', 
        'success'
      );
    } else {
      showNotification(response.message || 'Kart işlemi başarısız.', 'error');
    }
  } catch (error) {
    console.error('Kart işlemi hatası:', error);
    showNotification('Kart işlemi sırasında bir hata oluştu.', 'error');
  }
};

// Kart silme
const handleDeleteCard = async (cardId) => {
  if (!window.confirm('Bu kartı silmek istediğinizden emin misiniz?')) {
    return;
  }
  
  try {
    const response = await deletePaymentCard(cardId);
    
    if (response.success) {
      setPaymentCards(paymentCards.filter(card => card.card_id !== cardId));
      showNotification('Kart başarıyla silindi.', 'success');
    } else {
      showNotification(response.message || 'Kart silinemedi.', 'error');
    }
  } catch (error) {
    console.error('Kart silme hatası:', error);
    showNotification('Kart silinirken bir hata oluştu.', 'error');
  }
};

// Varsayılan kart ayarlama
const handleSetDefaultCard = async (cardId) => {
  try {
    const response = await setDefaultPaymentCard(cardId);
    
    if (response.success) {
      // Kartları güncelle
      setPaymentCards(paymentCards.map(card => ({
        ...card,
        is_default: card.card_id === cardId
      })));
      showNotification('Varsayılan kart ayarlandı.', 'success');
    } else {
      showNotification(response.message || 'Varsayılan kart ayarlanamadı.', 'error');
    }
  } catch (error) {
    console.error('Varsayılan kart hatası:', error);
    showNotification('İşlem sırasında bir hata oluştu.', 'error');
  }
};

// Kart düzenleme
const handleEditCard = (card) => {
  setEditingCard(card);
  setCardFormData({
    card_number: '', // Güvenlik için boş bırak
    card_holder_name: card.card_holder_name,
    expiry_month: card.expiry_month.toString(),
    expiry_year: card.expiry_year.toString(),
    card_nickname: card.card_nickname || '',
    card_type: card.card_type
  });
  setShowCardModal(true);
};

// Kart formu sıfırlama
const resetCardForm = () => {
  setCardFormData({
    card_number: '',
    card_holder_name: '',
    expiry_month: '',
    expiry_year: '',
    card_nickname: '',
    card_type: 'credit'
  });
};

// Kart formu input değişiklikleri
const handleCardInputChange = (e) => {
  const { name, value } = e.target;
  
  if (name === 'card_number') {
    // Kart numarasını formatla
    const formatted = formatCardNumber(value);
    setCardFormData({
      ...cardFormData,
      [name]: formatted
    });
  } else {
    setCardFormData({
      ...cardFormData,
      [name]: value
    });
  }
};

// Kart markası ikonu alma
const getCardBrandIcon = (brand) => {
  const brandIcons = {
    visa: '💳',
    mastercard: '💳',
    amex: '💳',
    discover: '💳',
    diners: '💳',
    jcb: '💳',
    unionpay: '💳'
  };
  return brandIcons[brand] || '💳';
};

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div className="user-profile-container">
      {/* Sidebar / Navigation */}
      <div className="profile-sidebar">
        <div className="profile-user-info">
          <div className="profile-image-container">
            {userData.profileImage ? (
              <img src={userData.profileImage} alt="Profil" className="profile-image" />
            ) : (
              <div className="profile-image-placeholder">
                <FaUser />
              </div>
            )}
          </div>
          <h2>{userData.first_name} {userData.last_name}</h2>
          <p>{userData.email}</p>
          
        </div>
        
        
          <div 
            className={`profile-menu-item ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            <FaUser /> Kişisel Bilgiler
          </div>
          <div 
            className={`profile-menu-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <FaLock /> Güvenlik
          </div>
          <div 
            className={`profile-menu-item ${activeTab === 'twofactor' ? 'active' : ''}`}
            onClick={() => setActiveTab('twofactor')}
          >
            <FaShieldAlt /> İki Adımlı Doğrulama
          </div>
          <div 
            className={`profile-menu-item ${activeTab === 'cards' ? 'active' : ''}`}
            onClick={() => setActiveTab('cards')}
          >
            <FaCreditCard /> Kayıtlı Kartlarım
          </div>
        
      </div>

      {/* Main Content Area */}
      <div className="profile-content">
        {/* Notification */}
        {notification.show && (
          <div className={`profile-notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

        {/* Personal Information Tab */}
        {activeTab === 'personal' && (
          <div className="profile-section">
            <div className="profile-section-header">
              <h2>Kişisel Bilgiler</h2>
              <button className="edit-button" onClick={toggleEditMode}>
                {editMode ? 'İptal' : 'Düzenle'}
              </button>
            </div>

            <div className="profile-form">
              {/* Profile Image */}
              <div className="profile-image-upload">
                <div className="upload-image-container">
                  {formData.profileImage ? (
                    <img src={formData.profileImage} alt="Profil" className="upload-preview" />
                  ) : (
                    <div className="image-placeholder">
                      <FaUser />
                    </div>
                  )}
                  {editMode && (
                    <label className="upload-button">
                      <FaCamera />
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="form-group">
                <label><FaUser /> Ad</label>
                {editMode ? (
                  <input 
                    type="text" 
                    name="first_name" 
                    value={formData.first_name} 
                    onChange={handleInputChange} 
                  />
                ) : (
                  <p>{userData.first_name}</p>
                )}
              </div>

              <div className="form-group">
                <label><FaUser /> Soyad</label>
                {editMode ? (
                  <input 
                    type="text" 
                    name="last_name" 
                    value={formData.last_name} 
                    onChange={handleInputChange} 
                  />
                ) : (
                  <p>{userData.last_name}</p>
                )}
              </div>

              <div className="form-group">
                <label><FaEnvelope /> E-posta</label>
                {editMode ? (
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                  />
                ) : (
                  <p>{userData.email}</p>
                )}
              </div>

              <div className="form-group">
                <label><FaPhone /> Telefon</label>
                {editMode ? (
                  <input 
                    type="tel" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleInputChange} 
                  />
                ) : (
                  <p>{userData.phone}</p>
                )}
              </div>

              <div className="form-group">
                <label>Hakkımda</label>
                {editMode ? (
                  <textarea 
                    name="bio" 
                    value={formData.bio || ''} 
                    onChange={handleInputChange}
                    rows="3"
                  />
                ) : (
                  <p>{userData.bio || 'Henüz bir bilgi eklenmemiş.'}</p>
                )}
              </div>

              {editMode && (
                <div className="form-actions">
                  <button className="save-button" onClick={savePersonalInfo}>
                    <FaSave /> Kaydet
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="profile-section">
            <div className="profile-section-header">
              <h2>Şifre Değiştir</h2>
            </div>

            <form className="password-form" onSubmit={handleChangePassword}>
              <div className="form-group">
                <label><FaLock /> Mevcut Şifre</label>
                <input 
                  type="password" 
                  name="currentPassword" 
                  value={passwordForm.currentPassword} 
                  onChange={handlePasswordChange} 
                  required 
                />
              </div>

              <div className="form-group">
                <label><FaLock /> Yeni Şifre</label>
                <input 
                  type="password" 
                  name="newPassword" 
                  value={passwordForm.newPassword} 
                  onChange={handlePasswordChange} 
                  required 
                  minLength="8"
                />
                <small>Şifreniz en az 8 karakter olmalıdır.</small>
              </div>

              <div className="form-group">
                <label><FaLock /> Yeni Şifre (Tekrar)</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  value={passwordForm.confirmPassword} 
                  onChange={handlePasswordChange} 
                  required 
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="save-button">
                  <FaSave /> Şifreyi Değiştir
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Two Factor Authentication Tab */}
        {activeTab === 'twofactor' && (
          <div className="profile-section">
            <div className="profile-section-header">
              <h2>İki Adımlı Doğrulama</h2>
            </div>

            <div className="two-factor-content">
              <div className="two-factor-info">
                <FaShieldAlt className="shield-icon" />
                <div>
                  <h3>Hesabınızı koruyun</h3>
                  <p>
                    İki adımlı doğrulama, hesabınıza yapılan girişleri daha güvenli hale getirir. 
                    Her giriş yaptığınızda, telefonunuza SMS ile gönderilen bir doğrulama kodu girmeniz gerekecektir.
                  </p>
                </div>
              </div>

              <div className="two-factor-status">
                <p>
                  <strong>İki adımlı doğrulama:</strong> 
                  <span className={twoFactorEnabled ? 'status-enabled' : 'status-disabled'}>
                    {twoFactorEnabled ? 'Etkin' : 'Devre Dışı'}
                  </span>
                </p>
                <button 
                  className={`two-factor-button ${twoFactorEnabled ? 'disable' : 'enable'}`}
                  onClick={toggleTwoFactor}
                >
                  {twoFactorEnabled ? 'Devre Dışı Bırak' : 'Etkinleştir'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Payment Cards Tab */}
        {activeTab === 'cards' && (
          <div className="profile-section">
            <div className="profile-section-header">
              <h2>Kayıtlı Kartlarım</h2>
              <button 
                className="add-card-button"
                onClick={() => {
                  setEditingCard(null);
                  resetCardForm();
                  setShowCardModal(true);
                }}
              >
                <FaPlus /> Yeni Kart Ekle
              </button>
            </div>

            <div className="payment-cards-list">
              {paymentCards.length === 0 ? (
                <div className="no-cards">
                  <FaCreditCard className="no-cards-icon" />
                  <h3>Henüz kayıtlı kartınız yok</h3>
                  <p>Hızlı ödeme yapabilmek için kartınızı ekleyin.</p>
                </div>
              ) : (
                paymentCards.map((card) => (
                  <div key={card.card_id} className={`payment-card-item ${card.is_default ? 'default-card' : ''}`}>
                    <div className="card-info">
                      <div className="card-header">
                        <span className="card-brand">
                          {getCardBrandIcon(card.card_brand)} {card.card_brand.toUpperCase()}
                        </span>
                        {card.is_default && <span className="default-badge"><FaStar /> Varsayılan</span>}
                      </div>
                      <div className="card-number">**** **** **** {card.last_four_digits}</div>
                      <div className="card-details">
                        <span className="card-holder">{card.card_holder_name}</span>
                        <span className="card-expiry">{card.expiry_month.toString().padStart(2, '0')}/{card.expiry_year}</span>
                      </div>
                      {card.card_nickname && (
                        <div className="card-nickname">"{card.card_nickname}"</div>
                      )}
                    </div>
                    
                    <div className="card-actions">
                      {!card.is_default && (
                        <button 
                          className="set-default-btn"
                          onClick={() => handleSetDefaultCard(card.card_id)}
                          title="Varsayılan Yap"
                        >
                          <FaStar />
                        </button>
                      )}
                      <button 
                        className="edit-card-btn"
                        onClick={() => handleEditCard(card)}
                        title="Düzenle"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="delete-card-btn"
                        onClick={() => handleDeleteCard(card.card_id)}
                        title="Sil"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="modal-overlay">
          <div className="verification-modal">
            <h3>Telefonunuzu Doğrulayın</h3>
            <p>{userData.phone} numaralı telefonunuza gönderilen 6 haneli doğrulama kodunu girin.</p>
            
            <div className="verification-code-input">
              <input 
                type="text" 
                maxLength="6" 
                value={verificationCode} 
                onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))} 
                placeholder="______"
              />
            </div>
            
            <div className="verification-actions">
              <button className="cancel-button" onClick={() => setShowVerificationModal(false)}>
                İptal
              </button>
              <button className="verify-button" onClick={verifyCode}>
                <FaCheck /> Doğrula
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Card Modal */}
      {showCardModal && (
        <div className="modal-overlay">
          <div className="card-modal">
            <div className="modal-header">
              <h3>{editingCard ? 'Kartı Düzenle' : 'Yeni Kart Ekle'}</h3>
              <button 
                className="close-modal-btn"
                onClick={() => {
                  setShowCardModal(false);
                  setEditingCard(null);
                  resetCardForm();
                }}
              >
                ×
              </button>
            </div>
            
            <form className="card-form" onSubmit={handleCardSubmit}>
              {!editingCard && (
                <div className="form-group">
                  <label>Kart Numarası</label>
                  <input 
                    type="text" 
                    name="card_number"
                    value={cardFormData.card_number}
                    onChange={handleCardInputChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                    required
                  />
                </div>
              )}
              
              <div className="form-group">
                <label>Kart Sahibi Adı</label>
                <input 
                  type="text" 
                  name="card_holder_name"
                  value={cardFormData.card_holder_name}
                  onChange={handleCardInputChange}
                  placeholder="AHMET YILMAZ"
                  style={{ textTransform: 'uppercase' }}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Ay</label>
                  <select 
                    name="expiry_month"
                    value={cardFormData.expiry_month}
                    onChange={handleCardInputChange}
                    required
                  >
                    <option value="">Ay</option>
                    {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                      <option key={month} value={month}>
                        {month.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Yıl</label>
                  <select 
                    name="expiry_year"
                    value={cardFormData.expiry_year}
                    onChange={handleCardInputChange}
                    required
                  >
                    <option value="">Yıl</option>
                    {Array.from({length: 10}, (_, i) => new Date().getFullYear() + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Kart Tipi</label>
                <select 
                  name="card_type"
                  value={cardFormData.card_type}
                  onChange={handleCardInputChange}
                >
                  <option value="credit">Kredi Kartı</option>
                  <option value="debit">Banka Kartı</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Kart Takma Adı (Opsiyonel)</label>
                <input 
                  type="text" 
                  name="card_nickname"
                  value={cardFormData.card_nickname}
                  onChange={handleCardInputChange}
                  placeholder="İş Kartım, Kişisel Kart vb."
                  maxLength="50"
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setShowCardModal(false);
                    setEditingCard(null);
                    resetCardForm();
                  }}
                >
                  İptal
                </button>
                <button type="submit" className="save-button">
                  <FaSave /> {editingCard ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;