import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaStar, 
  FaArrowLeft, 
  FaCalendarAlt, 
  FaStore, 
  FaUtensils,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaReply,
  FaSpinner
} from 'react-icons/fa';
import './MyReview.css';

// Style objeleri
const styles = {
  container: { 
    padding: '20px', 
    maxWidth: '1200px', 
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif'
  },
  header: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '15px', 
    marginBottom: '20px',
    borderBottom: '2px solid #eee',
    paddingBottom: '15px'
  },
  backButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#333',
    padding: '8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s'
  },
  reviewCard: {
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '8px',
    marginBottom: '20px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'box-shadow 0.2s'
  },
  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #eee'
  },
  productImage: {
    width: '120px',
    height: '120px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid #ddd',
    backgroundColor: '#f8f9fa'
  },
  ratingRow: { 
    marginBottom: '8px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px' 
  },
  stars: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '2px' 
  },
  actionButton: {
    background: 'none',
    border: '1px solid #ddd',
    padding: '8px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingSpinner: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#666'
  }
};

// Bu fonksiyonları diğer component'lerde kullanabilirsiniz
export const checkIfAlreadyReviewed = (productId) => {
  const reviewedIds = JSON.parse(localStorage.getItem('reviewedProductIds') || '[]');
  return reviewedIds.includes(productId);
};

// Yorum yapma girişiminde kullanılacak fonksiyon
export const handleReviewAttempt = (productId, showNotificationCallback) => {
  if (checkIfAlreadyReviewed(productId)) {
    showNotificationCallback('Bu ürün için zaten değerlendirme yapmışsınız!', 'info');
    return false; // Yorum formunu açma
  }
  return true; // Yorum formunu aç
};

const MyReviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [updatingVisibilityIds, setUpdatingVisibilityIds] = useState(new Set());
  const [reviewedProductIds, setReviewedProductIds] = useState(new Set());
  const [notification, setNotification] = useState(null);

  // Token alma fonksiyonu
  const getAuthToken = useCallback(() => {
    return localStorage.getItem('token') || localStorage.getItem('authToken');
  }, []);

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
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        backgroundColor: type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#fff3cd',
        color: type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#856404',
        border: `1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#ffeaa7'}`,
        borderRadius: '8px',
        padding: '15px 20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        maxWidth: '400px',
        animation: 'slideInFromRight 0.3s ease-out'
      }}>
        <div style={{ fontSize: '18px' }}>
          {type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
        </div>
        <span style={{ flex: 1, fontSize: '14px', fontWeight: '500' }}>{message}</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            color: 'inherit',
            padding: '2px 6px',
            borderRadius: '4px'
          }}
        >
          ×
        </button>
      </div>
    );
  });

  // Yorumları getir
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      
      if (!token) {
        setError('Oturum açmanız gerekiyor');
        return;
      }

      console.log('📋 Kullanıcı yorumları getiriliyor...');

      const response = await fetch(`${API_BASE_URL}/review/my-reviews`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP ${response.status}`);
        } else {
          throw new Error(`HTTP ${response.status}: Server hatası`);
        }
      }

      const data = await response.json();
      console.log('✅ API Response:', data);
      
      if (data.success && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
        // Yorum yapılmış ürün ID'lerini topla
        const productIds = new Set(data.reviews.map(review => review.product_id).filter(Boolean));
        setReviewedProductIds(productIds);
        // Yorum yapılmış ürün ID'lerini localStorage'a kaydet
        localStorage.setItem('reviewedProductIds', JSON.stringify([...productIds]));
        console.log(`📊 ${data.reviews.length} yorum yüklendi`);
      } else {
        console.warn('⚠️ API response formatı beklenmeyen:', data);
        setReviews([]);
      }
      
    } catch (error) {
      console.error('❌ Yorumlar yüklenirken hata:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  // Component mount edildiğinde yorumları yükle
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

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

  // Yıldız bileşeni
  const StarRating = React.memo(({ rating, label }) => {
    const ratingValue = Number(rating) || 0;
    
    return (
      <div style={styles.ratingRow}>
        <span style={{ 
          minWidth: '130px', 
          fontSize: '14px', 
          color: '#555',
          fontWeight: '500'
        }}>
          {label}:
        </span>
        <div style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <FaStar
              key={star}
              style={{
                color: star <= ratingValue ? '#FFD700' : '#E0E0E0',
                fontSize: '16px'
              }}
            />
          ))}
          <span style={{ 
            marginLeft: '8px', 
            fontSize: '14px', 
            color: '#666',
            fontWeight: '500'
          }}>
            ({ratingValue}/5)
          </span>
        </div>
      </div>
    );
  });

  // Filtreleme ve sıralama
  const filteredAndSortedReviews = useMemo(() => {
    if (!Array.isArray(reviews)) return [];

    return reviews
      .filter(review => {
        const reviewDate = new Date(review.created_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const rating = Number(review.rating) || 0;

        switch (filter) {
          case 'recent':
            return reviewDate > weekAgo;
          case 'high-rated':
            return rating >= 4;
          case 'low-rated':
            return rating <= 3;
          default:
            return true;
        }
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        const ratingA = Number(a.rating) || 0;
        const ratingB = Number(b.rating) || 0;

        switch (sortBy) {
          case 'oldest':
            return dateA - dateB;
          case 'rating-high':
            return ratingB - ratingA || dateB - dateA;
          case 'rating-low':
            return ratingA - ratingB || dateB - dateA;
          default: // newest
            return dateB - dateA;
        }
      });
  }, [reviews, filter, sortBy]);

  // Görünürlük değiştir
  const toggleVisibility = useCallback(async (reviewId) => {
    if (updatingVisibilityIds.has(reviewId)) return;
    
    try {
      setUpdatingVisibilityIds(prev => new Set([...prev, reviewId]));
      
      const token = getAuthToken();
      const review = reviews.find(r => r.review_id === reviewId);
      
      if (!review) {
        throw new Error('Yorum bulunamadı');
      }

      console.log(`🔄 Görünürlük değiştiriliyor: ${reviewId} -> ${!review.is_visible}`);
      
      const response = await fetch(`${API_BASE_URL}/review/${reviewId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_visible: !review.is_visible
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Görünürlük değiştirilemedi');
      }

      const result = await response.json();
      console.log('✅ Görünürlük değiştirildi:', result);

      setReviews(prevReviews => 
        prevReviews.map(r => 
          r.review_id === reviewId 
            ? { ...r, is_visible: !r.is_visible }
            : r
        )
      );

      showNotification(
        `Yorum ${!review.is_visible ? 'görünür' : 'gizli'} yapıldı`,
        'success'
      );
      
    } catch (error) {
      console.error('❌ Görünürlük değiştirme hatası:', error);
      showNotification('Görünürlük değiştirilirken hata oluştu: ' + error.message, 'error');
    } finally {
      setUpdatingVisibilityIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });
    }
  }, [reviews, getAuthToken, updatingVisibilityIds, showNotification]);

  // Yorum sil
  const deleteReview = useCallback(async (reviewId) => {
    if (deletingIds.has(reviewId)) return;
    
    const confirmDelete = window.confirm('Bu yorumu silmek istediğinizden emin misiniz?');
    if (!confirmDelete) return;

    try {
      setDeletingIds(prev => new Set([...prev, reviewId]));
      
      const token = getAuthToken();
      
      console.log(`🗑️ Yorum siliniyor: ${reviewId}`);
      
      const response = await fetch(`${API_BASE_URL}/review/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Yorum silinemedi');
      }

      const result = await response.json();
      console.log('✅ Yorum silindi:', result);

      const deletedReview = reviews.find(r => r.review_id === reviewId);
      
      setReviews(prevReviews => 
        prevReviews.filter(review => review.review_id !== reviewId)
      );

      // Silinen yorumun ürün ID'sini reviewedProductIds'den çıkar
      if (deletedReview && deletedReview.product_id) {
        setReviewedProductIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(deletedReview.product_id);
          return newSet;
        });
        
        // localStorage'ı da güncelle
        const currentReviewedIds = JSON.parse(localStorage.getItem('reviewedProductIds') || '[]');
        const updatedIds = currentReviewedIds.filter(id => id !== deletedReview.product_id);
        localStorage.setItem('reviewedProductIds', JSON.stringify(updatedIds));
      }

      showNotification('Yorum başarıyla silindi', 'success');
      
    } catch (error) {
      console.error('❌ Silme hatası:', error);
      showNotification('Yorum silinirken hata oluştu: ' + error.message, 'error');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });
    }
  }, [getAuthToken, deletingIds, reviews, showNotification]);

  // Resim hata işleyicisi
  const handleImageError = useCallback((e) => {
    e.target.src = '/default-food.jpg';
    e.target.onerror = null; // Sonsuz döngüyü önle
  }, []);

  // Loading state
  if (loading) {
    return (
      <div style={styles.loadingSpinner}>
        <FaSpinner className="fa-spin" style={{ marginRight: '10px' }} />
        Yorumlarınız yükleniyor...
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ 
        padding: '50px', 
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        margin: '20px',
        borderRadius: '8px'
      }}>
        <h2 style={{ color: '#dc3545', marginBottom: '15px' }}>❌ Hata Oluştu</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>{error}</p>
        <button 
          onClick={() => {
            setError(null);
            fetchReviews();
          }}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Tekrar Dene
        </button>
      </div>
    );
  }
  return (
    <>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <button 
            style={styles.backButton}
            onClick={() => navigate(-1)}
            onMouseOver={(e) => e.target.style.backgroundColor = '#f0f0f0'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <FaArrowLeft />
          </button>
          <h1 style={{ margin: 0, color: '#333', fontSize: '24px' }}>
            Değerlendirmelerim ({filteredAndSortedReviews.length})
          </h1>
        </div>

        {/* Filters */}
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          flexWrap: 'wrap'
        }}>
          <div>
            <label style={{ 
              marginRight: '8px', 
              fontWeight: 'bold',
              color: '#333'
            }}>
              Filtrele:
            </label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              style={{ 
                padding: '8px 12px', 
                borderRadius: '4px', 
                border: '1px solid #ddd',
                backgroundColor: 'white',
                fontSize: '14px'
              }}
            >
              <option value="all">Tümü ({reviews.length})</option>
              <option value="recent">Son 7 Gün</option>
              <option value="high-rated">Yüksek Puanlı (4-5 ⭐)</option>
              <option value="low-rated">Düşük Puanlı (1-3 ⭐)</option>
            </select>
          </div>

          <div>
            <label style={{ 
              marginRight: '8px', 
              fontWeight: 'bold',
              color: '#333'
            }}>
              Sırala:
            </label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={{ 
                padding: '8px 12px', 
                borderRadius: '4px', 
                border: '1px solid #ddd',
                backgroundColor: 'white',
                fontSize: '14px'
              }}
            >
              <option value="newest">En Yeni</option>
              <option value="oldest">En Eski</option>
              <option value="rating-high">Puan (Yüksek → Düşük)</option>
              <option value="rating-low">Puan (Düşük → Yüksek)</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        <div>
          {filteredAndSortedReviews.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '2px dashed #ddd'
            }}>
              <FaStar style={{ 
                fontSize: '64px', 
                color: '#ddd', 
                marginBottom: '20px' 
              }} />
              <h3 style={{ 
                color: '#666', 
                marginBottom: '10px',
                fontSize: '20px'
              }}>
                {filter === 'all' ? 'Henüz değerlendirme yapmamışsınız' : 'Filtreye uygun değerlendirme bulunamadı'}
              </h3>
              <p style={{ 
                color: '#888', 
                marginBottom: '25px',
                lineHeight: '1.5'
              }}>
                {filter === 'all' 
                  ? 'Satın aldığınız ürünleri değerlendirerek diğer kullanıcılara yardımcı olabilirsiniz.'
                  : 'Farklı bir filtre deneyin veya tüm yorumlarınızı görüntüleyin.'
                }
              </p>
              {filter === 'all' ? (
                <button 
                  onClick={() => navigate('/')}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  Ürünleri Keşfet
                </button>
              ) : (
                <button 
                  onClick={() => setFilter('all')}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  Tüm Yorumları Göster
                </button>
              )}
            </div>
          ) : (
            filteredAndSortedReviews.map((review) => (
              <div 
                key={review.review_id} 
                style={{
                  ...styles.reviewCard,
                  opacity: deletingIds.has(review.review_id) ? 0.6 : 1
                }}
              >
                {/* Review Header */}
                <div style={styles.reviewHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FaStore style={{ color: '#666', fontSize: '18px' }} />
                    <div>
                      <h3 style={{ 
                        margin: 0, 
                        fontSize: '16px', 
                        color: '#333',
                        fontWeight: '600'
                      }}>
                        {review.seller_name || 'Satıcı adı yok'}
                      </h3>
                      <span style={{ 
                        color: '#666', 
                        fontSize: '14px',
                        fontWeight: '400'
                      }}>
                        {review.product_name || 'Ürün adı yok'}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => toggleVisibility(review.review_id)}
                      disabled={updatingVisibilityIds.has(review.review_id)}
                      title={review.is_visible ? "Görünümü gizle" : "Görünümü aç"}
                      style={{
                        ...styles.actionButton,
                        color: review.is_visible ? '#28a745' : '#6c757d',
                        opacity: updatingVisibilityIds.has(review.review_id) ? 0.6 : 1
                      }}
                    >
                      {updatingVisibilityIds.has(review.review_id) ? (
                        <FaSpinner className="fa-spin" />
                      ) : (
                        review.is_visible ? <FaEye /> : <FaEyeSlash />
                      )}
                    </button>
                    <button 
                      title="Düzenle"
                      style={{
                        ...styles.actionButton,
                        color: '#007bff'
                      }}
                      onClick={() => {
                        // TODO: Düzenleme modalını aç
                        showNotification('Düzenleme özelliği henüz eklenmedi', 'info');
                      }}
                    >
                      <FaEdit />
                    </button>
                    <button 
                      onClick={() => deleteReview(review.review_id)}
                      disabled={deletingIds.has(review.review_id)}
                      title="Sil"
                      style={{
                        ...styles.actionButton,
                        color: '#dc3545',
                        opacity: deletingIds.has(review.review_id) ? 0.6 : 1
                      }}
                    >
                      {deletingIds.has(review.review_id) ? (
                        <FaSpinner className="fa-spin" />
                      ) : (
                        <FaTrash />
                      )}
                    </button>
                  </div>
                </div>

                {/* Review Content */}
                <div style={{ display: 'flex', padding: '20px', gap: '20px' }}>
                  {/* Product Image */}
                  <div style={{ flexShrink: 0 }}>
                    <img 
                      src={review.product_image || '/default-food.jpg'} 
                      alt={review.product_name || 'Ürün'} 
                      style={styles.productImage}
                      onError={handleImageError}
                    />
                  </div>

                  {/* Review Details */}
                  <div style={{ flex: 1 }}>
                    {/* Overall Rating */}
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        marginBottom: '8px' 
                      }}>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar
                              key={star}
                              style={{
                                color: star <= (Number(review.rating) || 0) ? '#FFD700' : '#E0E0E0',
                                fontSize: '22px'
                              }}
                            />
                          ))}
                        </div>
                        <span style={{ 
                          fontSize: '16px', 
                          fontWeight: 'bold',
                          color: '#333'
                        }}>
                          ({Number(review.rating) || 0}/5)
                        </span>
                      </div>
                      <span style={{ 
                        color: '#666', 
                        fontSize: '14px',
                        fontStyle: 'italic'
                      }}>
                        Genel Değerlendirme
                      </span>
                    </div>

                    {/* Detailed Ratings */}
                    <div style={{ 
                      marginBottom: '15px', 
                      padding: '12px', 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: '6px',
                      border: '1px solid #e9ecef'
                    }}>
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
                    <div style={{ 
                      backgroundColor: '#fff', 
                      padding: '15px', 
                      borderRadius: '6px',
                      border: '1px solid #e9ecef',
                      marginBottom: '15px'
                    }}>
                      <p style={{ 
                        margin: 0, 
                        fontStyle: 'italic', 
                        color: '#333',
                        fontSize: '15px',
                        lineHeight: '1.6'
                      }}>
                        "{review.comment}"
                      </p>
                    </div>
                  ) : (
                    <div style={{ 
                      backgroundColor: '#fff3cd', 
                      padding: '12px', 
                      fontSize: '13px',
                      color: '#856404',
                      borderRadius: '4px',
                      marginBottom: '15px',
                      border: '1px solid #ffeaa7'
                    }}>
                      ⚠️ Bu değerlendirmede yorum metni bulunmuyor
                    </div>
                  )}

                  {/* Review Meta */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingTop: '15px',
                    borderTop: '1px solid #eee',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      color: '#666'
                    }}>
                      <FaCalendarAlt />
                      <span style={{ fontSize: '14px' }}>
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {review.is_anonymous && (
                        <span style={{
                          backgroundColor: '#6c757d',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          Anonim
                        </span>
                      )}
                      {!review.is_visible && (
                        <span style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          Gizli
                        </span>
                      )}
                      {(Number(review.helpful_count) || 0) > 0 && (
                        <span style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {review.helpful_count} kişi faydalı buldu
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Seller Response */}
                  {review.response_text && review.response_text.trim() && (
                    <div style={{
                      marginTop: '15px',
                      padding: '15px',
                      backgroundColor: '#e8f4fd',
                      borderRadius: '6px',
                      borderLeft: '4px solid #007bff'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        marginBottom: '10px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#007bff'
                      }}>
                        <FaReply />
                        <span>Satıcı Yanıtı:</span>
                        {review.response_date && (
                          <span style={{ 
                            fontSize: '12px', 
                            fontWeight: 'normal', 
                            color: '#666' 
                          }}>
                            {formatDate(review.response_date)}
                          </span>
                        )}
                      </div>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '14px', 
                        color: '#333',
                        lineHeight: '1.5'
                      }}>
                        {review.response_text}
                      </p>
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

export default MyReviews;