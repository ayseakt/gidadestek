import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { FaTimes, FaSearch, FaPlus, FaMinus, FaMapMarkerAlt } from 'react-icons/fa';
import './AddressButton.css';
import { useAuth } from '../context/authContext';
import LocationService from '../services/locationService';

const AddressButton = () => {
  const { user } = useAuth();
  
  // Kullanıcı ID'sini al - farklı kaynaklardan
  const getUserId = () => {
    // 1. Context'ten al
    if (user?.id) return user.id;
    if (user?.user_id) return user.user_id;
    if (user?.userId) return user.userId;
    
    // 2. LocalStorage'dan al
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        return parsed.id || parsed.user_id || parsed.userId;
      }
    } catch (error) {
      console.error('LocalStorage user parse hatası:', error);
    }
    
    return null;
  };

 const finalUserId = useMemo(() => {
  if (user?.id) return user.id;
  if (user?.user_id) return user.user_id;
  if (user?.userId) return user.userId;
  
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      return parsed.id || parsed.user_id || parsed.userId;
    }
  } catch (error) {
    console.error('LocalStorage user parse hatası:', error);
  }
  
  return null;
}, [user]);



  const [selectedAddressName, setSelectedAddressName] = useState('');
  const [showAddressPanel, setShowAddressPanel] = useState(false);
  const [showMapPanel, setShowMapPanel] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: 41.0082, lng: 28.9784 }); // İstanbul merkez
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [addressName, setAddressName] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [loading, setLoading] = useState(false);
  
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const searchBoxRef = useRef(null);
  const autocompleteRef = useRef(null);

  // API endpoint'i
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5051/api';
// Bu kodu değiştirin:
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    console.log('Token kontrolü:', token ? 'Token mevcut' : 'Token bulunamadı');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }, []);

  // Kayıtlı adresleri veritabanından yükle
