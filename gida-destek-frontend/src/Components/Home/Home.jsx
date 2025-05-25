import React, { useState, useEffect, useRef } from 'react';
import './Home.css';
import DonationCard from './DonationCard';
import locationService from '../../services/locationService'; // Bu import'u ekleyin
import { 
  FaUser, 
  FaBell, 
  FaHeart, 
  FaRegHeart,
  FaShoppingBag, 
  FaMapMarkerAlt, 
  FaClock, 
  FaLeaf,
  FaSearch,
  FaTimes,
  FaMap,
  FaStore,
  FaSmile,
  FaPizzaSlice,
  FaCalendarAlt,     // Yeni eklendi - Son tüketim tarihi için
  FaCalendarCheck,  
  FaBolt,
  FaWindowClose,
  FaFilter,
  FaSortAmountDown,
  FaShoppingCart,
  FaPlus,
  FaMinus,
  FaTrash

} from 'react-icons/fa';
import FilterSidebar from './FilterSidebar';
import packageService from '../../services/packageService';
import cartService from '../../services/cartServices';
import { useCart } from '../../contexts/cartContext';
const Home = () => {
  const { addToCart } = useCart();
  const [sortOption, setSortOption] = useState('distance');
  const [realPackages, setRealPackages] = useState([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [showCart, setShowCart] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [impactStats, setImpactStats] = useState({
    savedFood: 0,
    co2Reduced: 0,
    userCount: 0,
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLocationPermission, setShowLocationPermission] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  
  const categories = ['Tümü', 'Restoran', 'Fırın & Pastane', 'Market', 'Kafe', 'Manav', 'Diğer'];
// Tarih formatlaması yardımcı fonksiyonları
const formatTime = (timeString) => {
  if (!timeString) return 'Belirtilmemiş';

  try {
    let date;
    if (timeString.length <= 8 && /^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
      // Eğer sadece saat formatındaysa, bugünün tarihiyle birleştir
      const today = new Date().toISOString().split('T')[0]; // "2024-05-25"
      date = new Date(`${today}T${timeString}`);
    } else {
      // Zaten ISO formatındaysa doğrudan parse et
      date = new Date(timeString);
    }

    if (isNaN(date.getTime())) return 'Belirtilmemiş';

    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.warn('Zaman formatlaması hatası:', error);
    return 'Belirtilmemiş';
  }
};



const formatDate = (dateString) => {
  if (!dateString) return 'Belirtilmemiş';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Belirtilmemiş';
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.warn('Tarih formatlaması hatası:', error);
    return 'Belirtilmemiş';
  }
};

const formatDateRange = (startTime, endTime) => {
  const start = formatTime(startTime);
  const end = formatTime(endTime);
  if (start === 'Belirtilmemiş' || end === 'Belirtilmemiş') {
    return 'Belirtilmemiş';
  }
  return `${start}-${end}`;
};
  // Maksimum mesafe sınırı (km)
  const MAX_DISTANCE_KM = 10;
  // Kullanıcının varsayılan adresini getir
const getUserDefaultLocation = async () => {
  try {
    const response = await locationService.getLocations();
    if (response.data.success) {
      const defaultLocation = response.data.data.find(loc => loc.is_default);
      if (defaultLocation && defaultLocation.latitude && defaultLocation.longitude) {
        const defaultPos = {
          lat: parseFloat(defaultLocation.latitude),
          lng: parseFloat(defaultLocation.longitude)
        };
        setUserLocation(defaultPos);
        console.log('Varsayılan adres konumu:', defaultPos);
        return defaultPos;
      }
    }
    // Varsayılan adres yoksa mevcut konumu al
    return getUserCurrentLocation();
  } catch (error) {
    console.error('Varsayılan adres alınırken hata:', error);
    return getUserCurrentLocation();
  }
};

// Mevcut konum alma fonksiyonunu ayır
const getUserCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(userPos);
          setIsLoadingLocation(false);
          console.log('Mevcut konum alındı:', userPos);
          resolve(userPos);
        },
        (error) => {
          console.error("Konum alırken hata: ", error);
          setIsLoadingLocation(false);
          const defaultPos = { lat: 41.0082, lng: 28.9784 };
          setUserLocation(defaultPos);
          resolve(defaultPos);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      const defaultPos = { lat: 41.0082, lng: 28.9784 };
      setUserLocation(defaultPos);
      resolve(defaultPos);
    }
  });
};

  const loadRealPackages = async () => {
    try {
      setIsLoadingPackages(true);
      const response = await packageService.getAllActivePackages();
      if (response.data.success) {
        console.log('Paketler yüklendi:', response.data.data);
        setRealPackages(response.data.data);
        
        const totalPackages = response.data.data.length;
        setImpactStats({
          savedFood: totalPackages * 2,
          co2Reduced: totalPackages * 3,
          userCount: Math.floor(totalPackages * 1.5),
        });
      }
    } catch (error) {
      console.error('Paketler yüklenirken hata:', error);
    } finally {
      setIsLoadingPackages(false);
    }
  };

  // Sepet sayısını getir
  const loadCartCount = async () => {
    try {
      const response = await cartService.getCartCount();
      if (response.data.success) {
        setCartCount(response.data.data.count);
      }
    } catch (error) {
      console.error('Sepet sayısı alınırken hata:', error);
    }
  };

  // Sepeti getir
  const loadCart = async () => {
    try {
      const response = await cartService.getCart();
      if (response.data.success) {
        setCart(response.data.data.items);
      }
    } catch (error) {
      console.error('Sepet getirilirken hata:', error);
    }
  };

  // Sepete ekle
const handleAddToCart = async (business, quantity = 1) => {
  console.log('=== HANDLE ADD TO CART DEBUG ===');
  console.log('Business objesi:', business);
  console.log('Business objesi keys:', Object.keys(business));
  console.log('business.id:', business.id, 'Type:', typeof business.id);
  console.log('business.realId:', business.realId, 'Type:', typeof business.realId);
  console.log('business.packageId:', business.packageId, 'Type:', typeof business.packageId);
  
  if (business.isOwnPackage) {
    alert('Kendi paketinizi sepete ekleyemezsiniz!');
    return;
  }

  try {
    let packageId;
    
    // ⭐ DÜZELTME: Sadece integer ID'leri kullan
    if (business.realId !== undefined && business.realId !== null && typeof business.realId === 'number') {
      packageId = business.realId;
      console.log('✅ realId kullanıldı:', packageId, 'Type:', typeof packageId);
    } else if (business.packageId !== undefined && business.packageId !== null && typeof business.packageId === 'number') {
      packageId = business.packageId;
      console.log('✅ packageId kullanıldı:', packageId, 'Type:', typeof packageId);
    } else if (business.id !== undefined && business.id !== null && typeof business.id === 'number') {
      packageId = business.id;
      console.log('✅ id kullanıldı:', packageId, 'Type:', typeof packageId);
    } else {
      // ⭐ Son çare: String parse etmeye çalış
      console.warn('⚠️ Numeric ID bulunamadı, string parse deneniyor...');
      
      let stringId = business.realId || business.packageId || business.id;
      console.log('String parse denenen değer:', stringId, 'Type:', typeof stringId);
      
      if (typeof stringId === 'string' && stringId.startsWith('real_')) {
        const parsed = parseInt(stringId.replace('real_', ''), 10);
        if (!isNaN(parsed) && parsed > 0) {
          packageId = parsed;
          console.log('✅ String parse başarılı:', packageId);
        }
      } else if (typeof stringId === 'string') {
        const parsed = parseInt(stringId, 10);
        if (!isNaN(parsed) && parsed > 0) {
          packageId = parsed;
          console.log('✅ Direct string parse başarılı:', packageId);
        }
      }
      
      if (!packageId) {
        console.error('❌ Hiçbir geçerli ID bulunamadı!');
        console.error('Business objesi detayları:', {
          id: business.id,
          idType: typeof business.id,
          realId: business.realId,
          realIdType: typeof business.realId,
          packageId: business.packageId,
          packageIdType: typeof business.packageId,
          allKeys: Object.keys(business)
        });
        alert('Paket ID\'si bulunamadı veya geçersiz');
        return;
      }
    }

    // ⭐ FINAL VALIDATION
    if (typeof packageId !== 'number' || isNaN(packageId) || packageId <= 0) {
      console.error('❌ Final validation failed - Geçersiz packageId:', packageId, 'Type:', typeof packageId);
      alert('Geçersiz paket ID');
      return;
    }

    console.log('✅ FINAL packageId kullanılacak:', packageId, 'Type:', typeof packageId);
    
    // ⭐ cartService.addToCart çağrısı
    const response = await cartService.addToCart(packageId, quantity);
    
    if (response.data.success) {
      await loadCartCount();
      setImpactStats(prev => ({
        ...prev,
        savedFood: prev.savedFood + 1,
        co2Reduced: prev.co2Reduced + 2,
      }));
      
      alert(`${business.storeName} işletmesinden "${business.product}" ürünü sepete eklendi!`);
      if (showProductDetail) {
        setShowProductDetail(false);
      }
    }
    
  } catch (error) {
    console.error('handleAddToCart hatası:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    
    if (error.response?.status === 400) {
      console.error('400 Hatası - Request payload:', error.config?.data);
      console.error('Backend response:', error.response?.data);
    }
    if (error.response?.data?.message) {
      alert(error.response.data.message);
    } else {
      alert('Sepete eklenirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    }
  }
};
  // Sepet öğesi güncelle
  const handleUpdateCartItem = async (cartItemId, quantity) => {
    try {
      if (quantity === 0) {
        await handleRemoveFromCart(cartItemId);
        return;
      }

      const response = await cartService.updateCartItem(cartItemId, quantity);
      if (response.data.success) {
        await loadCart();
        await loadCartCount();
      }
    } catch (error) {
      console.error('Sepet güncelleme hatası:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      }
    }
  };

  // Sepetten kaldır
  const handleRemoveFromCart = async (cartItemId) => {
    try {
      const response = await cartService.removeFromCart(cartItemId);
      if (response.data.success) {
        await loadCart();
        await loadCartCount();
        alert('Ürün sepetten kaldırıldı');
      }
    } catch (error) {
      console.error('Sepetten kaldırma hatası:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      }
    }
  };

  // Sepeti temizle
  const handleClearCart = async () => {
    if (window.confirm('Sepeti tamamen temizlemek istediğinizden emin misiniz?')) {
      try {
        const response = await cartService.clearCart();
        if (response.data.success) {
          setCart([]);
          setCartCount(0);
          alert('Sepet temizlendi');
        }
      } catch (error) {
        console.error('Sepet temizleme hatası:', error);
      }
    }
  };

  // Google Maps API script yükleme
  const loadGoogleMapsScript = () => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCDLCFkp4u74d7NrR7XUS-HhDLNF3xq9Is&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('Google Maps API loaded');
        if (userLocation) {
          initMap();
        }
      };
      
      document.head.appendChild(script);
    } else if (userLocation && showMapView) {
      initMap();
    }
  };

  // Harita başlatma
  const initMap = () => {
    if (!window.google || !mapRef.current) return;

    const mapOptions = {
      center: userLocation || { lat: 41.0082, lng: 28.9784 },
      zoom: 14,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    };

    const map = new window.google.maps.Map(mapRef.current, mapOptions);
    googleMapRef.current = map;

    if (userLocation) {
      new window.google.maps.Marker({
        position: userLocation,
        map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#FF6B6B",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2
        },
        title: "Konumunuz"
      });
    }

    validRealPackages.forEach((business) => {
      if (business.location) {
        const marker = new window.google.maps.Marker({
          position: business.location,
          map,
          title: business.storeName,
          icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
          }
        });

        const contentString = `
          <div style="width: 200px; padding: 10px;">
            <h3 style="margin: 0 0 5px 0;">${business.storeName}</h3>
            <p style="margin: 0 0 5px 0;">${business.product}</p>
            <p style="margin: 0 0 5px 0;"><b>₺${business.newPrice.toFixed(2)}</b> <span style="text-decoration: line-through;">₺${business.oldPrice.toFixed(2)}</span></p>
            <p style="margin: 0 0 5px 0;">Alım Saati: ${business.time}</p>
          </div>
        `;

        const infowindow = new window.google.maps.InfoWindow({
          content: contentString
        });

        marker.addListener("click", () => {
          infowindow.open(map, marker);
        });
      }
    });
  };

  // Kullanıcı konumunu al
