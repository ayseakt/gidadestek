import React, { useState, useEffect } from 'react';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaLock, 
  FaShieldAlt, 
  FaCamera, 
  FaCheck, 
  FaSave,
  FaStore,
  FaClipboardList,
  FaTag,
  FaStar
} from 'react-icons/fa';
import { 
  getUserProfile, 
  updateUserProfile, 
  changePassword, 
  uploadProfilePicture,
  enableTwoFactor,
  verifyTwoFactor,
  disableTwoFactor,
  getSellerProfile,
  updateSellerProfile
} from '../services/userService';
import './UserProfile.css';

function SellerProfile() {
  // User data state (temel kullanıcı bilgileri)
  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    profileImage: null,
  });

  // Seller data state (satıcıya özel bilgiler)
  const [sellerData, setSellerData] = useState({
    business_name: '',
    business_type: '',
    business_description: '',
    rating: 0,
    total_ratings: 0,
    is_verified: false,
    isProfileComplete: false
  });

  // Form states
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [sellerFormData, setSellerFormData] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [activeTab, setActiveTab] = useState('business');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [imageFile, setImageFile] = useState(null);

  // İş türleri için seçenekler
  const businessTypes = [
    { value: 'restaurant', label: 'Restoran' },
    { value: 'market', label: 'Market' },
    { value: 'cafe', label: 'Kafe' },
    { value: 'bakery', label: 'Fırın' },
    { value: 'grocery', label: 'Bakkal' },
    { value: 'other', label: 'Diğer' }
  ];

  // Profil bilgilerini yükle
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        
        // Kullanıcı profili ve satıcı profili bilgilerini paralel olarak çek
        const [userResponse, sellerResponse] = await Promise.all([
          getUserProfile(),
          getSellerProfile()
        ]);
        
        if (userResponse.success) {
          const profileData = {
            first_name: userResponse.user.first_name || '',
            last_name: userResponse.user.last_name || '',
            name: userResponse.user.name || '',
            email: userResponse.user.email || '',
            phone: userResponse.user.phone || '',
            profileImage: userResponse.user.profile_picture 
              ? `http://localhost:5051${userResponse.user.profile_picture}` 
              : null,
            bio: userResponse.user.bio || ''
          };
          
          setUserData(profileData);
          setFormData(profileData);
          setTwoFactorEnabled(userResponse.user.two_factor_enabled || false);
        }

        if (sellerResponse.success) {
          const sellerProfileData = {
            business_name: sellerResponse.data.business_name || '',
            business_type: sellerResponse.data.business_type || '',
            business_description: sellerResponse.data.business_description || '',
            rating: sellerResponse.data.rating || 0,
            total_ratings: sellerResponse.data.total_ratings || 0,
            is_verified: sellerResponse.data.is_verified || false,
            isProfileComplete: sellerResponse.data.isProfileComplete || false
          };
          
          setSellerData(sellerProfileData);
          setSellerFormData(sellerProfileData);
        } else {
          showNotification('Satıcı profili bulunamadı.', 'error');
        }
      } catch (error) {
        console.error('Profil yükleme hatası:', error);
        showNotification('Profil bilgileri yüklenemedi.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  // Handle input changes for personal info
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle input changes for seller info
  const handleSellerInputChange = (e) => {
    const { name, value } = e.target;
    setSellerFormData({
      ...sellerFormData,
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
      setSellerFormData({...sellerData});
    }
    setEditMode(!editMode);
  };

  // Save personal information
  const savePersonalInfo = async () => {
    try {
      const updateData = {
        firstName: formData.first_name,
        lastName: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio
      };

      const response = await updateUserProfile(updateData);
      
      if (response.success) {
        if (imageFile) {
          await handleProfileImageUpload();
        }
        
        setUserData({...formData});
        setEditMode(false);
        showNotification('Kişisel bilgileriniz başarıyla güncellendi.', 'success');
      } else {
        showNotification(response.message || 'Bir hata oluştu.', 'error');
      }
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      showNotification(error.message || 'Bilgiler güncellenirken bir hata oluştu.', 'error');
    }
  };

  // Save seller information
  const saveSellerInfo = async () => {
    try {
      const response = await updateSellerProfile(sellerFormData);
      
      if (response.success) {
        setSellerData({...sellerFormData});
        setEditMode(false);
        showNotification('İşletme bilgileriniz başarıyla güncellendi.', 'success');
      } else {
        showNotification(response.message || 'Bir hata oluştu.', 'error');
      }
    } catch (error) {
      console.error('Satıcı profili güncelleme hatası:', error);
      showNotification(error.message || 'İşletme bilgileri güncellenirken bir hata oluştu.', 'error');
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
        const response = await enableTwoFactor();
        
        if (response.success) {
          setShowVerificationModal(true);
        } else {
          showNotification(response.message || 'İki adımlı doğrulama etkinleştirilemedi.', 'error');
        }
      } else {
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

    setTimeout(() => {
      setNotification({
        show: false,
        message: '',
        type: ''
      });
    }, 3000);
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
          {sellerData.is_verified && (
            <div className="verified-badge">
              <FaCheck /> Doğrulanmış Satıcı
            </div>
          )}
          {sellerData.rating > 0 && (
            <div className="rating-display">
              <FaStar /> {sellerData.rating} ({sellerData.total_ratings} değerlendirme)
            </div>
          )}
        </div>
        
        <div 
          className={`profile-menu-item ${activeTab === 'business' ? 'active' : ''}`}
          onClick={() => setActiveTab('business')}
        >
          <FaStore /> İşletme Bilgileri
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
      </div>

      {/* Main Content Area */}
      <div className="profile-content">
        {/* Notification */}
        {notification.show && (
          <div className={`profile-notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

        {/* Business Information Tab */}
        {activeTab === 'business' && (
          <div className="profile-section">
            <div className="profile-section-header">
              <h2>İşletme Bilgileri</h2>
              <button className="edit-button" onClick={toggleEditMode}>
                {editMode ? 'İptal' : 'Düzenle'}
              </button>
            </div>

            <div className="profile-form">
              <div className="form-group">
                <label><FaStore /> İşletme Adı</label>
                {editMode ? (
                  <input 
                    type="text" 
                    name="business_name" 
                    value={sellerFormData.business_name} 
                    onChange={handleSellerInputChange} 
                    placeholder="İşletmenizin adını girin"
                  />
                ) : (
                  <p>{sellerData.business_name || 'Henüz belirtilmemiş'}</p>
                )}
              </div>

              <div className="form-group">
                <label><FaTag /> İşletme Türü</label>
                {editMode ? (
                  <select 
                    name="business_type" 
                    value={sellerFormData.business_type} 
                    onChange={handleSellerInputChange}
                  >
                    <option value="">Seçiniz</option>
                    {businessTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p>
                    {businessTypes.find(type => type.value === sellerData.business_type)?.label || 'Henüz belirtilmemiş'}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label><FaClipboardList /> İşletme Açıklaması</label>
                {editMode ? (
                  <textarea 
                    name="business_description" 
                    value={sellerFormData.business_description || ''} 
                    onChange={handleSellerInputChange}
                    rows="4"
                    placeholder="İşletmeniz hakkında bilgi verin"
                  />
                ) : (
                  <p>{sellerData.business_description || 'Henüz bir açıklama eklenmemiş.'}</p>
                )}
              </div>

              {editMode && activeTab === 'business' && (
                <div className="form-actions">
                  <button className="save-button" onClick={saveSellerInfo}>
                    <FaSave /> İşletme Bilgilerini Kaydet
                  </button>
                </div>
              )}
            </div>

            {!sellerData.isProfileComplete && (
              <div className="profile-warning">
                <p>⚠️ İşletme profilinizi tamamlayın ve daha fazla müşteriye ulaşın!</p>
              </div>
            )}
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

              {editMode && activeTab === 'personal' && (
                <div className="form-actions">
                  <button className="save-button" onClick={savePersonalInfo}>
                    <FaSave /> Kişisel Bilgileri Kaydet
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
    </div>
  );
}

export default SellerProfile;