// Bu kodu değiştirin:
const loadSavedAddresses = useCallback(async () => {
  if (!finalUserId) {
    console.warn('loadSavedAddresses - userId yok:', finalUserId);
    return;
  }
  
  try {
    setLoading(true);
    console.log('Adresler yükleniyor, userId:', finalUserId);
    
    const response = await fetch(`${API_URL}/locations`, {
      method: 'GET',
      headers: getAuthHeader()
    });

    console.log('Adres yükleme response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Yüklenen adres verisi:', data);
      
      if (data.success && data.data) {
        const formattedAddresses = data.data.map(addr => ({
          id: addr.location_id,
          name: addr.location_name,
          address: addr.address,
          lat: parseFloat(addr.latitude) || 0,
          lng: parseFloat(addr.longitude) || 0,
          city: addr.city,
          district: addr.district,
          isDefault: addr.is_default
        }));
        
        console.log('Formatlanmış adresler:', formattedAddresses);
        setSavedAddresses(formattedAddresses);
        
        const defaultAddress = formattedAddresses.find(addr => addr.isDefault);
        if (defaultAddress && !selectedAddress) {
          setSelectedAddress(defaultAddress.address);
          setSelectedAddressName(defaultAddress.name);
          localStorage.setItem('selectedAddress', defaultAddress.address);
          localStorage.setItem('selectedAddressId', defaultAddress.id.toString());
          console.log('Varsayılan adres seçildi:', defaultAddress);
        }
      }
    } else {
      const errorData = await response.json();
      console.error('Adresler yüklenemedi:', response.status, errorData);
    }
  } catch (error) {
    console.error('Adres yükleme hatası:', error);
  } finally {
    setLoading(false);
  }
}, [finalUserId, selectedAddress, API_URL]); // Bağımlılıkları ekleyin

  // Yeni adres kaydet
  const saveAddressToDatabase = async (addressData) => {
    if (!finalUserId) {
      console.error('saveAddressToDatabase - userId yok');
      return false;
    }
    
    try {
      console.log('Adres kaydediliyor:', addressData);
      
      const response = await fetch(`${API_URL}/locations`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
          location_name: addressData.name,
          address: addressData.address,
          city: addressData.city || 'İstanbul',
          district: addressData.district || '',
          latitude: addressData.lat,
          longitude: addressData.lng,
          is_default: savedAddresses.length === 0,
          address_type: 'home'
        })
      });

      console.log('Adres kaydetme response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Adres kaydetme response:', data);
        if (data.success) {
          await loadSavedAddresses();
          return true;
        }
      } else {
        const errorData = await response.json();
        console.error('Adres kaydetme hatası:', errorData);
      }
      return false;
    } catch (error) {
      console.error('Adres kaydetme hatası:', error);
      return false;
    }
  };

  // ✅ DÜZELTİLMİŞ: Varsayılan adres değiştirme endpoint'i
  const setDefaultAddress = async (addressId) => {
    if (!finalUserId) {
      console.error('setDefaultAddress - userId yok');
      return { success: false, message: 'Kullanıcı bilgisi eksik' };
    }
    
    try {
      console.log('Varsayılan adres değiştiriliyor:', { userId: finalUserId, addressId });
      
      // ✅ DÜZELTİLDİ: Doğru endpoint kullan - /api/locations/{id} (PATCH)
      const response = await fetch(`${API_URL}/locations/${addressId}`, {
        method: 'PATCH', // ✅ PATCH metodu kullan
        headers: getAuthHeader(),
        body: JSON.stringify({
          is_default: true
        })
      });

      console.log('Varsayılan adres değiştirme response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Varsayılan adres değiştirme response:', data);
        return { success: true, data: data.data };
      } else {
        const errorData = await response.json();
        console.error('Varsayılan adres değiştirme hatası:', errorData);
        return { success: false, message: errorData.message || 'Bilinmeyen hata' };
      }
    } catch (error) {
      console.error('Varsayılan adres değiştirme hatası:', error);
      return { success: false, message: error.message };
    }
  };

  // Component mount olduğunda adresleri yükle
  useEffect(() => {
    console.log('useEffect çalışıyor, finalUserId:', finalUserId);
    if (finalUserId) {
      loadSavedAddresses();
    } else {
      console.warn('userId olmadığı için adresler yüklenmiyor');
    }
  }, [finalUserId]);

  // Google Maps API'sini yükleyen fonksiyon
  useEffect(() => {
    if (showMapPanel && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCDLCFkp4u74d7NrR7XUS-HhDLNF3xq9Is&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
          const waitForPlaces = setInterval(() => {
            if (window.google?.maps?.places) {
              clearInterval(waitForPlaces);
              initMap();
            }
          }, 100);
        };

      document.head.appendChild(script);
    } else if (showMapPanel && window.google) {
      initMap();
    }
  }, [showMapPanel]);

  // Google Maps'i başlatan fonksiyon
  const initMap = () => {
    if (!mapRef.current) return;
    
    const mapOptions = {
      center: mapCenter,
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false
    };
    
    mapInstance.current = new window.google.maps.Map(mapRef.current, mapOptions);

    // Marker oluşturma
    markerRef.current = new window.google.maps.Marker({
      position: mapCenter,
      map: mapInstance.current,
      animation: window.google.maps.Animation.DROP,
      draggable: true
    });

    // Marker sürüklendiğinde adres bilgisini güncelle
    markerRef.current.addListener('dragend', () => {
      const position = markerRef.current.getPosition();
      setSelectedLocation({
        lat: position.lat(),
        lng: position.lng()
      });
      
      // Reverse geocoding - koordinatlardan adres bilgisini al
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat: position.lat(), lng: position.lng() } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setAddressDetails(results[0].formatted_address);
        }
      });
    });

    // Haritaya tıklandığında marker'ı taşı
    mapInstance.current.addListener('click', (e) => {
      markerRef.current.setPosition(e.latLng);
      const position = e.latLng;
      setSelectedLocation({
        lat: position.lat(),
        lng: position.lng()
      });
      
      // Reverse geocoding
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat: position.lat(), lng: position.lng() } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setAddressDetails(results[0].formatted_address);
        }
      });
    });

    // Arama kutusu için autocomplete
      if (searchBoxRef.current && window.google?.maps?.places) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(searchBoxRef.current, {
          types: ['geocode']
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (!place.geometry) return;

          mapInstance.current.setCenter(place.geometry.location);
          mapInstance.current.setZoom(17);
          markerRef.current.setPosition(place.geometry.location);

          const position = place.geometry.location;
          setSelectedLocation({
            lat: position.lat(),
            lng: position.lng()
          });

          setAddressDetails(place.formatted_address);
        });
      }
  };

  // Haritayı yakınlaştır
  const zoomIn = () => {
    if (mapInstance.current) {
      const currentZoom = mapInstance.current.getZoom();
      mapInstance.current.setZoom(currentZoom + 1);
    }
  };

  // Haritayı uzaklaştır
  const zoomOut = () => {
    if (mapInstance.current) {
      const currentZoom = mapInstance.current.getZoom();
      mapInstance.current.setZoom(currentZoom - 1);
    }
  };

  // Kullanıcının konumunu al
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          if (mapInstance.current) {
            mapInstance.current.setCenter(pos);
            mapInstance.current.setZoom(17);
            
            if (markerRef.current) {
              markerRef.current.setPosition(pos);
            }
            
            setSelectedLocation(pos);
            
            // Reverse geocoding
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: pos }, (results, status) => {
              if (status === 'OK' && results[0]) {
                setAddressDetails(results[0].formatted_address);
              }
            });
          }
        },
        (error) => {
          console.error("Konum alınamadı:", error);
          alert("Konum izni verilmedi veya konum alınamadı.");
        }
      );
    } else {
      alert("Tarayıcınız konum hizmetlerini desteklemiyor.");
    }
  };

  // Yeni adres ekle
  const handleAddAddress = async () => {
    if (!addressName || !addressDetails || !selectedLocation) {
      alert("Lütfen tüm alanları doldurun ve haritada bir konum seçin.");
      return;
    }
    
    if (!finalUserId) {
      alert("Kullanıcı bilgisi eksik. Lütfen tekrar giriş yapın.");
      return;
    }
    
    setLoading(true);
    
    // Şehir ve ilçe bilgisini Google Places'ten çıkar
    let city = 'İstanbul';
    let district = '';
    
    try {
      // Google Geocoding API ile detaylı adres bilgisini al
      const geocoder = new window.google.maps.Geocoder();
      const results = await new Promise((resolve, reject) => {
        geocoder.geocode({ location: selectedLocation }, (results, status) => {
          if (status === 'OK') resolve(results);
          else reject(status);
        });
      });
      
      if (results && results[0]) {
        const addressComponents = results[0].address_components;
        
        // Şehir bilgisini bul
        const cityComponent = addressComponents.find(comp => 
          comp.types.includes('administrative_area_level_1') || 
          comp.types.includes('locality')
        );
        if (cityComponent) city = cityComponent.long_name;
        
        // İlçe bilgisini bul
        const districtComponent = addressComponents.find(comp => 
          comp.types.includes('administrative_area_level_2') ||
          comp.types.includes('sublocality')
        );
        if (districtComponent) district = districtComponent.long_name;
      }
    } catch (error) {
      console.log('Geocoding hatası:', error);
    }
    
    const newAddress = {
      name: addressName,
      address: addressDetails,
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      city: city,
      district: district
    };
    
    const success = await saveAddressToDatabase(newAddress);
    
    if (success) {
      setAddressName('');
      setAddressDetails('');
      setSelectedLocation(null);
      setShowMapPanel(false);
      alert('Adres başarıyla kaydedildi!');
    } else {
      alert('Adres kaydedilirken bir hata oluştu.');
    }
    
    setLoading(false);
  };

  // ✅ DÜZELTİLMİŞ: Adres seç fonksiyonu
  const handleSelectAddress = async (address) => {
    if (!finalUserId) {
      alert("Kullanıcı bilgisi eksik. Lütfen tekrar giriş yapın.");
      console.error('handleSelectAddress - userId yok:', finalUserId);
      return;
    }

    try {
      console.log('Adres seçiliyor:', { userId: finalUserId, addressId: address.id, address });
      
      // ✅ DÜZELTİLDİ: setDefaultAddress fonksiyonunu kullan
      const result = await setDefaultAddress(address.id);
      
      if (result.success) {
        setSelectedAddress(address.address);
        setSelectedAddressName(address.name);
        localStorage.setItem('selectedAddress', address.address);
        localStorage.setItem('selectedAddressId', address.id.toString());
        
        // Adresleri yeniden yükle
        await loadSavedAddresses();
        
        console.log('Adres başarıyla seçildi');
      } else {
        alert(result.message || 'Varsayılan adres ayarlanamadı.');
        console.error('Varsayılan adres ayarlama hatası:', result.message);
      }
    } catch (error) {
      console.error('Adres seçme hatası:', error);
      alert('Adres seçilirken bir hata oluştu.');
    }

    setShowAddressPanel(false);
  };
  if (!finalUserId) {
    return (
      <div className="address-selection-container">
        <button className="address-button" disabled>
          <span className="address-icon">📍</span>
          <span className="address-text">Giriş Yapın</span>
        </button>
      </div>
    );
  }

  return (
    <div className="address-selection-container">
      <button
        className="address-button"
        onClick={() => setShowAddressPanel(true)}
        disabled={loading}
      >
        <span className="address-icon">📍</span>
        <span className="address-text">
          {loading ? 'Yükleniyor...' : (selectedAddressName || 'Adres Seçin')}
        </span>
      </button>
      
      {/* Kayıtlı Adresler Popup */}
      {showAddressPanel && (
        <div className="address-overlay">
          <div className="address-popup">
            <div className="address-popup-header">
              <h3>Teslimat Adresi Seç</h3>
              <button onClick={() => setShowAddressPanel(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="address-list">
              {loading ? (
                <div className="loading">Adresler yükleniyor...</div>
              ) : savedAddresses.length === 0 ? (
                <div className="no-addresses">Henüz kayıtlı adres yok</div>
              ) : (
                savedAddresses.map(addr => (
                  <div
                    key={addr.id}
                    className={`address-item ${selectedAddress === addr.address ? 'selected' : ''}`}
                    onClick={() => handleSelectAddress(addr)}
                  >
                    <div className="address-name">
                      {addr.name}
                      {addr.isDefault && <span className="default-badge">Varsayılan</span>}
                    </div>
                    <div className="address-detail">{addr.address}</div>
                    <div className="address-location">{addr.district}, {addr.city}</div>
                  </div>
                ))
              )}
            </div>
            <button 
              className="add-new-address-button"
              onClick={() => {
                setShowAddressPanel(false);
                setShowMapPanel(true);
              }}
              disabled={loading}
            >
              + Yeni Adres Ekle
            </button>
          </div>
        </div>
      )}
      
      {/* Harita Popup */}
      {showMapPanel && (
        <div className="address-overlay">
          <div className="map-popup">
            <div className="map-popup-header">
              <h3>Teslimat Adresi Seç</h3>
              <p>Harita üzerinde bina girişini doğru seçtiğinden emin ol</p>
            </div>
            
            <div className="map-search-container">
              <div className="map-search-box">
                <FaSearch style={{ color: '#999', marginRight: '10px' }} />
                <input
                  ref={searchBoxRef}
                  type="text"
                  placeholder="Mahalle, sokak veya cadde ara"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                />
                <button className="location-button" onClick={getCurrentLocation}>
                  <FaMapMarkerAlt />
                </button>
              </div>
            </div>
            
            <div className="map-container" ref={mapRef}>
              <div className="map-markers">
                <button className="map-zoom-button" onClick={zoomIn}>
                  <FaPlus />
                </button>
                <button className="map-zoom-button" onClick={zoomOut}>
                  <FaMinus />
                </button>
              </div>
            </div>
            
            <div className="address-form">
              <div className="form-row">
                <label>Adres Başlığı</label>
                <input
                  type="text"
                  placeholder="Örn: Ev, İş"
                  value={addressName}
                  onChange={(e) => setAddressName(e.target.value)}
                />
              </div>
              
              <div className="form-row">
                <label>Adres Detayı</label>
                <input
                  type="text"
                  placeholder="Adres detayları"
                  value={addressDetails}
                  onChange={(e) => setAddressDetails(e.target.value)}
                />
              </div>
              
              <div className="form-actions">
                <button 
                  className="cancel-button"
                  onClick={() => setShowMapPanel(false)}
                  disabled={loading}
                >
                  Geri Dön
                </button>
                <button 
                  className="save-button"
                  onClick={handleAddAddress}
                  disabled={loading}
                >
                  {loading ? 'Kaydediliyor...' : 'Bu Konumu Kullan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressButton;