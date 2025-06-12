import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaStar, 
  FaArrowLeft, 
  FaCalendarAlt, 
  FaUser, 
  FaUtensils,
  FaReply,
  FaSpinner,
  FaEye,
  FaEyeSlash,
  FaChartBar,
  FaComments
} from 'react-icons/fa';
import './SellerReview.css';

const backendUrl = "http://localhost:5051";

const SellerReviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [respondingIds, setRespondingIds] = useState(new Set());
  const [responseTexts, setResponseTexts] = useState({});
  const [notification, setNotification] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    averageRating: 0,
    responded: 0,
    needsResponse: 0
  });

  // Token alma fonksiyonu
  const getAuthToken = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    console.log('🔑 Token kontrol:', { token: token ? 'Mevcut' : 'Yok', length: token?.length });
    return token;
  };

  // API base URL
  const API_BASE_URL = 'http://localhost:5051/api';

  // Notification göster
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
  }, []);

  // Notification kapat
  const closeNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // Notification bileşeni
  const Notification = React.memo(({ message, type, onClose }) => {
    useEffect(() => {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }, [onClose]);

    return (
      <div className={`notification notification-${type}`}>
        <div className="notification-icon">
          {type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
        </div>
        <span className="notification-message">{message}</span>
        <button className="notification-close" onClick={onClose}>×</button>
      </div>
    );
  });

  // İstatistikleri hesapla
  const calculateStats = (reviewList) => {
    if (!Array.isArray(reviewList) || reviewList.length === 0) {
      return { total: 0, averageRating: 0, responded: 0, needsResponse: 0 };
    }

    const total = reviewList.length;
    const averageRating = reviewList.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / total;
    const responded = reviewList.filter(review => review.response_text && review.response_text.trim()).length;
    const needsResponse = total - responded;

    return {
      total,
      averageRating: Math.round(averageRating * 10) / 10,
      responded,
      needsResponse
    };
  };

  // Yorumları getir fonksiyonu - useCallback kaldırıldı
  const fetchReviews = async () => {
    try {
      console.log('🚀 fetchReviews başlatıldı');
      setLoading(true);
      setError(null);
      setDebugInfo(null);
      
      const token = getAuthToken();
      
      if (!token) {
        console.error('❌ Token bulunamadı');
        setError('Oturum açmanız gerekiyor');
        setDebugInfo({ step: 'token_check', status: 'failed', message: 'Token yok' });
        return;
      }

      console.log('📋 API isteği hazırlanıyor...');
      const url = `${API_BASE_URL}/review/seller-reviews?page=1&limit=50&filter=${filter}&sort=${sortBy}`;
      console.log('🌐 URL:', url);

      setDebugInfo({ step: 'api_request', url, token: token.substring(0, 20) + '...' });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', [...response.headers.entries()]);

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        console.log('❌ Response başarısız, content-type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('❌ Error data:', errorData);
          setDebugInfo({ step: 'api_error', status: response.status, error: errorData });
          throw new Error(errorData.message || `HTTP ${response.status}`);
        } else {
          const textResponse = await response.text();
          console.error('❌ Non-JSON response:', textResponse);
          setDebugInfo({ step: 'api_error', status: response.status, response: textResponse });
          throw new Error(`HTTP ${response.status}: Server hatası`);
        }
      }

      const data = await response.json();
      console.log('✅ API Response tam data:', data);
      setDebugInfo({ step: 'success', data: data });
      
      if (data.success && Array.isArray(data.reviews)) {
        console.log('✅ Reviews set ediliyor:', data.reviews.length, 'adet');
        console.log('✅ İlk review örneği:', data.reviews[0]);
        
        // Reviews'i doğrudan set et
        setReviews([...data.reviews]); // Spread operator ile yeni array oluştur
        
        if (data.stats) {
          setStats({
            total: Number(data.stats.total) || 0,
            averageRating: parseFloat(data.stats.averageRating) || 0,
            responded: Number(data.stats.responded) || 0,
            needsResponse: Number(data.stats.needsResponse) || 0
          });
        } else {
          setStats(calculateStats(data.reviews));
        }
        
        console.log(`📊 ${data.reviews.length} yorum yüklendi`);
        
      } else {
        console.warn('⚠️ API response formatı beklenmeyen:', data);
        setReviews([]);
        setStats({ total: 0, averageRating: 0, responded: 0, needsResponse: 0 });
        setDebugInfo({ step: 'format_error', data });
      }
      
    } catch (error) {
      console.error('❌ Fetch hatası:', error);
      setError(error.message);
      setDebugInfo({ step: 'catch_error', error: error.message, stack: error.stack });
      setReviews([]);
    } finally {
      console.log('🏁 Loading tamamlandı');
      setLoading(false);
    }
  };

  // Component mount edildiğinde yorumları yükle
  useEffect(() => {
    console.log('🔄 useEffect tetiklendi - fetchReviews çağrılacak');
    fetchReviews();
  }, [filter, sortBy]); // fetchReviews'i dependency'den çıkardık

  // Tarih formatlama
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'Tarih belirtilmemiş';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Tarih formatlama hatası:', error);
      return 'Geçersiz tarih';
    }
  }, []);

  // ⭐ FİX: Düzeltilmiş Yıldız bileşeni
  const StarRating = React.memo(({ rating, label, showLabel = true, size = 'normal' }) => {
    const ratingValue = Number(rating) || 0;
    const starClass = size === 'large' ? 'star-large' : 'star-normal';
    
    return (
      <div className="rating-row">
        {showLabel && (
          <span className="rating-label">{label}:</span>
        )}
        <div className="stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <FaStar
              key={star}
              className={`${starClass} ${star <= ratingValue ? 'star-filled' : 'star-empty'}`}
              style={{
                color: star <= ratingValue ? '#ffc107' : '#e9ecef',
                fontSize: size === 'large' ? '24px' : '16px'
              }}
            />
          ))}
          <span className="rating-value" style={{ marginLeft: '8px', color: '#6c757d' }}>
            ({ratingValue}/5)
          </span>
        </div>
      </div>
    );
  });

  // Filtreleme ve sıralama
  const filteredAndSortedReviews = useMemo(() => {
    console.log('🔍 filteredAndSortedReviews hesaplanıyor...');
    console.log('🔍 Reviews array:', reviews);
    console.log('🔍 Reviews length:', reviews?.length);

    if (!Array.isArray(reviews)) {
      console.warn('⚠️ Reviews array değil:', typeof reviews);
      return [];
    }

    const filtered = reviews.filter(review => {
      const reviewDate = new Date(review.created_at);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const rating = Number(review.rating) || 0;
      const hasResponse = review.response_text && review.response_text.trim();

      let shouldInclude = true;

      switch (filter) {
        case 'recent':
          shouldInclude = reviewDate > weekAgo;
          break;
        case 'high-rated':
          shouldInclude = rating >= 4;
          break;
        case 'low-rated':
          shouldInclude = rating <= 3;
          break;
        case 'responded':
          shouldInclude = hasResponse;
          break;
        case 'needs-response':
          shouldInclude = !hasResponse;
          break;
        default:
          shouldInclude = true;
      }

      return shouldInclude;
    });

    const sorted = filtered.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      const ratingA = Number(a.rating) || 0;
      const ratingB = Number(b.rating) || 0;
      const hasResponseA = a.response_text && a.response_text.trim();
      const hasResponseB = b.response_text && b.response_text.trim();

      switch (sortBy) {
        case 'oldest':
          return dateA - dateB;
        case 'rating-high':
          return ratingB - ratingA || dateB - dateA;
        case 'rating-low':
          return ratingA - ratingB || dateB - dateA;
        case 'needs-response':
          return (hasResponseA ? 1 : 0) - (hasResponseB ? 1 : 0) || dateB - dateA;
        default: // newest
          return dateB - dateA;
      }
    });

    console.log('🔍 Final sorted reviews count:', sorted.length);
    return sorted;
  }, [reviews, filter, sortBy]);

  // Yanıt gönder
  const submitResponse = useCallback(async (reviewId) => {
    const responseText = responseTexts[reviewId];
    
    if (!responseText || !responseText.trim()) {
      showNotification('Lütfen yanıt metnini girin', 'error');
      return;
    }

    if (respondingIds.has(reviewId)) return;

    try {
      setRespondingIds(prev => new Set([...prev, reviewId]));
      
      const token = getAuthToken();
      
      console.log(`📝 Yanıt gönderiliyor: ${reviewId}`);
      
      const response = await fetch(`${API_BASE_URL}/review/${reviewId}/response`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          response_text: responseText.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Yanıt gönderilemedi');
      }

      const result = await response.json();
      console.log('✅ Yanıt gönderildi:', result);

      setReviews(prevReviews => 
        prevReviews.map(r => 
          r.review_id === reviewId 
            ? { 
                ...r, 
                response_text: responseText.trim(),
                response_date: new Date().toISOString()
              }
            : r
        )
      );

      setResponseTexts(prev => {
        const newTexts = { ...prev };
        delete newTexts[reviewId];
        return newTexts;
      });

      setStats(prevStats => ({
        ...prevStats,
        responded: prevStats.responded + 1,
        needsResponse: prevStats.needsResponse - 1
      }));

      showNotification('Yanıt başarıyla gönderildi', 'success');
      
    } catch (error) {
      console.error('❌ Yanıt gönderme hatası:', error);
      showNotification('Yanıt gönderilirken hata oluştu: ' + error.message, 'error');
    } finally {
      setRespondingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });
    }
  }, [responseTexts, respondingIds, showNotification]);

  // Yanıt metnini güncelle
  const updateResponseText = useCallback((reviewId, text) => {
    setResponseTexts(prev => ({
      ...prev,
      [reviewId]: text
    }));
  }, []);

  // Resim hata işleyicisi
  const handleImageError = useCallback((e) => {
    e.target.src = '/default-food.jpg';
    e.target.onerror = null;
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="loading-spinner">
        <FaSpinner className="fa-spin" />
        <p>Müşteri yorumları yükleniyor...</p>
        
        {debugInfo && (
          <div style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '8px', fontSize: '12px' }}>
            <h4>🔍 Debug Bilgisi:</h4>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
        
        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={() => {
              console.log('🔄 Manuel yeniden deneme');
              fetchReviews();
            }}
            style={{ padding: '10px 20px', cursor: 'pointer' }}
          >
            🔄 Yeniden Dene
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="error-container">
        <h2 className="error-title">❌ Hata Oluştu</h2>
        <p className="error-message">{error}</p>
        
        {debugInfo && (
          <div style={{ marginTop: '20px', padding: '10px', background: '#ffe6e6', borderRadius: '8px', fontSize: '12px' }}>
            <h4>🔍 Hata Detayları:</h4>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
        
        <button 
          className="retry-button"
          onClick={() => {
            setError(null);
            fetchReviews();
          }}
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  console.log('🔍 Render - filteredAndSortedReviews.length:', filteredAndSortedReviews.length);

  return (
    <>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}
      <div className="seller-reviews-container">
        {/* Header */}
        <div className="header">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FaArrowLeft />
          </button>
          <h1 className="page-title">Müşteri Değerlendirmeleri</h1>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FaComments />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Toplam Değerlendirme</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FaStar />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.averageRating}</div>
              <div className="stat-label">Ortalama Puan</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FaReply />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.responded}</div>
              <div className="stat-label">Yanıtlanan</div>
            </div>
          </div>
          
          <div className="stat-card needs-response">
            <div className="stat-icon">
              <FaEye />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.needsResponse}</div>
              <div className="stat-label">Yanıt Bekleyen</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-container">
          <div className="filter-group">
            <label className="filter-label">Filtrele:</label>
            <select 
              className="filter-select"
              value={filter} 
              onChange={(e) => {
                console.log('🔄 Filter değiştiriliyor:', e.target.value);
                setFilter(e.target.value);
              }}
            >
              <option value="all">Tümü ({reviews.length})</option>
              <option value="needs-response">Yanıt Bekleyen ({stats.needsResponse})</option>
              <option value="responded">Yanıtlanan ({stats.responded})</option>
              <option value="recent">Son 7 Gün</option>
              <option value="high-rated">Yüksek Puanlı (4-5 ⭐)</option>
              <option value="low-rated">Düşük Puanlı (1-3 ⭐)</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Sırala:</label>
            <select 
              className="filter-select"
              value={sortBy} 
              onChange={(e) => {
                console.log('🔄 Sort değiştiriliyor:', e.target.value);
                setSortBy(e.target.value);
              }}
            >
              <option value="newest">En Yeni</option>
              <option value="oldest">En Eski</option>
              <option value="needs-response">Yanıt Bekleyen Önce</option>
              <option value="rating-high">Puan (Yüksek → Düşük)</option>
              <option value="rating-low">Puan (Düşük → Yüksek)</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        <div className="reviews-list">
          {filteredAndSortedReviews.length === 0 ? (
            <div className="empty-state">
              <FaStar className="empty-icon" />
              <h3 className="empty-title">
                {filter === 'all' ? 'Henüz değerlendirme yapılmamış' : 'Filtreye uygun değerlendirme bulunamadı'}
              </h3>
              <p className="empty-description">
                {filter === 'all' 
                  ? 'Müşterileriniz ürünlerinizi değerlendirdiğinde burada görünecekler.'
                  : 'Farklı bir filtre deneyin veya tüm yorumları görüntüleyin.'
                }
              </p>
              {filter !== 'all' && (
                <button 
                  className="show-all-button"
                  onClick={() => setFilter('all')}
                >
                  Tüm Yorumları Göster
                </button>
              )}
            </div>
          ) : (
            filteredAndSortedReviews.map((review) => (
              <div key={review.review_id} className="review-card">
                {/* Review Header */}
                <div className="review-header">
                  <div className="customer-info">
                    <div className="customer-avatar">
                      <FaUser />
                    </div>
                    <div className="customer-details">
                      <h3 className="customer-name">
                        {review.is_anonymous ? 'Anonim Müşteri' : (review.customer_name || 'Müşteri')}
                      </h3>
                      <span className="product-name">
                        {review.product_name || 'Ürün adı yok'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="review-badges">
                    {review.is_anonymous && (
                      <span className="badge badge-anonymous">Anonim</span>
                    )}
                    {review.response_text && review.response_text.trim() ? (
                      <span className="badge badge-responded">Yanıtlandı</span>
                    ) : (
                      <span className="badge badge-needs-response">Yanıt Bekliyor</span>
                    )}
                  </div>
                </div>

                {/* Review Content */}
                <div className="review-content">
                  {/* Product Image */}
                  <div className="review-product-image-container">
                    <img
                      className="review-product-image"
                      src={
                        review.product_image
                          ? (review.product_image.startsWith('http')
                              ? review.product_image
                              : `${backendUrl}/${review.product_image.replace(/\\\\/g, "/").replace(/\\/g, "/")}`)
                          : '/default-food.jpg'
                      }
                      alt={review.product_name || 'Ürün'}
                      onError={handleImageError}
                    />
                  </div>

                  {/* Review Details */}
                  <div className="review-details">
                    {/* Product Details */}
                    <div className="product-details">
                      <div className="product-name">{review.product_name}</div>
                      {review.discounted_price && (
                        <div className="product-price">{review.discounted_price} TL</div>
                      )}
                      {review.original_price && (
                        <div className="product-original-price">
                          <s>{review.original_price} TL</s>
                        </div>
                      )}
                      {review.category_id && (
                        <div className="product-category">Kategori: {review.category_id}</div>
                      )}
                      {review.description && (
                        <div className="product-description">{review.description}</div>
                      )}
                    </div>

                    {/* Overall Rating */}
                    <div className="overall-rating">
                      <div className="rating-display">
                        <div className="stars-large">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar
                              key={star}
                              style={{
                                color: star <= (Number(review.rating) || 0) ? '#ffc107' : '#e9ecef',
                                fontSize: '24px',
                                marginRight: '4px'
                              }}
                            />
                          ))}
                        </div>
                        <span className="rating-number">
                          ({Number(review.rating) || 0}/5)
                        </span>
                      </div>
                      <span className="rating-subtitle">Genel Değerlendirme</span>
                    </div>

                    {/* Detailed Ratings */}
                    <div className="detailed-ratings">
                      <StarRating 
                        rating={review.food_quality_rating} 
                        label="Yiyecek Kalitesi" 
                      />
                      <StarRating 
                        rating={review.service_rating} 
                        label="Hizmet Kalitesi" 
                      />
                      <StarRating 
                        rating={review.value_rating} 
                        label="Fiyat/Performans" 
                      />
                    </div>

                    {/* Comment Section */}
                    {review.comment && review.comment.trim() ? (
                      <div className="comment-section">
                        <p className="comment-text">"{review.comment}"</p>
                      </div>
                    ) : (
                      <div className="no-comment">
                        ⚠️ Bu değerlendirmede yorum metni bulunmuyor
                      </div>
                    )}

                    {/* Review Meta */}
                    <div className="review-meta">
                      <div className="review-date">
                        <FaCalendarAlt style={{ marginRight: '8px' }} />
                        <span>{formatDate(review.created_at)}</span>
                      </div>
                      
                      <div className="helpful-count">
                        {(Number(review.helpful_count) || 0) > 0 && (
                          <span className="badge badge-helpful">
                            {review.helpful_count} kişi faydalı buldu
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Existing Response */}
                    {review.response_text && review.response_text.trim() && (
                      <div className="existing-response">
                        <div className="response-header">
                          <FaReply style={{ marginRight: '8px' }} />
                          <span>Sizin Yanıtınız:</span>
                          {review.response_date && (
                            <span className="response-date">
                              {formatDate(review.response_date)}
                            </span>
                          )}
                        </div>
                        <p className="response-text">{review.response_text}</p>
                      </div>
                    )}

                    {/* Response Form */}
                    {(!review.response_text || !review.response_text.trim()) && (
                      <div className="response-form">
                        <h4 className="response-form-title">
                          <FaReply style={{ marginRight: '8px' }} /> 
                          Bu değerlendirmeye yanıt verin
                        </h4>
                        <textarea
                          className="response-textarea"
                          placeholder="Müşterinize yanıtınızı yazın..."
                          value={responseTexts[review.review_id] || ''}
                          onChange={(e) => updateResponseText(review.review_id, e.target.value)}
                          rows={4}
                        />
                        <div className="response-actions">
                          <button
                            className="submit-response-button"
                            onClick={() => submitResponse(review.review_id)}
                            disabled={respondingIds.has(review.review_id) || !responseTexts[review.review_id]?.trim()}
                          >
                            {respondingIds.has(review.review_id) ? (
                              <>
                                <FaSpinner className="fa-spin" style={{ marginRight: '8px' }} />
                                Gönderiliyor...
                              </>
                            ) : (
                              <>
                                <FaReply style={{ marginRight: '8px' }} />
                                Yanıtı Gönder
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default SellerReviews;