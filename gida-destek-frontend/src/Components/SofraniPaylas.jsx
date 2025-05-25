import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaPlus, FaCamera, FaMapMarkerAlt, FaClock, FaChartBar, FaHistory, FaEdit, FaSave ,FaShoppingBag, FaCheck, FaTimes, FaEye, FaSearch} from 'react-icons/fa';
import './SofraniPaylas.css';
import api, { packageService, statisticsService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import authService from '../services/AuthService';
import locationService from '../services/locationService';
import orderService from '../services/orderService'; 
function SofraniPaylas() {
  // Düzenleme state'i eklendi
  const [editingPackage, setEditingPackage] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [siparisler, setSiparisler] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  // Düzeltilmiş state tanımlamaları
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [locationData, setLocationData] = useState({
    address: '',
    latitude: null,
    longitude: null,
    selectedId: null
  });
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableUntil, setAvailableUntil] = useState('');
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  
  // Refs
  const searchInputRef = useRef(null);
  const mapRef = useRef(null);
  const searchBoxRef = useRef(null);
  const markerRef = useRef(null);
  const googleMapsLoadedRef = useRef(false);
  const navigate = useNavigate();
  
  // Diğer state'ler
  const [activeTab, setActiveTab] = useState('paketolustur');
  const [paketlerim, setPaketlerim] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [istatistikler, setIstatistikler] = useState({
    toplamPaket: 0,
    kurtarilanYemek: 0,
    kazanilanTutar: 0,
    azaltilanCO2: 0
  });

  // Düzeltilmiş formData
  const [formData, setFormData] = useState({
    package_name: '',
    original_price: '',
    discounted_price: '',
    quantity_available: 1,
    pickup_start_time: '',
    pickup_end_time: '',
    description: '',
    category_id: '',
    imageFile: null,
    photos: []
  });

  // Google Maps API yükleme fonksiyonu
  const loadGoogleMapsAPI = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps && googleMapsLoadedRef.current) {
        return resolve(window.google.maps);
      }
      
      const apiKey = 'AIzaSyDiTgTw4XKZYsx51Uap4dYseatMij9d0I8';
      
      if (!apiKey || apiKey === 'YOUR_API_KEY') {
        console.error('Geçersiz Google Maps API key');
        reject(new Error('Google Maps API key geçersiz'));
        return;
      }
      
      const existingScript = document.querySelector('script[src*="googleapis.com/maps"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          googleMapsLoadedRef.current = true;
          resolve(window.google.maps);
        });
        existingScript.addEventListener('error', reject);
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.onload = () => {
        googleMapsLoadedRef.current = true;
        console.log('Google Maps API başarıyla yüklendi');
        resolve(window.google.maps);
      };
      script.onerror = (error) => {
        console.error('Google Maps API yükleme hatası:', error);
        reject(new Error('Google Maps API yüklenemedi - API key veya network hatası'));
      };
      
      document.body.appendChild(script);
    });
  }, []);

  // Harita başlatma fonksiyonu
  const initializeMap = useCallback(() => {
    console.log('initializeMap çağrıldı');
    
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API yüklenmemiş');
      setError('Google Maps API yüklenmemiş. Sayfa yenilemeyi deneyin.');
      return;
    }

    const mapElement = document.getElementById('google-map');
    if (!mapElement) {
      console.error('Harita elementi bulunamadı');
      setError('Harita elementi bulunamadı.');
      return;
    }

    const rect = mapElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      console.error('Harita elementi görünür değil:', rect);
      setError('Harita elementi görünür değil.');
      return;
    }

    try {
      const defaultCenter = { lat: 41.0082, lng: 28.9784 };
      const center = locationData.latitude && locationData.longitude 
        ? { lat: locationData.latitude, lng: locationData.longitude }
        : defaultCenter;

      const map = new window.google.maps.Map(mapElement, {
        center: center,
        zoom: 13,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });
      mapRef.current = map;

      const marker = new window.google.maps.Marker({
        position: center,
        map,
        draggable: true,
        title: 'Teslimat Konumu'
      });
      markerRef.current = marker;

      setTimeout(() => {
        window.google.maps.event.trigger(map, 'resize');
        map.setCenter(center);
      }, 100);

      marker.addListener('dragend', (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results[0]) {
            setLocationData(prev => ({ 
              ...prev, 
              latitude: lat, 
              longitude: lng,
              address: results[0].formatted_address
            }));
          }
        });
      });

      map.addListener('click', (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        marker.setPosition(e.latLng);
        
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results[0]) {
            setLocationData(prev => ({ 
              ...prev, 
              latitude: lat, 
              longitude: lng,
              address: results[0].formatted_address
            }));
          }
        });
      });

      console.log('Harita başarıyla başlatıldı');
      
    } catch (error) {
      console.error('Harita başlatma hatası:', error);
      setError(`Harita başlatılamadı: ${error.message}`);
    }
  }, [locationData.latitude, locationData.longitude]);

  // Popup açma fonksiyonu
  const handleOpenLocationPopup = async () => {
    console.log('Popup açılıyor...');
    setShowLocationPopup(true);
    
    try {
      console.log('Google Maps API yükleniyor...');
      await loadGoogleMapsAPI();
      console.log('Google Maps API yüklendi, harita başlatılıyor...');
      
      setTimeout(() => {
        const mapElement = document.getElementById('google-map');
        console.log('Map element:', mapElement);
        
        if (mapElement) {
          console.log('Map element dimensions:', {
            width: mapElement.offsetWidth,
            height: mapElement.offsetHeight,
            display: window.getComputedStyle(mapElement).display
          });
          
          if (mapElement.offsetWidth === 0 || mapElement.offsetHeight === 0) {
            console.error('Map element boyutları sıfır!');
            mapElement.style.width = '100%';
            mapElement.style.height = '300px';
            mapElement.style.display = 'block';
          }
          
          initializeMap();
        } else {
          console.error('Harita elementi bulunamadı');
          setError("Harita elementi bulunamadı. Sayfa yenilemeyi deneyin.");
        }
      }, 1000);
      
    } catch (error) {
      console.error("Google Maps yüklenemedi:", error);
      setError(`Harita yüklenemedi: ${error.message}. Lütfen API key'inizi kontrol edin.`);
    }
  };

  // Adres değiştirildiğinde
  const handleAddressChange = (e) => {
    setLocationData(prev => ({ ...prev, address: e.target.value }));
  };

  // Adresi haritadan güncelle
  const handleUpdateFromAddress = async () => {
    if (!window.google || !window.google.maps || !locationData.address) return;
    
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: locationData.address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        
        setLocationData(prev => ({ 
          ...prev, 
          latitude: lat, 
          longitude: lng 
        }));
        
        if (mapRef.current && markerRef.current) {
          mapRef.current.setCenter(location);
          markerRef.current.setPosition(location);
        }
      } else {
        alert('Adres bulunamadı!');
      }
    });
  };

  // Kimlik doğrulama kontrolü
  const checkAuthentication = useCallback(() => {
    try {
      const isAuth = authService.isAuthenticated();
      const token = authService.getToken();
      
      console.log('Kimlik doğrulama durumu:', isAuth, 'Token:', !!token);
      
      if (isAuth && token) {
        // Header'ı her zaman güncel tut
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      return isAuth;
    } catch (error) {
      console.error('Authentication check hatası:', error);
      return false;
    }
  }, []);

  // Form input değişiklikleri
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fotoğraf yükleme
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const firstFile = files[0];
    
    setFormData(prev => ({
      ...prev,
      imageFile: firstFile,
      photos: files
    }));
  };

  // Formu sıfırlama fonksiyonu
  const resetForm = () => {
    setFormData({
      package_name: '',
      original_price: '',
      discounted_price: '',
      quantity_available: 1,
      pickup_start_time: '',
      pickup_end_time: '',
      description: '',
      category_id: '',
      imageFile: null,
      photos: []
    });
    
    setLocationData({
      address: '',
      latitude: null,
      longitude: null,
      selectedId: null
    });
    setAvailableFrom('');
    setAvailableUntil('');
    setSelectedLocationId(null);
    setIsEditMode(false);
    setEditingPackage(null);
  };

  // Form submit - Yeni paket oluşturma veya düzenleme
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Gerekli alanları kontrol et
      const requiredFields = [
        'package_name', 
        'original_price', 
        'discounted_price', 
        'pickup_end_time', 
        'category_id'
      ];
      
      if (!availableFrom) {
        throw new Error('Lütfen Geçerlilik Başlangıç Tarihi alanını doldurun.');
      }
      if (!availableUntil) {
        throw new Error('Lütfen Geçerlilik Bitiş Tarihi alanını doldurun.');
      }

      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        const fieldNames = {
          'package_name': 'Paket Adı',
          'original_price': 'Orijinal Fiyat',
          'discounted_price': 'İndirimli Fiyat',
          'pickup_end_time': 'Son Teslim Zamanı',
          'category_id': 'Kategori',
        };
        
        const missingFieldNames = missingFields.map(field => fieldNames[field] || field).join(', ');
        throw new Error(`Lütfen aşağıdaki zorunlu alanları doldurun: ${missingFieldNames}`);
      }
      
      // Konum kontrolü
      const hasManualLocation = locationData.latitude && locationData.longitude && locationData.address;
      const hasSelectedLocation = selectedLocationId && selectedLocationId !== "null" && selectedLocationId !== "";
      
      if (!hasManualLocation && !hasSelectedLocation) {
        throw new Error('Lütfen bir konum seçin veya haritadan manuel konum belirleyin.');
      }
      
      // FormData oluştur
      const packageData = new FormData();
        
      // Paket temel bilgilerini FormData'ya ekle
      packageData.append('package_name', formData.package_name);
      packageData.append('original_price', formData.original_price);
      packageData.append('discounted_price', formData.discounted_price);
      packageData.append('quantity_available', formData.quantity_available || 1);
      packageData.append('available_from', availableFrom);
      packageData.append('available_until', availableUntil);
      
      function toMySQLDateTime(dateString) {
        if (!dateString) return '';
        const d = new Date(dateString);
        // Geçersiz tarih kontrolü
        if (isNaN(d.getTime())) return '';
        
        const pad = n => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      }
      // Tarih doğrulaması yap
          if (formData.pickup_start_time && formData.pickup_end_time) {
            const startTime = new Date(formData.pickup_start_time);
            const endTime = new Date(formData.pickup_end_time);
            
            if (endTime <= startTime) {
              throw new Error('Bitiş saati başlangıç saatinden sonra olmalıdır!');
            }
          }
            
      packageData.append('pickup_start_time', toMySQLDateTime(formData.pickup_start_time));
      packageData.append('pickup_end_time', toMySQLDateTime(formData.pickup_end_time));
      packageData.append('description', formData.description || '');
      packageData.append('category_id', formData.category_id);
      
      // Konum bilgileri
      if (hasManualLocation) {
        packageData.append('latitude', locationData.latitude);
        packageData.append('longitude', locationData.longitude);
        packageData.append('address', locationData.address);
      }
      
      if (hasSelectedLocation) {
        packageData.append('location_id', selectedLocationId);
      }
      
      // Fotoğraf ekleme
      if (formData.imageFile) {
        packageData.append('images', formData.imageFile);
      }

      // Debug için
      console.log("Paket verileri:");
      for (let [key, value] of packageData.entries()) {
        console.log(`${key}: ${value}`);
      }

      let response;
      
      if (isEditMode && editingPackage) {
        // Paket güncelleme
        console.log('Paket güncelleniyor, ID:', editingPackage.id || editingPackage.package_id);
        response = await packageService.updatePackage(editingPackage.id || editingPackage.package_id, packageData);
        
        // State'i güncelle - response'dan gelen güncel veriyi kullan
        if (response && response.data) {
          const updatedPackage = response.data;
          
          setPaketlerim(prev => prev.map(paket => {
            const paketId = paket.id || paket.package_id;
            const editingId = editingPackage.id || editingPackage.package_id;
            
            if (paketId === editingId) {
              return { 
                ...paket, 
                ...updatedPackage,
                // Değişiklik yapılan alanları özellikle güncelle
                package_name: updatedPackage.package_name || formData.package_name,
                original_price: updatedPackage.original_price || formData.original_price,
                discounted_price: updatedPackage.discounted_price || formData.discounted_price,
                quantity_available: updatedPackage.quantity_available || formData.quantity_available,
                description: updatedPackage.description || formData.description,
                pickup_start_time: updatedPackage.pickup_start_time || formData.pickup_start_time,
                pickup_end_time: updatedPackage.pickup_end_time || formData.pickup_end_time,
                available_from: updatedPackage.available_from || availableFrom,
                available_until: updatedPackage.available_until || availableUntil
              };
            }
            return paket;
          }));
          
          // Güncelleme sonrası paketleri tekrar yükle
          setTimeout(() => {
            refreshPackages();
          }, 1000);
        }
        
        console.log("Paket başarıyla güncellendi:", response);
        alert('Paket başarıyla güncellendi!');
        
      }else {
        // Yeni paket oluşturma
        response = await packageService.createPackage(packageData);
        console.log("Başarılı yanıt:", response);
        
        if (response && response.data) {
          setPaketlerim(prev => [response.data, ...prev]);
          console.log("Yeni paket başarıyla oluşturuldu:", response);
          alert('Paket başarıyla oluşturuldu!');
        } else {
          throw new Error("Sunucu yanıtı beklenmeyen formatta");
        }
      }
      
      // Formu sıfırla ve aktif paketler sekmesine geç
      resetForm();
      setActiveTab('aktifpaketler');

    } catch (err) {
      console.error("Paket işlemi sırasında hata:", err);

      if (err.response && err.response.data) {
        setError(`Hata: ${err.response.data.message || 'Bilinmeyen hata'}`);
      } else {
        setError(`${err.message}`);
      }

      if (err.response?.status === 401) {
        setError("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Paket iptal etme
  const handleCancelPackage = async (paketId) => {
    const cancelReason = prompt("Paketi neden iptal ediyorsunuz? (İsteğe bağlı)");
    
    if (window.confirm("Bu paketi iptal etmek istediğinizden emin misiniz?")) {
      setLoading(true);
      try {
        console.log("İptal edilecek paket ID:", paketId);
        
        await packageService.cancelPackage(paketId, { 
          cancellation_reason: cancelReason || "Satıcı tarafından iptal edildi" 
        });
        
        // Geri kalan kod aynı...
        setPaketlerim(prevPaketler => 
          prevPaketler.filter(p => 
            p.id !== paketId && p.package_id !== paketId
          )
        );
        
        alert("Paket başarıyla iptal edildi.");
        
      } catch (err) {
        // Hata handling kodu aynı...
      } finally {
        setLoading(false);
      }
    }
  };
const refreshOrders = async () => {
  try {
    setLoading(true);
    setError(null);
    
    console.log('Siparişler yükleniyor...');
    const response = await orderService.getMyOrders();
    console.log('Siparişler API Response:', response);
    
    if (response && response.data) {
      let ordersData = [];
      
      if (Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        ordersData = response.data.data;
      }
      
      setSiparisler(ordersData);
      console.log('Yüklenen siparişler:', ordersData);
      
    } else {
      setSiparisler([]);
    }
    
  } catch (err) {
    console.error("Siparişler yüklenirken hata:", err);
    setError("Siparişler yüklenemedi.");
    setSiparisler([]);
  } finally {
    setLoading(false);
  }
};

// 5. Teslimat kodu doğrulama fonksiyonu
const handleVerifyCode = async (orderId) => {
  if (!verificationCode.trim()) {
    alert('Lütfen doğrulama kodunu girin.');
    return;
  }
  
  try {
    setLoading(true);
    
    const response = await orderService.verifyDeliveryCode(orderId, verificationCode);
    
    if (response && response.data.success) {
      // Sipariş durumunu güncelle
      setSiparisler(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: 'completed', delivery_verified: true }
          : order
      ));
      
      alert('Teslimat başarıyla doğrulandı!');
      setVerificationCode('');
      setShowOrderDetail(false);
      setSelectedOrder(null);
      
    } else {
      alert('Geçersiz doğrulama kodu!');
    }
    
  } catch (err) {
    console.error('Kod doğrulama hatası:', err);
    if (err.response?.status === 400) {
      alert('Geçersiz doğrulama kodu!');
    } else {
      alert('Doğrulama sırasında bir hata oluştu.');
    }
  } finally {
    setLoading(false);
  }
};

// 6. Sipariş hazır olarak işaretleme
const handleMarkReady = async (orderId) => {
  if (window.confirm('Bu siparişi hazır olarak işaretlemek istediğinizden emin misiniz?')) {
    try {
      setLoading(true);
      
      await orderService.markOrderReady(orderId);
      
      // State'i güncelle
      setSiparisler(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: 'ready' }
          : order
      ));
      
      alert('Sipariş hazır olarak işaretlendi!');
      
    } catch (err) {
      console.error('Sipariş güncelleme hatası:', err);
      alert('Sipariş güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }
};

// 7. Sipariş detaylarını görüntüleme
const handleShowOrderDetail = (order) => {
  setSelectedOrder(order);
  setShowOrderDetail(true);
};

// 8. Siparişleri filtreleme
const filteredOrders = siparisler.filter(order => {
  if (filterStatus === 'all') return true;
  return order.status === filterStatus;
});

// 9. Sipariş durumu için renk ve metin döndürme
const getOrderStatusInfo = (status) => {
  switch (status) {
    case 'pending':
      return { text: 'Bekliyor', color: '#ffa500', bgColor: '#fff3cd' };
    case 'confirmed':
      return { text: 'Onaylandı', color: '#007bff', bgColor: '#cce7ff' };
    case 'ready':
      return { text: 'Hazır', color: '#28a745', bgColor: '#d4edda' };
    case 'completed':
      return { text: 'Teslim Edildi', color: '#6c757d', bgColor: '#e9ecef' };
    case 'cancelled':
      return { text: 'İptal Edildi', color: '#dc3545', bgColor: '#f8d7da' };
    default:
      return { text: 'Bilinmiyor', color: '#6c757d', bgColor: '#e9ecef' };
  }
};
  // Paket düzenleme - YENİ: Düzenleme modunu başlat
  const handleEditPackage = (paket) => {
    console.log('Düzenlenen paket:', paket);
    
    if (!paket) {
      console.error('Paket verisi bulunamadı');
      setError('Düzenlenecek paket verisi bulunamadı.');
      return;
    }
    
    // Düzenleme modunu etkinleştir
    setIsEditMode(true);
    setEditingPackage(paket);
    
    // Tarih formatı fonksiyonu (datetime-local için)
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      } catch (error) {
        console.error('Tarih formatlanırken hata:', error);
        return '';
      }
    };
    
    // Form verilerini doldur - tüm olası alan isimlerini kontrol et
    const newFormData = {
      package_name: paket.package_name || paket.baslik || paket.name || '',
      original_price: paket.original_price || paket.fiyat || paket.originalPrice || '',
      discounted_price: paket.discounted_price || paket.indirimli || paket.discountedPrice || '',
      quantity_available: paket.quantity_available || paket.miktar || paket.quantity || 1,
      pickup_start_time: formatDateForInput(paket.pickup_start_time || paket.baslangicZamani),
      pickup_end_time: formatDateForInput(paket.pickup_end_time || paket.sonTeslim || paket.pickup_time),
      description: paket.description || paket.aciklama || paket.icerik || '',
      category_id: paket.category_id || paket.kategori_id || '',
      imageFile: null,
      photos: []
    };
    
    console.log('Form data being set:', newFormData);
    setFormData(newFormData);
    
    // Available dates formatla
    setAvailableFrom(paket.available_from ? paket.available_from.split(' ')[0] : '');
    setAvailableUntil(paket.available_until ? paket.available_until.split(' ')[0] : '');
    
    // Konum verilerini doldur
    if (paket.latitude && paket.longitude) {
      setLocationData({
        address: paket.address || paket.adres || '',
        latitude: parseFloat(paket.latitude),
        longitude: parseFloat(paket.longitude),
        selectedId: null
      });
    }
    
    if (paket.location_id) {
      setSelectedLocationId(paket.location_id.toString());
    }
    
    // Paket oluştur sekmesine geç
    setActiveTab('paketolustur');
  };

  // Düzenleme modundan çık
  const handleCancelEdit = () => {
    resetForm();
    setActiveTab('aktifpaketler');
  };
  const [gecmisPaketler, setGecmisPaketler] = useState([]);
  // Paketleri yeniden yükleme fonksiyonu
  const refreshPackages = async () => {
    try {
      setLoading(true);
      setError(null); // Error'u temizle
      
      console.log('Paketler yükleniyor...');
      const response = await packageService.getMyPackages();
      console.log('API Response:', response);
      
      if (response && response.data) {
        let packagesData = [];
        
        // Farklı response formatlarını kontrol et
        if (Array.isArray(response.data)) {
          packagesData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          packagesData = response.data.data;
        } else if (response.data.packages && Array.isArray(response.data.packages)) {
          packagesData = response.data.packages;
        } else if (response.data.success && response.data.data) {
          packagesData = Array.isArray(response.data.data) ? response.data.data : [];
        }
        
        console.log('İşlenen paket verisi:', packagesData);
        setPaketlerim(packagesData);
        
      } else {
        console.warn('Response data boş veya geçersiz:', response);
        setPaketlerim([]);
      }
      
    } catch (err) {
      console.error("Paketler yüklenirken hata:", err);
      
      // Detaylı hata kontrolü
      if (err.response) {
        console.error('Response hatası:', err.response.status, err.response.data);
        
        if (err.response.status === 401) {
          // Token yenileme deneme
          try {
            const newToken = authService.refreshToken();
            if (newToken) {
              api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
              console.log('Token yenilendi, tekrar deniyor...');
              
              // Recursive call ile tekrar dene
              return await refreshPackages();
            } else {
              setError("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
              setIsAuthenticated(false);
            }
          } catch (tokenError) {
            console.error('Token yenileme hatası:', tokenError);
            setError("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
            setIsAuthenticated(false);
          }
        } else {
          setError(`Paketler yüklenemedi: ${err.response.data?.message || 'Sunucu hatası'}`);
        }
      } else if (err.request) {
        console.error('Network hatası:', err.request);
        setError("Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.");
      } else {
        console.error('Genel hata:', err.message);
        setError(`Paketler yüklenemedi: ${err.message}`);
      }
      
      // Hata durumunda boş array set et
      setPaketlerim([]);
    } finally {
      setLoading(false);
    }
  };
  // Geçmiş paketleri yükleme fonksiyonu 
  const refreshPackageHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Geçmiş paketler yükleniyor...');
      const response = await packageService.getPackageHistory();
      console.log('Geçmiş paketler API Response:', response);
      
      if (response && response.data) {
        let historyData = [];
        
        if (Array.isArray(response.data)) {
          historyData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          historyData = response.data.data;
        }
        
        console.log('Yüklenen geçmiş paketler:', historyData);
        setGecmisPaketler(historyData); // Bu state'i de eklemeniz gerekecek
        
      } else {
        console.warn('Geçmiş paketler response data boş:', response);
        setGecmisPaketler([]);
      }
      
    } catch (err) {
      console.error("Geçmiş paketler yüklenirken hata:", err);
      setError("Geçmiş paketler yüklenemedi.");
      setGecmisPaketler([]);
    } finally {
      setLoading(false);
    }
  };

  // Ana useEffect
  useEffect(() => {
    const isAuth = checkAuthentication();
    setIsAuthenticated(isAuth);
    
    if (isAuth) {
      const fetchData = async () => {
        try {
          const token = authService.getToken();
          if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          }
          
          console.log('Veriler yükleniyor...');
          
          const [categoriesResult, locationsResult, packagesResult, statsResult] = 
            await Promise.allSettled([
              api.get('/categories').catch(() => ({ data: { data: [] } })),
              locationService.getAllLocations().catch(() => ({ data: [] })),
              packageService.getMyPackages().then(response => {
                console.log('Initial package load success:', response);
                return response;
              }).catch(err => {
                console.error('Initial package load error:', err);
                
                if (err.response?.status === 401) {
                  try {
                    const newToken = authService.refreshToken();
                    if (newToken) {
                      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                      return packageService.getMyPackages();
                    }
                  } catch (tokenErr) {
                    console.error('Token refresh failed:', tokenErr);
                  }
                }
                
                // Hata durumunda boş veri döndür ama hata fırlatma
                return { data: [] };
              }),
              statisticsService.getMyStats().catch(() => ({ data: { data: {
                toplamPaket: 0, kurtarilanYemek: 0, kazanilanTutar: 0, azaltilanCO2: 0
              }}}))
            ]);
          
          // Sonuçları güvenli şekilde işle
          if (categoriesResult.status === 'fulfilled' && categoriesResult.value?.data?.data) {
            const categoriesData = categoriesResult.value.data.data;
            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
            console.log('Kategoriler yüklendi:', categoriesData);
          }
          
          if (locationsResult.status === 'fulfilled' && locationsResult.value?.data) {
            const locationsData = locationsResult.value.data;
            setLocations(Array.isArray(locationsData) ? locationsData : []);
            console.log('Locations yüklendi:', locationsData);
          }
          
          if (packagesResult.status === 'fulfilled' && packagesResult.value?.data) {
            // API response yapısını daha detaylı kontrol et
            const response = packagesResult.value;
            console.log('Packages API Response:', response);
            
            let packagesData = [];
            if (response.data) {
              if (Array.isArray(response.data)) {
                packagesData = response.data;
              } else if (response.data.data && Array.isArray(response.data.data)) {
                packagesData = response.data.data;
              } else if (response.data.packages && Array.isArray(response.data.packages)) {
                packagesData = response.data.packages;
              }
            }
            
            setPaketlerim(packagesData);
            console.log('Yüklenen paketler:', packagesData);
          }
          
          if (statsResult.status === 'fulfilled' && statsResult.value?.data?.data) {
            setIstatistikler(statsResult.value.data.data || {
              toplamPaket: 0, kurtarilanYemek: 0, kazanilanTutar: 0, azaltilanCO2: 0
            });
          }
          
          setError(null);
        } catch (err) {
          console.error("Veri yükleme hatası:", err);
          setError("Veriler yüklenirken bir hata oluştu.");
          setLocations([]);
          setCategories([]);
          setPaketlerim([]);
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    } else {
      setLoading(false);
    }
  }, [checkAuthentication]);

  // Tab değişimi useEffect
  useEffect(() => {
    if (activeTab === 'paketolustur' && isAuthenticated) {
      loadGoogleMapsAPI()
        .then(() => {
          setTimeout(() => {
            const mapElement = document.getElementById('google-map');
            if (mapElement) {
              initializeMap();
            }
          }, 500);
        })
        .catch(error => {
          console.error("Google Maps API yüklenemedi:", error);
          setError("Harita yüklenemedi. Lütfen daha sonra tekrar deneyin.");
        });
    }
    
    // Aktif paketler sekmesine geçildiğinde paketleri yenile
    if (activeTab === 'aktifpaketler' && isAuthenticated) {
      console.log('Aktif paketler sekmesi açıldı, paketler yükleniyor...');
      refreshPackages();
    }
    if (activeTab === 'gecmis' && isAuthenticated) {
      console.log('Geçmiş sekmesi açıldı, geçmiş paketler yükleniyor...');
      refreshPackageHistory();
    }
  }, [activeTab, isAuthenticated]);

  // Kimlik doğrulama yönlendirmesi
  useEffect(() => {
    if (isAuthenticated === false) {
      const timer = setTimeout(() => {
        navigate('/login', { 
          state: { 
            from: window.location.pathname, 
            message: 'Lütfen önce giriş yapınız.',
            redirect: '/sofrani-paylas'
          } 
        });
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navigate]);
  
  useEffect(() => {
    // Authenticated olduktan sonra initial data yükleme
    if (isAuthenticated === true) {
      console.log('Authentication confirmed, loading initial packages...');
      refreshPackages();
    }
  }, [isAuthenticated]);

  // Loading durumu
  if (loading && !isAuthenticated) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  // Kimlik doğrulama başarısız
  if (isAuthenticated === false) {
    return (
      <div className="auth-redirect-container">
        <div className="auth-message">
          <h2>Oturum Gerekli</h2>
          <p>Bu sayfayı görüntülemek için lütfen giriş yapın.</p>
          <p>Giriş sayfasına yönlendiriliyorsunuz...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // Hata mesajı bileşeni
  const ErrorMessage = ({ message }) => (
    <div className="error-message">
      <p>{message}</p>
      <button onClick={() => setError(null)}>Kapat</button>
    </div>
  );

  return (
    <div className="sofrani-paylas-container">
      {/* İstatistik Kartları */}
      <div className="host-stats-container">
        <div className="stat-card">
          <div className="stat-value">{istatistikler.toplamPaket || 0}</div>
          <div className="stat-label">Toplam Paket</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{istatistikler.kurtarilanYemek || 0}</div>
          <div className="stat-label">Kurtarılan Porsiyon</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">₺{(istatistikler.kazanilanTutar || 0).toFixed(2)}</div>
          <div className="stat-label">Kazanılan Tutar</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{istatistikler.azaltilanCO2 || 0} kg</div>
          <div className="stat-label">Azaltılan CO₂</div>
        </div>
      </div>


      {/* Sekmeler */}
      <div className="host-tabs">
        <div 
          className={`tab ${activeTab === 'paketolustur' ? 'active' : ''}`} 
          onClick={() => setActiveTab('paketolustur')}
        >
          <FaPlus /> Paket Oluştur
        </div>
        <div 
          className={`tab ${activeTab === 'aktifpaketler' ? 'active' : ''}`}
          onClick={() => setActiveTab('aktifpaketler')}
        >
          <FaClock /> Aktif Paketler
        </div>
        <div 
          className={`tab ${activeTab === 'gecmis' ? 'active' : ''}`}
          onClick={() => setActiveTab('gecmis')}
        >
          <FaHistory /> Geçmiş
        </div>
        <div 
          className={`tab ${activeTab === 'istatistikler' ? 'active' : ''}`}
          onClick={() => setActiveTab('istatistikler')}
        >
          <FaChartBar /> İstatistikler
        </div>
        <div 
          className={`tab ${activeTab === 'siparisler' ? 'active' : ''}`}
          onClick={() => setActiveTab('siparisler')}
        >
          <FaShoppingBag /> Siparişler
        </div>
      </div>

      {/* Sekme İçerikleri */}
      <div className="tab-content">
        {error && <ErrorMessage message={error} />}
        
        {activeTab === 'paketolustur' && (
          <div className="paket-olustur-form">
            <h2>{isEditMode ? 'Paket Düzenle' : 'Yeni Paket Oluştur'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Paket Adı</label>
                  <input 
                    type="text" 
                    name="package_name"
                    value={formData.package_name}
                    onChange={handleInputChange}
                    placeholder="Paket Adını Girin" 
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Normal Fiyat (₺)</label>
                  <input 
                    type="number" 
                    name="original_price"
                    value={formData.original_price}
                    onChange={handleInputChange}
                    placeholder="100.00" 
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>İndirimli Fiyat (₺)</label>
                  <input 
                    type="number" 
                    name="discounted_price"
                    value={formData.discounted_price}
                    onChange={handleInputChange}
                    placeholder="40.00" 
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Ürün Adedi</label>
                  <input 
                    type="number" 
                    name="quantity_available"
                    value={formData.quantity_available}
                    onChange={handleInputChange}
                    placeholder="5" 
                    min="1" 
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Teslim Etme Başlangıç saati  </label>
                  <input 
                    type="datetime-local" 
                    name="pickup_start_time"
                    value={formData.pickup_start_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Teslim Etme Bitiş Saati </label>
                  <input 
                    type="datetime-local" 
                    name="pickup_end_time"
                    value={formData.pickup_end_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Paket İçeriği</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Paketinizin içeriğini detaylı açıklayın..."
                  required
                ></textarea>
              </div>
              
              <div className="form-group">
                <label>Fotoğraf Ekle</label>
                <div className="photo-upload">
                  <input 
                    type="file" 
                    name="photos"
                    onChange={handlePhotoUpload}
                    multiple
                    accept="image/*"
                    id="photo-upload"
                    className="hidden-input"
                  />
                  <label htmlFor="photo-upload" className="upload-button">
                    <FaCamera />
                    <span>Fotoğraf Yükle</span>
                  </label>
                  {formData.photos.length > 0 && (
                    <div className="photo-preview">
                      <span>{formData.photos.length} fotoğraf seçildi</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <label>Teslim Adresi</label>
                <div className="map-container">
                  <div className="location-controls">
                    <button 
                      type="button" 
                      onClick={handleOpenLocationPopup}
                      className="btn-secondary"
                    >
                      <FaMapMarkerAlt /> Haritadan Konum Seç
                    </button>
                    
                    {locationData.address && (
                      <div className="adres-bilgi">
                        <FaMapMarkerAlt /> {locationData.address} 
                        ({locationData.latitude?.toFixed(6)}, {locationData.longitude?.toFixed(6)})
                      </div>
                    )}
                    
                    {showLocationPopup && (
                      <div className="adres-popup">
                        <div className="popup-icerik">
                          <h3>Teslimat Adresi Seç</h3>
                          <input
                            type="text"
                            placeholder="Adres girin veya haritadan seçin"
                            value={locationData.address}
                            onChange={handleAddressChange}
                            style={{ width: '80%' }}
                          />
                          <button type="button" onClick={handleUpdateFromAddress}>
                            Haritadan Güncelle
                          </button>
                          <div id="google-map" style={{ 
                            width: '100%', 
                            height: 300, 
                            marginTop: 10 
                          }}></div>
                          <button type="button" onClick={() => setShowLocationPopup(false)}>
                            Kaydet ve Kapat
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Kayıtlı lokasyonlar dropdown */}
                    <div className="form-group">
                      <label>Veya Kayıtlı Lokasyon Seç</label>
                      <select 
                        value={selectedLocationId || ""}
                        onChange={(e) => setSelectedLocationId(e.target.value)}
                      >
                        <option value="">Lokasyon Seçin</option>
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name || loc.address}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
                 <div>
                    <label>
                      Üretim Tarihi :
                      <input
                        type="date"
                        name="available_from"
                        value={availableFrom}
                        onChange={e => setAvailableFrom(e.target.value)}
                        required
                      />
                    </label>
                  </div>
                  <div>
                    <label>
                      Son Tüketim Tarihi:
                      <input
                        type="date"
                        name="available_until"
                        value={availableUntil}
                        onChange={e => setAvailableUntil(e.target.value)}
                        required
                      />
                    </label>
                  </div>
              
              <div className="form-group">
                <label>Kategori</label>
                <select 
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Kategori Seçin</option>
                    {categories.length > 0 ? (
                      categories.map(category => (
                        <option key={category.category_id} value={category.category_id}>
                          {category.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option key="1" value="1">Restoran</option>
                        <option key="2" value="2">Fırın & Pastane</option>
                        <option key="3" value="3">Market</option>
                        <option key="4" value="4">Kafe</option>
                        <option key="5" value="5">Manav</option>
                        <option key="6" value="6">Diğer</option>
                      </>
                    )}
                </select>
              </div>
              <div className="form-actions">
                {isEditMode ? (
                  <>
                    <button type="button" className="btn-secondary" onClick={handleCancelEdit}>İptal</button>
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      disabled={loading}
                    >
                      {loading ? (
                        <><span className="spinner-small"></span> Güncelleniyor...</>
                      ) : (
                        <>
                          <FaSave /> Değişiklikleri Kaydet
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="btn-secondary" onClick={() => setActiveTab('aktifpaketler')}>İptal</button>
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      disabled={loading}
                    >
                      {loading ? (
                        <><span className="spinner-small"></span> Oluşturuluyor...</>
                      ) : (
                        'Paketi Oluştur'
                      )}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        )}
        {activeTab === 'aktifpaketler' && (
          <div className="aktif-paketler">
            <h2>Aktif Paketlerim</h2>
            
            {loading && (
              <div className="loading-indicator">
                <div className="spinner"></div>
                <p>Yükleniyor...</p>
              </div>
            )}
            
            {!loading && paketlerim.length === 0 && (
              <div className="no-packages">
                <p>Aktif paketiniz bulunmamaktadır.</p>
                <button className="btn-primary" onClick={() => setActiveTab('paketolustur')}>
                  <FaPlus /> Yeni Paket Oluştur
                </button>
              </div>
            )}
            
            <div className="paket-list">
              {paketlerim.map((paket, index) => (
                <div key={paket.id || index} className="paket-card">
                  <div className="paket-image">
                    <img src={paket.fotograf || '/assets/placeholder-food.png'} alt={paket.baslik} />
                  </div>
                  <div className="paket-details">
                    <h3>{paket.package_name || paket.baslik}</h3>
                    <div className="price-container">
                      <span className="original-price">
                        ₺{paket.original_price ? parseFloat(paket.original_price).toFixed(2) : '0.00'}
                      </span>
                      <span className="discount-price">
                        ₺{paket.discounted_price ? parseFloat(paket.discounted_price).toFixed(2) : '0.00'}
                      </span>
                    </div>
                    <div className="paket-meta">
                      <span><FaClock /> Son Teslim: {paket.pickup_end_time || paket.kalanSure}</span>
                      <span>Kalan: {paket.quantity_available || paket.miktar} adet</span>
                    </div>
                  </div>
                  <div className="paket-actions">
                    <button className="btn-outline" onClick={() => handleEditPackage(paket)}>Düzenle</button>
                    <button className="btn-danger" onClick={() => handleCancelPackage(paket.package_id || paket.id)}>İptal Et</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'gecmis' && (
          <div className="gecmis-paketler">
            <h2>Geçmiş Paketlerim</h2>
            
            {loading && (
              <div className="loading-indicator">
                <div className="spinner"></div>
                <p>Yükleniyor...</p>
              </div>
            )}
            
            {!loading && gecmisPaketler.length === 0 && (
              <div className="no-packages">
                <p>Geçmiş paketiniz bulunmamaktadır.</p>
              </div>
            )}
            
            <div className="paket-list history">
              {gecmisPaketler.map((paket, index) => (
                <div key={paket.package_id || index} className="paket-card cancelled">
                  <div className="paket-image">
                    <img src={paket.fotograf || '/assets/placeholder-food.png'} alt={paket.package_name} />
                    <div className="status-badge danger">İptal Edildi</div>
                  </div>
                  <div className="paket-details">
                    <h3>{paket.package_name}</h3>
                    <div className="price-container">
                      <span className="original-price">₺{parseFloat(paket.original_price || 0).toFixed(2)}</span>
                      <span className="discount-price">₺{parseFloat(paket.discounted_price || 0).toFixed(2)}</span>
                    </div>
                    <div className="paket-meta">
                      <span>İptal Tarihi: {new Date(paket.updated_at).toLocaleDateString('tr-TR')}</span>
                      <span>Miktar: {paket.quantity_available}</span>
                    </div>
                      <div className="cancel-reason">
                        İptal Nedeni: {paket.cancellation_reason || "Belirtilmemiş"}
                      </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'istatistikler' && (
          <div className="istatistikler">
            <h2>İstatistiklerim</h2>
            
            <div className="stat-filters">
              <select>
                <option key="7days">Son 7 gün</option>
                <option key="30days">Son 30 gün</option>
                <option key="3months">Son 3 ay</option>
                <option key="1year">Son 1 yıl</option>
                <option key="all">Tüm zamanlar</option>
              </select>
            </div>
            
            <div className="stats-grid">
              <div className="stat-box">
                <h3>Paket İstatistikleri</h3>
                <div className="stat-item">
                  <span>Oluşturulan Paket:</span>
                  <span>42</span>
                </div>
                <div className="stat-item">
                  <span>Teslim Edilen:</span>
                  <span>38</span>
                </div>
                <div className="stat-item">
                  <span>İptal Edilen:</span>
                  <span>4</span>
                </div>
                <div className="stat-item">
                  <span>Teslim Oranı:</span>
                  <span>90.5%</span>
                </div>
              </div>
              
              <div className="stat-box">
                <h3>Finansal İstatistikler</h3>
                <div className="stat-item">
                  <span>Toplam Kazanç:</span>
                  <span>₺1,230.50</span>
                </div>
                <div className="stat-item">
                  <span>Ortalama Paket Fiyatı:</span>
                  <span>₺32.40</span>
                </div>
                <div className="stat-item">
                  <span>Ortalama İndirim Oranı:</span>
                  <span>%58</span>
                </div>
              </div>
              
              <div className="stat-box">
                <h3>Çevresel Etki</h3>
                <div className="stat-item">
                  <span>Kurtarılan Porsiyon:</span>
                  <span>126</span>
                </div>
                <div className="stat-item">
                  <span>Azaltılan CO₂:</span>
                  <span>378 kg</span>
                </div>
                <div className="stat-item">
                  <span>Eşdeğer Ağaç:</span>
                  <span>15</span>
                </div>
              </div>
              
              <div className="stat-box">
                <h3>Müşteri İstatistikleri</h3>
                <div className="stat-item">
                  <span>Müşteri Sayısı:</span>
                  <span>27</span>
                </div>
                <div className="stat-item">
                  <span>Ortalama Puan:</span>
                  <span>4.8 / 5.0</span>
                </div>
                <div className="stat-item">
                  <span>Tekrar Eden Müşteriler:</span>
                  <span>68%</span>
                </div>
              </div>
            </div>
            
            <div className="graph-container">
              <h3>Paket Satış Grafiği (Son 30 Gün)</h3>
              <div className="graph-placeholder" style={{ height: "250px", background: "#f2f2f2", display: "flex", justifyContent: "center", alignItems: "center" }}>
                [Bu alana interaktif grafik eklenecek]
              </div>
            </div>
            
            <div className="download-stats">
              <button className="btn-secondary">
                <FaChartBar /> İstatistik Raporu İndir
              </button>
            </div>
          </div>
        )}
        {activeTab === 'siparisler' && (
  <div className="siparisler">
    <div className="siparisler-header">
      <h2>Siparişlerim</h2>
      
      {/* Filtre ve Arama */}
      <div className="siparis-controls">
        <div className="filter-controls">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="all">Tüm Siparişler</option>
            <option value="pending">Bekleyen</option>
            <option value="confirmed">Onaylanan</option>
            <option value="ready">Hazır</option>
            <option value="completed">Teslim Edilen</option>
            <option value="cancelled">İptal Edilen</option>
          </select>
        </div>
        
        <button 
          className="btn-secondary refresh-btn"
          onClick={refreshOrders}
          disabled={loading}
        >
          <FaSearch /> Yenile
        </button>
      </div>
    </div>
    
    {/* Loading */}
    {loading && (
      <div className="loading-indicator">
        <div className="spinner"></div>
        <p>Siparişler yükleniyor...</p>
      </div>
    )}
    
    {/* Sipariş Listesi */}
    {!loading && filteredOrders.length === 0 && (
      <div className="no-orders">
        <p>
          {filterStatus === 'all' 
            ? 'Siparişiniz bulunmamaktadır.' 
            : `${getOrderStatusInfo(filterStatus).text} durumunda sipariş bulunmamaktadır.`
          }
        </p>
      </div>
    )}
    
    <div className="siparis-list">
      {filteredOrders.map((siparis) => {
        const statusInfo = getOrderStatusInfo(siparis.status);
        
        return (
          <div key={siparis.id} className="siparis-card">
            <div className="siparis-header">
              <div className="siparis-info">
                <h3>Sipariş #{siparis.order_number || siparis.id}</h3>
                <span 
                  className="status-badge"
                  style={{ 
                    color: statusInfo.color, 
                    backgroundColor: statusInfo.bgColor 
                  }}
                >
                  {statusInfo.text}
                </span>
              </div>
              <div className="siparis-date">
                {new Date(siparis.created_at).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
            
            <div className="siparis-details">
              <div className="customer-info">
                <strong>Müşteri:</strong> {siparis.customer_name || 'Anonim'}
              </div>
              <div className="package-info">
                <strong>Paket:</strong> {siparis.package_name}
              </div>
              <div className="price-info">
                <strong>Tutar:</strong> ₺{parseFloat(siparis.total_amount || 0).toFixed(2)}
              </div>
              <div className="quantity-info">
                <strong>Adet:</strong> {siparis.quantity}
              </div>
            </div>
            
            <div className="siparis-actions">
              <button 
                className="btn-outline"
                onClick={() => handleShowOrderDetail(siparis)}
              >
                <FaEye /> Detay
              </button>
              
              {siparis.status === 'confirmed' && (
                <button 
                  className="btn-success"
                  onClick={() => handleMarkReady(siparis.id)}
                  disabled={loading}
                >
                  <FaCheck /> Hazır İşaretle
                </button>
              )}
              
              {siparis.status === 'ready' && !siparis.delivery_verified && (
                <button 
                  className="btn-primary"
                  onClick={() => handleShowOrderDetail(siparis)}
                >
                  <FaCheck /> Kodu Doğrula
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
    
    {/* Sipariş Detay Modal */}
    {showOrderDetail && selectedOrder && (
      <div className="modal-overlay">
        <div className="modal-content order-detail-modal">
          <div className="modal-header">
            <h3>Sipariş Detayı - #{selectedOrder.order_number || selectedOrder.id}</h3>
            <button 
              className="close-btn"
              onClick={() => {
                setShowOrderDetail(false);
                setSelectedOrder(null);
                setVerificationCode('');
              }}
            >
              <FaTimes />
            </button>
          </div>
          
          <div className="modal-body">
            <div className="order-info-grid">
              <div className="info-section">
                <h4>Sipariş Bilgileri</h4>
                <div className="info-item">
                  <span>Durum:</span>
                  <span className="status-badge" style={{
                    color: getOrderStatusInfo(selectedOrder.status).color,
                    backgroundColor: getOrderStatusInfo(selectedOrder.status).bgColor
                  }}>
                    {getOrderStatusInfo(selectedOrder.status).text}
                  </span>
                </div>
                <div className="info-item">
                  <span>Sipariş Tarihi:</span>
                  <span>{new Date(selectedOrder.created_at).toLocaleString('tr-TR')}</span>
                </div>
                <div className="info-item">
                  <span>Paket:</span>
                  <span>{selectedOrder.package_name}</span>
                </div>
                <div className="info-item">
                  <span>Adet:</span>
                  <span>{selectedOrder.quantity}</span>
                </div>
                <div className="info-item">
                  <span>Tutar:</span>
                  <span>₺{parseFloat(selectedOrder.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>
              
              <div className="info-section">
                <h4>Müşteri Bilgileri</h4>
                <div className="info-item">
                  <span>İsim:</span>
                  <span>{selectedOrder.customer_name || 'Belirtilmemiş'}</span>
                </div>
                <div className="info-item">
                  <span>Telefon:</span>
                  <span>{selectedOrder.customer_phone || 'Belirtilmemiş'}</span>
                </div>
                <div className="info-item">
                  <span>E-posta:</span>
                  <span>{selectedOrder.customer_email || 'Belirtilmemiş'}</span>
                </div>
              </div>
            </div>
            
            {/* Teslimat Kodu Doğrulama */}
            {selectedOrder.status === 'ready' && !selectedOrder.delivery_verified && (
              <div className="verification-section">
                <h4>Teslimat Doğrulama</h4>
                <p>Müşteriden aldığınız 6 haneli doğrulama kodunu girin:</p>
                <div className="verification-input">
                  <input
                    type="text"
                    placeholder="Örn: 123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength="6"
                    className="code-input"
                  />
                  <button 
                    className="btn-primary verify-btn"
                    onClick={() => handleVerifyCode(selectedOrder.id)}
                    disabled={loading || verificationCode.length !== 6}
                  >
                    {loading ? 'Doğrulanıyor...' : 'Doğrula'}
                  </button>
                </div>
              </div>
            )}
            
            {/* Teslim Edilmiş Bilgisi */}
            {selectedOrder.delivery_verified && (
              <div className="delivered-info">
                <div className="success-message">
                  <FaCheck /> Bu sipariş başarıyla teslim edilmiştir.
                </div>
                {selectedOrder.delivered_at && (
                  <div className="delivery-time">
                    Teslimat Zamanı: {new Date(selectedOrder.delivered_at).toLocaleString('tr-TR')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </div>
)}
      </div>
    </div>
  );
}

export default SofraniPaylas;