const getUserLocation = async () => {
  await getUserDefaultLocation();
};

  // Mesafe hesaplama (Haversine formülü)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  // Gerçek paket verilerini dönüştür
const convertRealPackageToBusinessFormat = (packageData) => {
  if (!packageData || typeof packageData !== 'object') {
    console.warn('Geçersiz paket verisi:', packageData);
    return null;
  }

  if (!packageData.package_id) {
    console.warn('Eksik package_id:', packageData);
    return null;
  }

  const packageId = parseInt(packageData.package_id);
  if (isNaN(packageId)) {
    console.warn('Geçersiz package_id:', packageData.package_id);
    return null;
  }

  if (!packageData.location || 
      !packageData.location.latitude || 
      !packageData.location.longitude ||
      packageData.location.latitude === null ||
      packageData.location.longitude === null) {
    console.warn('Paket konum verisi eksik:', packageData.package_id);
    return null;
  }

  const lat = parseFloat(packageData.location.latitude);
  const lng = parseFloat(packageData.location.longitude);

  if (isNaN(lat) || isNaN(lng)) {
    console.warn('Geçersiz koordinatlar:', { lat, lng });
    return null;
  }

  let distance = '500m';
  let actualDistance = 999;

  if (userLocation) {
    actualDistance = calculateDistance(
      userLocation.lat, 
      userLocation.lng, 
      lat, 
      lng
    );
    
    distance = actualDistance < 1 ? 
      `${Math.round(actualDistance * 1000)}m` : 
      `${actualDistance.toFixed(1)}km`;
  }

  // Zaman formatlaması - pickup_start_time ve pickup_end_time kullan
  const timeDisplay = formatDateRange(packageData.pickup_start_time, packageData.pickup_end_time);
  // Kategori mapping - category ilişkisinden al
  let categoryName = 'Diğer';
  if (packageData.category && packageData.category.name) {
    categoryName = packageData.category.name;
  } else {
    // Fallback kategori mapping
    const categoryMap = {
      1: 'Restoran',
      2: 'Fırın & Pastane', 
      3: 'Market',
      4: 'Kafe',
      5: 'Manav',
      6: 'Diğer'
    };
    categoryName = categoryMap[packageData.category_id] || 'Diğer';
  }

  // Resim URL'si - eğer varsa kullan, yoksa default
  let imageUrl = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop';
  
  // Kategoriye göre default resimler
  const categoryImages = {
    'Restoran': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop',
    'Fırın & Pastane': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=200&fit=crop',
    'Market': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop',
    'Kafe': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&h=200&fit=crop',
    'Manav': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=200&fit=crop',
    'Diğer': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop'
  };
  
  imageUrl = categoryImages[categoryName] || imageUrl;

  return {
    id: packageId,
    realId: packageId,
    packageId: packageId,
    storeName: packageData.seller?.business_name || 'Mağaza Adı Belirtilmemiş',
    product: packageData.package_name || 'Paket Adı Belirtilmemiş',
    description: packageData.description || 'Açıklama bulunmuyor',
    oldPrice: parseFloat(packageData.original_price) || 0,
    newPrice: parseFloat(packageData.discounted_price) || 0,
    distance,
    time: timeDisplay,
    category: categoryName,
    image: imageUrl,
    savedCount: Math.floor(Math.random() * 50) + 1, // Bu gerçek veriye dönüştürülebilir
    location: { lat, lng },
    sellerId: packageData.seller?.user_id || packageData.seller_id,
    isOwnPackage: packageData.seller?.user_id === currentUserId || packageData.seller_id === currentUserId,
    actualDistance,
    isDemo: false,
    quantityAvailable: packageData.quantity_available || 1,
    pickupStartTime: packageData.pickup_start_time,
    pickupEndTime: packageData.pickup_end_time,
    availableFrom: packageData.available_from,
    availableUntil: packageData.available_until,
    isActive: packageData.is_active,
    createdAt: packageData.created_at,
    updatedAt: packageData.updated_at
  };
};

  const validRealPackages = realPackages
    .map(convertRealPackageToBusinessFormat)
    .filter(business => {
      if (business === null) return false;
      if (business.actualDistance > MAX_DISTANCE_KM) {
        return false;
      }
      return true;
    });

  // Filtreleme
  const filteredBusinesses = selectedCategory === 'Tümü'
    ? validRealPackages.filter(b => {
        const matchesSearch = b.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            b.product?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      })
    : validRealPackages.filter(b => {
        const matchesCategory = b.category === selectedCategory;
        const matchesSearch = b.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            b.product?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      });

  // Sıralama
  const sortedBusinesses = [...filteredBusinesses].sort((a, b) => {
    switch (sortOption) {
      case 'alphabetical':
        return a.storeName.localeCompare(b.storeName);
      case 'price':
        return a.newPrice - b.newPrice;
      case 'distance':
        return a.actualDistance - b.actualDistance;
      case 'time':
        return a.time.localeCompare(b.time);
      default:
        return 0;
    }
  });

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  };
  
  const closeProductDetail = () => {
    setShowProductDetail(false);
  };

  // Eski handleBuy fonksiyonunu handleAddToCart ile değiştir
  const handleBuy = (business) => {
    handleAddToCart(business, 1);
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const toggleFavorite = (businessId) => {
    if (favorites.includes(businessId)) {
      setFavorites(favorites.filter(id => id !== businessId));
    } else {
      setFavorites([...favorites, businessId]);
    }
  };

  const isFavorite = (businessId) => {
    return favorites.includes(businessId);
  };

  const closeOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('onboardingShown', 'true');
  };

  const allowLocationPermission = () => {
    setShowLocationPermission(false);
    localStorage.setItem('locationPermissionShown', 'true');
    getUserLocation();
  };

  const declineLocationPermission = () => {
    setShowLocationPermission(false);
    localStorage.setItem('locationPermissionShown', 'true');
    setUserLocation({ lat: 41.0082, lng: 28.9784 });
  };

  const handleMapButtonClick = () => {
    setShowMapView(!showMapView);
    if (!showMapView && !userLocation) {
      getUserLocation();
    }
  };

  // Sepet toplamını hesapla
  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      return total + (parseFloat(item.unit_price) * item.quantity);
    }, 0);
  };

  // İlk yükleme
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUserId(user.user_id || user.id);
    
    if (!localStorage.getItem('onboardingShown')) {
      setShowOnboarding(true);
    }

    if (!localStorage.getItem('locationPermissionShown')) {
      setTimeout(() => {
        setShowLocationPermission(true);
      }, 1000);
    } else {
      // getUserLocation yerine getUserDefaultLocation çağır
      getUserDefaultLocation();
    }

    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }

    loadRealPackages();
    loadCartCount();
  }, []);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (showMapView) {
      loadGoogleMapsScript();
    }
  }, [showMapView, userLocation]);

  useEffect(() => {
    if (showCart) {
      loadCart();
    }
  }, [showCart]);

  return (
    <>
      {showOnboarding && (
        <div className="onboarding-overlay">
          <div className="onboarding-container">
            <div className="onboarding-header">
              <h2>🍽️ SofraPay'a Hoş Geldiniz!</h2>
              <button className="close-button" onClick={closeOnboarding}>
                <FaTimes />
              </button>
            </div>

            <div className="onboarding-content">
              <div className="onboarding-step">
                <div className="step-icon">
                  <FaSearch />
                </div>
                <div className="step-text">
                  <h3>🌱 İsrafı Önle</h3>
                  <p>Yakınınızdaki işletmelerden uygun fiyata kaliteli yemek paketleri keşfedin.</p>
                </div>
              </div>

              <div className="onboarding-step">
                <div className="step-icon">
                  <FaShoppingBag />
                </div>
                <div className="step-text">
                  <h3>🛒 Satın Al & Kurtar</h3>
                  <p>Beğendiğiniz paketi ayırın ve belirtilen saatte teslim alın.</p>
                </div>
              </div>

              <div className="onboarding-step">
                <div className="step-icon">
                  <FaHeart />
                </div>
                <div className="step-text">
                  <h3>🌍 Çevreye Katkı Sağla</h3>
                  <p>Her paket ile gıda israfını azaltın ve sürdürülebilir bir gelecek inşa edin.</p>
                </div>
              </div>
            </div>

            <div className="onboarding-footer">
              <button className="start-button" onClick={closeOnboarding}>
                🚀 Hemen Başla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ana Uygulama */}
      <div className="app-container">
        {/* Mobil Header */}
        <div className="mobile-header">
          <div className="header-content">
            <h1 className="app-title">🍽️ SofraPay</h1>
            <div className="header-actions">


            </div>
          </div>
          

        </div>


        <div className="content-grid">
          {/* Sol Filtre Bölümü */}
          <div className={`filter-column ${showMobileFilters ? 'mobile-show' : ''}`}>
            <FilterSidebar 
              onFilterChange={(category) => {
                setSelectedCategory(category);
                setShowMobileFilters(false);
              }}
              onSortChange={(option) => setSortOption(option)}
              onClose={() => setShowMobileFilters(false)}
            />

          </div>
          
          {/* Ana İçerik */}
          <div className="main-content-column">
            {!showMapView ? (
              <div className="product-cards-section">
                <div className="section-header">
                  <div className="header-info">
                    <h2 className="section-title-large">🔥 Günün Fırsatları</h2>
                    <p className="section-subtitle">Gıda israfını önle, çevreyi koru!</p>
                  </div>
                  
                  {isLoadingLocation && (
                    <div className="location-status loading">
                      <FaMapMarkerAlt /> Konum alınıyor...
                    </div>
                  )}
                  
                  {userLocation && (
                    <div className="location-status">
                      <FaMapMarkerAlt /> {MAX_DISTANCE_KM}km içindeki fırsatlar
                    </div>
                  )}
                </div>
                
                {/* Kategori Filtreleri */}
                <div className="categories-container">
                  {categories.map((category) => (
                    <button
                      key={category}
                      className={`category-button ${selectedCategory === category ? 'active' : ''}`}
                      onClick={() => handleCategoryClick(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                
                {isLoadingPackages ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Harika fırsatlar yükleniyor...</p>
                  </div>
                ) : (
                  <div className="product-cards-container">
                    {sortedBusinesses.length === 0 ? (
                      <div className="no-packages-message">
                        <div className="empty-state">
                          <FaMapMarkerAlt />
                          <h3>🔍 Yakınınızda fırsat bulunamadı</h3>
                          <p>Şu anda {MAX_DISTANCE_KM}km içinde aktif paket bulunmuyor.</p>
                          <p>Daha sonra tekrar kontrol edin veya arama kriterlerinizi değiştirin.</p>
                        </div>
                      </div>
                    ) : (
                      sortedBusinesses.map((business) => (
                        <div 
                          key={business.id} 
                          className="product-card" 
                          onClick={() => handleProductClick(business)}
                          
                        >
                          <div className="product-image-container">
                            <img 
                              src={business.image} 
                              alt={business.product} 
                              className="product-image" 
                            />
                            {/* <div 
                              className="favorite-button" 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(business.id);
                              }}
                            >
                              {isFavorite(business.id) ? 
                                <FaHeart className="favorited" /> : 
                                <FaRegHeart />
                              }
                            </div> */}
                            <div className="food-saved-tag">
                              <FaLeaf /> {business.savedCount} kurtarıldı
                            </div>
                            {business.isOwnPackage && (
                              <div className="own-package-badge">
                                Kendi Paketiniz
                              </div>
                            )}
                            <div className="discount-badge">
                              {Math.round((1 - business.newPrice / business.oldPrice) * 100)}% İndirim
                            </div>
                          </div>
                          
                          <div className="product-info">
                            <div className="store-name">{business.storeName}</div>
                            <div className="product-name">{business.product}</div>
                            
                            <div className="product-details">
                              <div className="collection-info">
                                <div className="pickup-time">
                                  <FaClock /> {business.time}
                                </div>
                                <div className="distance">
                                  <FaMapMarkerAlt /> {business.distance}
                                </div>
                              </div>
                              
                              <div className="price-info">
                                <div className="old-price">₺{business.oldPrice.toFixed(2)}</div>
                                <div className="new-price">₺{business.newPrice.toFixed(2)}</div>
                              </div>
                            </div>
                            
                            <button 
                              className={`reserve-button ${business.isOwnPackage ? 'own-package' : ''}`}
                              onClick={() => addToCart(business)}
                              disabled={business.isOwnPackage}
                            >
                              {business.isOwnPackage ? '🚫 Kendi Paketiniz' : '🛒 Ürünü Kurtar'}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="map-view-container">
                <div className="map-header">
                  <h2>🗺️ Yakındaki Fırsatlar</h2>
                  <button className="close-map-button" onClick={() => setShowMapView(false)}>
                    <FaTimes />
                  </button>
                </div>
                <div id="google-map" ref={mapRef} className="google-map"></div>
              </div>
            )}
          </div>
          
          {/* Sağ Impact Stats */}

        </div>
      </div>

      {/* Floating Harita Butonu */}
      <button className="floating-map-button" onClick={handleMapButtonClick}>
        <FaMap />
        <span>{showMapView ? "📋 Listeyi Göster" : "🗺️ Haritayı Göster"}</span>
      </button>

      {/* Konum İzni */}
      {showLocationPermission && (
        <div className="location-permission-overlay">
          <div className="permission-container">
            <div className="permission-icon">
              <FaMapMarkerAlt />
            </div>
            <div className="permission-content">
              <h3>📍 Konumunuzu Paylaşın</h3>
              <p>Yakınınızdaki en iyi fırsatları görebilmek için konumunuza erişmemize izin verin.</p>
              <div className="permission-actions">
                <button className="allow-button" onClick={allowLocationPermission}>
                  ✅ İzin Ver
                </button>
                <button className="later-button" onClick={declineLocationPermission}>
                  ⏰ Daha Sonra
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Product Detail Popup */}
      {showProductDetail && selectedProduct && (
        <div className="product-detail-overlay" onClick={closeProductDetail}>
          <div className="product-detail-popup" onClick={(e) => e.stopPropagation()}>
            <button className="close-popup-button" onClick={closeProductDetail}>
              <FaTimes />
            </button>
            
            <div className="product-detail-content">
              <div className="product-detail-image-container">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.product} 
                  className="product-detail-image" 
                />
                <div 
                  className="detail-favorite-button" 
                  onClick={() => toggleFavorite(selectedProduct.id)}
                >
                  {isFavorite(selectedProduct.id) ? <FaHeart color="#FF5A5F" /> : <FaRegHeart />}
                </div>
                {selectedProduct.isOwnPackage && (
                  <div className="detail-own-package-badge">
                    Kendi Paketiniz
                  </div>
                )}
              </div>
              
              <div className="product-detail-info">
                <div className="detail-store-name">
                  <FaStore /> {selectedProduct.storeName || selectedProduct.seller?.business_name || 'Mağaza'}
                </div>
                <h2 className="detail-product-name">
                  {selectedProduct.product || selectedProduct.package_name}
                </h2>
                
                <div className="detail-category">
                  📂 Kategori: {selectedProduct.category?.name || selectedProduct.category || 'Genel'}
                </div>
                
                <div className="detail-collection-info">
                    <div className="detail-pickup-time">
                      <FaClock /> Teslim Zamanı: {
                        selectedProduct.time || 
                        formatDateRange(selectedProduct.pickupStartTime, selectedProduct.pickupEndTime)
                      }
                    </div>
                  <div className="detail-distance">
                    <FaMapMarkerAlt /> Uzaklık: {selectedProduct.distance || 'Hesaplanıyor...'}
                  </div>
                </div>

                {/* Yeni eklenen: Son tüketim tarihi */}
                <div className="detail-expiry-info">
                    <div className="detail-expiry-date">
                      <FaCalendarAlt /> Son Tüketim: {
                        selectedProduct.availableUntil ? 
                        formatDate(selectedProduct.availableUntil) : 
                        'Belirtilmemiş'
                      }
                    </div>
                  <div className="detail-available-from">
                    <FaCalendarCheck /> Müsait Tarih: {
                      selectedProduct.availableFrom ? 
                      formatDate(selectedProduct.availableFrom) : 
                      'Şimdi'
                    }
                  </div>
                </div>
                
                <div className="detail-price-container">
                  <div className="detail-price-info">
                    <div className="detail-old-price">
                      ₺{(selectedProduct.oldPrice || selectedProduct.original_price || 0).toFixed(2)}
                    </div>
                    <div className="detail-new-price">
                      ₺{(selectedProduct.newPrice || selectedProduct.discounted_price || 0).toFixed(2)}
                    </div>
                    <div className="detail-discount-percentage">
                      {Math.round((1 - (selectedProduct.newPrice || selectedProduct.discounted_price || 0) / (selectedProduct.oldPrice || selectedProduct.original_price || 1)) * 100)}% indirim
                    </div>
                  </div>
                </div>
                
                <div className="detail-saved-info">
                  <FaLeaf /> {selectedProduct.savedCount || selectedProduct.quantity_available || 0} paket mevcut
                </div>

                <div className="detail-description">
                  <h3>Paket İçeriği</h3>
                  <p>{
                    selectedProduct.description || 
                    'Bu paket restoran/market tarafından günün sonunda artan yemeklerden oluşturulmuştur. İçeriği günlük olarak değişmektedir. Gıda israfını önlemek için bu paketi ayırabilirsiniz.'
                  }</p>
                </div>
                
                <div className="detail-ratings">
                  <div className="detail-rating">
                    <span className="rating-star">★★★★★</span> 4.8/5.0
                  </div>
                  <div className="detail-review-count">
                    (47 değerlendirme)
                  </div>
                </div>
                
                <div className="detail-highlights">
                  <h3>Öne Çıkanlar</h3>
                  <ul>
                    <li><FaSmile /> Güler yüzlü çalışanlar</li>
                    <li><FaPizzaSlice /> Lezzetli yemekler</li>
                    <li><FaBolt /> Hızlı teslim</li>
                  </ul>
                </div>
                
                <button 
                  className="detail-reserve-button" 
                  onClick={() => addToCart(selectedProduct)}
                >
                  Ürünü Kurtar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

 
    </>
  );
};

export default Home;