import React, { useState, useEffect } from 'react';
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
  FaReply
} from 'react-icons/fa';
import './MyReview.css';

const MyReviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, recent, high-rated, low-rated
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, rating-high, rating-low


useEffect(() => {
  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      if (!token) {
        console.error('Token bulunamadı');
        return;
      }

      // ✅ Doğru endpoint URL'si
      const response = await fetch('http://localhost:5051/api/review/my-reviews', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // ✅ Response kontrolü ekleyin
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        // ✅ Eğer response HTML ise, metin olarak oku
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          const htmlText = await response.text();
          console.error('HTML Response alındı:', htmlText.substring(0, 200));
          throw new Error(`HTTP ${response.status}: Server HTML döndürdü`);
        }
        
        const errorData = await response.json();
        throw new Error(errorData.message || 'API Hatası');
      }

      const data = await response.json();
      console.log('✅ Reviews data:', data);
      
      // State'i güncelle
      if (data.success && data.reviews) {
        setReviews(data.reviews);
      }
      
    } catch (error) {
      console.error('Değerlendirmeler yüklenirken hata oluştu:', error);
      
      // ✅ Daha anlamlı hata mesajları
      if (error.message.includes('HTML döndürdü')) {
        setError('Sunucu yanıt veremedi. API endpoint\'i kontrol edin.');
      } else if (error.message.includes('JSON')) {
        setError('Sunucudan geçersiz yanıt alındı.');
      } else {
        setError(error.message || 'Değerlendirmeler yüklenemedi');
      }
    } finally {
      setLoading(false);
    }
  };

    fetchReviews();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating, label) => {
    return (
      <div className="rating-row">
        <span className="rating-label">{label}:</span>
        <div className="stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <FaStar
              key={star}
              className={star <= rating ? 'star-filled' : 'star-empty'}
            />
          ))}
          <span className="rating-number">({rating}/5)</span>
        </div>
      </div>
    );
  };

  const filteredAndSortedReviews = reviews
    .filter(review => {
      switch (filter) {
        case 'recent':
          return new Date(review.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        case 'high-rated':
          return review.rating >= 4;
        case 'low-rated':
          return review.rating <= 3;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'rating-high':
          return b.rating - a.rating;
        case 'rating-low':
          return a.rating - b.rating;
        default: // newest
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

  const toggleVisibility = (reviewId) => {
    setReviews(reviews.map(review => 
      review.review_id === reviewId 
        ? { ...review, is_visible: !review.is_visible }
        : review
    ));
  };

  const deleteReview = (reviewId) => {
    if (window.confirm('Bu değerlendirmeyi silmek istediğinizden emin misiniz?')) {
      setReviews(reviews.filter(review => review.review_id !== reviewId));
    }
  };

  if (loading) {
    return (
      <div className="my-reviews-container">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Değerlendirmeleriniz yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-reviews-container">
        <div className="error-screen">
          <h2>Hata Oluştu</h2>
          <p>{error}</p>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-reviews-container">
      <div className="my-reviews-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        <h1>Değerlendirmelerim</h1>
        <div className="reviews-count">
          {reviews.length} değerlendirme
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>Filtrele:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Tümü</option>
            <option value="recent">Son 7 gün</option>
            <option value="high-rated">Yüksek puanlı (4-5 ⭐)</option>
            <option value="low-rated">Düşük puanlı (1-3 ⭐)</option>
          </select>
        </div>

        <div className="sort-group">
          <label>Sırala:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">En yeni</option>
            <option value="oldest">En eski</option>
            <option value="rating-high">Puan (Yüksek → Düşük)</option>
            <option value="rating-low">Puan (Düşük → Yüksek)</option>
          </select>
        </div>
      </div>

      <div className="reviews-list">
        {filteredAndSortedReviews.length === 0 ? (
          <div className="empty-reviews">
            <FaStar className="empty-icon" />
            <h3>Henüz değerlendirme yapmamışsınız</h3>
            <p>Satın aldığınız ürünleri değerlendirerek diğer kullanıcılara yardımcı olabilirsiniz.</p>
            <button className="browse-button" onClick={() => navigate('/')}>
              Ürünleri Keşfet
            </button>
          </div>
        ) : (
          filteredAndSortedReviews.map((review) => (
            <div key={review.review_id} className="review-card">
              <div className="review-header">
                <div className="seller-info">
                  <FaStore className="store-icon" />
                  <div>
                    <h3>{review.seller_name}</h3>
                    <span className="product-name">{review.product_name}</span>
                  </div>
                </div>
                
                <div className="review-actions">
                  <button 
                    className="visibility-toggle"
                    onClick={() => toggleVisibility(review.review_id)}
                    title={review.is_visible ? "Görünümü gizle" : "Görünümü aç"}
                  >
                    {review.is_visible ? <FaEye /> : <FaEyeSlash />}
                  </button>
                  <button 
                    className="edit-button"
                    title="Düzenle"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => deleteReview(review.review_id)}
                    title="Sil"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div className="review-content">
                <div className="product-image">
                  <img src={review.product_image} alt={review.product_name} />
                </div>

                <div className="review-details">
                  <div className="overall-rating">
                    <div className="stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar
                          key={star}
                          className={star <= review.rating ? 'star-filled' : 'star-empty'}
                        />
                      ))}
                    </div>
                    <span className="rating-text">Genel Değerlendirme</span>
                  </div>

                  <div className="detailed-ratings">
                    {renderStars(review.food_quality_rating, "Yiyecek Kalitesi")}
                    {renderStars(review.service_rating, "Hizmet")}
                    {renderStars(review.value_rating, "Fiyat/Performans")}
                  </div>

                  {review.comment && (
                    <div className="comment-section">
                      <p className="comment-text">"{review.comment}"</p>
                    </div>
                  )}

                  <div className="review-meta">
                    <div className="review-date">
                      <FaCalendarAlt />
                      {formatDate(review.created_at)}
                    </div>
                    
                    <div className="review-status">
                      {review.is_anonymous && (
                        <span className="anonymous-badge">Anonim</span>
                      )}
                      {!review.is_visible && (
                        <span className="hidden-badge">Gizli</span>
                      )}
                      {review.helpful_count > 0 && (
                        <span className="helpful-badge">
                          {review.helpful_count} kişi faydalı buldu
                        </span>
                      )}
                    </div>
                  </div>

                  {review.response_text && (
                    <div className="seller-response">
                      <div className="response-header">
                        <FaReply />
                        <strong>Satıcı Yanıtı:</strong>
                        <span className="response-date">
                          {formatDate(review.response_date)}
                        </span>
                      </div>
                      <p className="response-text">{review.response_text}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyReviews;