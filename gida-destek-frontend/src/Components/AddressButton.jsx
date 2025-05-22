import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaSearch, FaPlus, FaMinus, FaMapMarkerAlt } from 'react-icons/fa';
import './AddressButton.css';

const AddressButton = () => {
  const [showAddressPanel, setShowAddressPanel] = useState(false);
  const [showMapPanel, setShowMapPanel] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([
    { id: 1, name: 'Ev', address: 'Kadıköy, İstanbul', lat: 40.9830, lng: 29.0321 },
    { id: 2, name: 'İş', address: 'Şişli, İstanbul', lat: 41.0572, lng: 28.9870 }
  ]);
  const [mapCenter, setMapCenter] = useState({ lat: 41.0082, lng: 28.9784 }); // İstanbul merkez
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [addressName, setAddressName] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const searchBoxRef = useRef(null);
  const autocompleteRef = useRef(null);
  
  // Google Maps API'sini yükleyen fonksiyon
  useEffect(() => {
    if (showMapPanel && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCDLCFkp4u74d7NrR7XUS-HhDLNF3xq9Is&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else if (showMapPanel && window.google) {
      initMap();
    }

    // LocalStorage'dan kayıtlı adresleri yükle
    const storedAddresses = localStorage.getItem('savedAddresses');
    if (storedAddresses) {
      setSavedAddresses(JSON.parse(storedAddresses));
    }

    // LocalStorage'dan seçili adresi yükle
    const storedSelectedAddress = localStorage.getItem('selectedAddress');
    if (storedSelectedAddress) {
      setSelectedAddress(storedSelectedAddress);
    }
  }, [showMapPanel]);

  // Kayıtlı adresler değiştiğinde localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('savedAddresses', JSON.stringify(savedAddresses));
  }, [savedAddresses]);

  // Seçili adres değiştiğinde localStorage'a kaydet
  useEffect(() => {
    if (selectedAddress) {
      localStorage.setItem('selectedAddress', selectedAddress);
    }
  }, [selectedAddress]);

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
      
      // Reverse geocoding - koordinatlardan adres bilgisini al
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat: position.lat(), lng: position.lng() } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setAddressDetails(results[0].formatted_address);
        }
      });
    });

    // Arama kutusu için autocomplete
    if (searchBoxRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(searchBoxRef.current, {
        types: ['geocode']
      });
      
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        
        if (!place.geometry) return;
        
        // Haritanın merkezini ve yakınlaştırma seviyesini ayarla
        mapInstance.current.setCenter(place.geometry.location);
        mapInstance.current.setZoom(17);
        
        // Marker'ı yeni konuma taşı
        markerRef.current.setPosition(place.geometry.location);
        
        const position = place.geometry.location;
        setSelectedLocation({
          lat: position.lat(),
          lng: position.lng()
        });
        
        // Adres bilgisini güncelle
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
            
            // Reverse geocoding - koordinatlardan adres bilgisini al
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
  const handleAddAddress = () => {
    if (!addressName || !addressDetails || !selectedLocation) {
      alert("Lütfen tüm alanları doldurun ve haritada bir konum seçin.");
      return;
    }
    
    const newAddress = {
      id: Date.now(),
      name: addressName,
      address: addressDetails,
      lat: selectedLocation.lat,
      lng: selectedLocation.lng
    };
    
    setSavedAddresses([...savedAddresses, newAddress]);
    setAddressName('');
    setAddressDetails('');
    setSelectedLocation(null);
    setShowMapPanel(false);
  };

  // Adres seç
  const handleSelectAddress = (address) => {
    setSelectedAddress(address.address);
    setShowAddressPanel(false);
  };

  return (
    <div className="address-selection-container">
      <button
        className="address-button"
        onClick={() => setShowAddressPanel(true)}
      >
        <span className="address-icon">📍</span>
        <span className="address-text">
          {selectedAddress || 'Adres Seçin'}
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
              {savedAddresses.map(addr => (
                <div
                  key={addr.id}
                  className={`address-item ${selectedAddress === addr.address ? 'selected' : ''}`}
                  onClick={() => handleSelectAddress(addr)}
                >
                  <div className="address-name">{addr.name}</div>
                  <div className="address-detail">{addr.address}</div>
                </div>
              ))}
            </div>
            <button 
              className="add-new-address-button"
              onClick={() => {
                setShowAddressPanel(false);
                setShowMapPanel(true);
              }}
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
              {/* Google Maps burada yüklenecek */}
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
                >
                  Geri Dön
                </button>
                <button 
                  className="save-button"
                  onClick={handleAddAddress}
                >
                  Bu Konumu Kullan
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