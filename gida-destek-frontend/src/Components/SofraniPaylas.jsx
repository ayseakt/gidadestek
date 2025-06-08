import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaPlus, FaCamera, FaMapMarkerAlt, FaClock, FaChartBar, FaHistory, FaEdit, FaSave ,FaShoppingBag, FaCheck, FaTimes, FaEye, FaSearch} from 'react-icons/fa';
import './SofraniPaylas.css';
import api, { packageService, statisticsService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import authService from '../services/AuthService';
import locationService from '../services/locationService';
import orderService from '../services/orderService'; 
import StatisticsDashboard from './Statistics'; 
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
  const [activeTab, setActiveTab] = useState('istatistikler');
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
    images: []
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
  setFormData(prev => ({
    ...prev,
    photos: files,
    imageFile: files[0] // Geriye dönük uyumluluk için
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
      images: []
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
    const requiredFields = [
      'package_name', 
      'original_price', 
      'discounted_price', 
      'pickup_end_time', 
      'category_id'
    ];

    const missingFields = requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      throw new Error('Lütfen tüm zorunlu alanları doldurun.');
    }

    if (!availableFrom || !availableUntil) {
      throw new Error('Geçerlilik tarihlerini doldurun.');
    }

    // ✅ GÜNCELLEME MODU KONTROLÜ
    if (editingPackage && editingPackage.package_id) {
      // 🔄 GÜNCELLEME İŞLEMİ - Sadece temel bilgiler
      const updateData = {
        package_name: formData.package_name,
        original_price: formData.original_price,
        discounted_price: formData.discounted_price,
        quantity_available: formData.quantity_available || 1,
        pickup_start_time: formData.pickup_start_time,
        pickup_end_time: formData.pickup_end_time,
        description: formData.description,
        category_id: formData.category_id,
        available_from: availableFrom,
        available_until: availableUntil
      };

      console.log("🔄 Paket güncelleniyor:", editingPackage.package_id);
      console.log("📤 Gönderilen data:", updateData);

      const response = await packageService.updatePackage(editingPackage.package_id, updateData);
      console.log("✅ Güncellenen paket:", response.data);
      
      alert("Paket başarıyla güncellendi!");
      
    } else {
      // ➕ YENİ PAKET OLUŞTURMA İŞLEMİ
      const packageData = new FormData();
      packageData.append('package_name', formData.package_name);
      packageData.append('original_price', formData.original_price);
      packageData.append('discounted_price', formData.discounted_price);
      packageData.append('quantity_available', formData.quantity_available || 1);
      packageData.append('pickup_start_time', formData.pickup_start_time);
      packageData.append('pickup_end_time', formData.pickup_end_time);
      packageData.append('description', formData.description);
      packageData.append('category_id', formData.category_id);
      packageData.append('available_from', availableFrom);
      packageData.append('available_until', availableUntil);

      // Konum bilgisi
      if (locationData.latitude && locationData.longitude && locationData.address) {
        packageData.append('latitude', locationData.latitude);
        packageData.append('longitude', locationData.longitude);
        packageData.append('address', locationData.address);
      } else if (selectedLocationId) {
        packageData.append('location_id', selectedLocationId);
      } else {
        throw new Error('Konum bilgisi eksik.');
      }

      // Fotoğrafları ekle (sadece yeni paket için)
      if (formData.photos && formData.photos.length > 0) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        formData.photos.forEach(file => {
          if (!validTypes.includes(file.type)) {
            throw new Error(`Geçersiz dosya tipi: ${file.name}`);
          }
          if (file.size > maxSize) {
            throw new Error(`Dosya çok büyük: ${file.name}`);
          }
          packageData.append('images', file);
        });
      } else {
        throw new Error("En az bir resim seçmelisiniz.");
      }

      console.log("➕ Yeni paket oluşturuluyor...");
      
      // Debug için form içeriğini yazdır
      for (let [key, val] of packageData.entries()) {
        console.log(`${key}:`, val);
      }

      const response = await packageService.createPackage(packageData);
      console.log("✅ Oluşturulan paket:", response.data);
      
      alert("Paket başarıyla oluşturuldu!");
    }

    // İşlem tamamlandığında formu temizle ve aktif paketler sekmesine git
    resetForm();
    setActiveTab('aktifpaketler');
    
  } catch (err) {
    console.error("🚨 Hata:", err);
    alert(err.message || 'Bir hata oluştu.');
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
      images: []
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
const handleImageError = (e, paket) => {
  console.log('❌ Resim yüklenemedi:', e.target.src);
  console.log('📦 Paket bilgisi:', paket);
  
  // Sonsuz döngüyü önlemek için flag kullan
  if (!e.target.dataset.errorHandled) {
    e.target.dataset.errorHandled = 'true';
    
    // Öncelikle data URL ile base64 placeholder dene
    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPllFTUVLPC90ZXh0Pgo8L3N2Zz4K';
  }
};

// 2. getImageUrl fonksiyonunu debug bilgileriyle güncelleyin
const getImageUrl = (paket) => {
  console.log('🖼️ getImageUrl çağrıldı:', paket);
  
  try {
    // Paket nesnesinden resim yolunu al
    let imagePath = '';
    
    // Tüm olası alan isimlerini kontrol et ve debug bilgisi ver
    const possibleImageFields = [
      'image_url', 'imageUrl', 'image_path', 'image', 
      'photo_url', 'picture_url', 'thumbnail'
    ];
    
    console.log('🔍 Paket içindeki tüm alanlar:', Object.keys(paket));
    
    for (const field of possibleImageFields) {
      if (paket[field]) {
        imagePath = paket[field];
        console.log(`✅ Resim alanı bulundu: ${field} = ${imagePath}`);
        break;
      }
    }
    
    // Images array'ini kontrol et
    if (!imagePath && paket.images && Array.isArray(paket.images) && paket.images.length > 0) {
      const firstImage = paket.images[0];
      imagePath = firstImage.image_url || firstImage.path || firstImage.url || firstImage;
      console.log('📸 Images array\'den alınan:', imagePath);
    }
    
    if (!imagePath) {
      console.warn('⚠️ Paket için resim yolu bulunamadı, varsayılan resim kullanılacak');
      // Base64 placeholder döndür
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPllFTUVLPC90ZXh0Pgo8L3N2Zz4K';
    }
    
    // Path'i normalize et
    let normalizedPath = imagePath.replace(/\\/g, '/');
    
    // Eğer zaten tam URL ise direkt return et
    if (normalizedPath.startsWith('http')) {
      console.log('🔗 Tam URL bulundu:', normalizedPath);
      return normalizedPath;
    }
    
    // Başında / yoksa ekle
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
    }
    
    // Backend URL'ini oluştur - API URL'den base URL'i çıkar
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5051/api';
    const baseURL = apiUrl.replace('/api', ''); // /api kısmını çıkar
    const fullImageUrl = `${baseURL}${normalizedPath}`;
    
    console.log('🔗 API URL:', apiUrl);
    console.log('🔗 Base URL:', baseURL);
    console.log('🔗 Oluşturulan tam resim URL:', fullImageUrl);
    
    // URL'in erişilebilir olup olmadığını kontrol et (opsiyonel)
    return fullImageUrl;
    
  } catch (error) {
    console.error('❌ getImageUrl fonksiyonunda hata:', error);
    // Hata durumunda base64 placeholder döndür
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPllFTUVLPC90ZXh0Pgo8L3N2Zz4K';
  }
};

const getImageUrlAlternative = (paket) => {
  try {
    let imagePath = paket.image_url || paket.imageUrl || paket.image_path || paket.image;
    
    if (paket.images && paket.images.length > 0 && !imagePath) {
      imagePath = paket.images[0].image_url || paket.images[0].path || paket.images[0];
    }
    
    if (!imagePath) return '/default-package-image.jpg';
    
    // Windows path'lerini düzelt
    const normalizedPath = imagePath.replace(/\\/g, '/');
    
    // Eğer zaten tam URL ise direkt return et
    if (normalizedPath.startsWith('http')) {
      return normalizedPath;
    }
    
    // Backend'in static file serving endpoint'i (genellikle /uploads)
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    return `${baseURL}/${normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath}`;
    
  } catch (error) {
    console.error('Resim URL oluşturma hatası:', error);
    return '/default-package-image.jpg';
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
              console.log('Yüklenen paketler:', packagesData);
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
      <div className="dashboard-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
         
          <span className="subtitle">Yönetim Paneli</span>
        </div>
        
        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${activeTab === 'istatistikler' ? 'active' : ''}`}
            onClick={() => setActiveTab('istatistikler')}
          >
            <FaChartBar className="nav-icon" />
            <span>İstatistikler</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'paketolustur' ? 'active' : ''}`} 
            onClick={() => setActiveTab('paketolustur')}
          >
            <FaPlus className="nav-icon" />
            <span>Paket Oluştur</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'aktifpaketler' ? 'active' : ''}`}
            onClick={() => setActiveTab('aktifpaketler')}
          >
            <FaClock className="nav-icon" />
            <span>Aktif Paketler</span>
            {paketlerim.length > 0 && (
              <span className="badge">{paketlerim.length}</span>
            )}
          </div>
          <div 
            className={`nav-item ${activeTab === 'gecmis' ? 'active' : ''}`}
            onClick={() => setActiveTab('gecmis')}
          >
            <FaHistory className="nav-icon" />
            <span>Geçmiş Paketler</span>
          </div>

        </nav>
        
        <div className="sidebar-stats">
          <div className="stats-title">Özet İstatistikler</div>
          <div className="mini-stat">
            <span className="mini-stat-value">{istatistikler.toplamPaket || 0}</span>
            <span className="mini-stat-label">Toplam Paket</span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-value">{istatistikler.kurtarilanYemek || 0}</span>
            <span className="mini-stat-label">Kurtarılan</span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-value">₺{(istatistikler.kazanilanTutar || 0).toFixed(0)}</span>
            <span className="mini-stat-label">Kazanç</span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-value">{istatistikler.azaltilanCO2 || 0}kg</span>
            <span className="mini-stat-label">CO₂ Azaltıldı</span>
          </div>
        </div>
      </div>

      {/* Sekme İçerikleri */}
      <div className="main-content">
        <div className="content-wrapper">
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
                    id="photo-upload"                     // ✅ id eklendi
                    name="images"
                    onChange={handlePhotoUpload}
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}           // ✅ gizli input (isteğe bağlı)
                  />

                  <label htmlFor="photo-upload" className="upload-button">
                    <FaCamera />
                    <span>Fotoğraf Yükle</span>
                  </label>

                  {/* ✅ Güvenli erişim (undefined hatası vermez) */}
                  {formData.photos && formData.photos.length > 0 && (
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
            <div className="content-header">
                <div className="header-left">
                    <h2>Aktif Paketlerim</h2>
                    <p className="content-subtitle">Şu anda satışta olan paketleriniz</p>
                  </div>
                  <div className="header-actions">
                    <button className="btn-primary-modern" onClick={() => setActiveTab('paketolustur')}>
                      <FaPlus /> Yeni Paket Ekle
                    </button>
                  </div>
                </div>
            
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
                    <img
                      src={
                        paket.images && paket.images.length > 0
                          ? `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000'}${paket.images[0].image_url || paket.images[0].image_path}`
                          : '/assets/placeholder-food.png'
                      }
                      alt={paket.package_name || paket.baslik}
                      style={{ 
                        width: '100%', 
                        height: '200px', 
                        objectFit: 'cover', 
                        borderRadius: '8px' 
                      }}
                      onError={(e) => {
                        console.error('Resim yüklenemedi:', e.target.src);
                        e.target.src = '/assets/placeholder-food.png';
                      }}
                    />
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
            <div className="content-header">
              <h2>Geçmiş Paketlerim</h2>
              <p className="content-subtitle">İptal edilmiş ve tamamlanmış paketleriniz</p>
            </div>
            
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
             <StatisticsDashboard />
            
        )}


        </div>
      </div>
    </div>
  </div>
  );
}

export default SofraniPaylas;