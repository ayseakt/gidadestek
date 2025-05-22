import React, { useState, useRef, useEffect } from 'react';
import { FaUser, FaSignOutAlt, FaCreditCard, FaReceipt, FaUserCog, FaStore } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './ProfileDropdown.css';

function ProfileDropdown({ user, logout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHostMode, setIsHostMode] = useState(false);
  const dropdownRef = useRef(null);

  // Dışarı tıklandığında menüyü kapatma
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Kullanıcı modu değişimi
  const toggleHostMode = () => {
    setIsHostMode(!isHostMode);
    // Burada API'ye kullanıcı modunu değiştirme isteği gönderilebilir
    setIsOpen(false);
  };

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <div className="profile-icon" onClick={() => setIsOpen(!isOpen)}>
        {user.profileImage ? (
          <img src={user.profileImage} alt="Profil" />
        ) : (
          <FaUser />
        )}
        {isHostMode && <span className="host-mode-indicator">Host</span>}
      </div>
      
      {isOpen && (
        <div className="dropdown-menu">
          <div className="user-info">
            <h4>{user.name || 'Kullanıcı'}</h4>
            <p>{user.email}</p>
            {user.accountType && (
              <span className={`account-type ${user.accountType}`}>
                {user.accountType === 'business' ? 'Kurumsal' : 'Bireysel'}
              </span>
            )}
          </div>
          
          <div className="dropdown-divider"></div>
          
          <Link to="/profile" className="dropdown-item">
            <FaUserCog /> Profil Bilgilerim
          </Link>
          
          <Link to="/account" className="dropdown-item">
            <FaCreditCard /> Hesap ve Ödemeler
          </Link>
          
          <Link to="/orders" className="dropdown-item">
            <FaReceipt /> Siparişlerim
          </Link>
          
          {isHostMode ? (
            <div className="dropdown-item mode-toggle" onClick={toggleHostMode}>
              <FaSignOutAlt /> Bağışçı Moduna Geç
            </div>
          ) : (
            <div className="dropdown-item mode-toggle" onClick={toggleHostMode}>
              <FaStore /> Satıcı Moduna Geç
            </div>
          )}
          
          <div className="dropdown-divider"></div>
          
          <div className="dropdown-item" onClick={logout}>
            <FaSignOutAlt /> Çıkış Yap
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;