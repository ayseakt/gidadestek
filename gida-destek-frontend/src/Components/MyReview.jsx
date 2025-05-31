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
  const [filter, setFilter] = useState('all'); // all, recent, high-rated, low-rated
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, rating-high, rating-low

  // Mock data - gerçek uygulamada API'den gelecek
  const mockReviews = [
    {
      review_id: 1,
      seller_name: "Ada Market",
      seller_id: 1,
      order_id: 101,
      package_id: null,
      rating: 5,
      food_quality_rating: 5,
      service_rating: 4,
      value_rating: 5,
      comment: "Çok taze ve lezzetli ürünler vardı. Özellikle evde yapılan börek harikaydı!",
      is_visible: true,
      is_anonymous: false,
      helpful_count: 3,
      response_text: "Değerli görüşünüz için teşekkür ederiz!",
      response_date: "2024-01-15T14:30:00Z",
      created_at: "2024-01-14T18:45:00Z",
      product_name: "Karma Paket",
      product_image: "https://via.placeholder.com/100"
    },
    {
      review_id: 2,
      seller_name: "Lezzet Durağı",
      seller_id: 2,
      order_id: 102,
      package_id: 25,
      rating: 4,
      food_quality_rating: 4,
      service_rating: 4,
      value_rating: 3,
      comment: "Genel olarak memnunum ama fiyat biraz yüksek geldi.",
      is_visible: true,
      is_anonymous: true,
      helpful_count: 1,
      response_text: null,
      response_date: null,
      created_at: "2024-01-12T12:20:00Z",
      product_name: "Pizza Dilimi Paketi",
      product_image: "https://via.placeholder.com/100"
    },
    {
      review_id: 3,
      seller_name: "Tatlı Köşe",
      seller_id: 3,
      order_id: 103,
      package_id: null,
      rating: 3,
      food_quality_rating: 3,
      service_rating: 2,
      value_rating: 4,
      comment: "Tatlılar güzeldi ama servis biraz gecikmişti.",
      is_visible: false,
      is_anonymous: false,
      helpful_count: 0,
      response_text: "Özür dileriz, bir dahaki sefere daha hızlı olacağız.",
      response_date: "2024-01-08T16:15:00Z",
      created_at: "2024-01-07T20:10:00Z",
      product_name: "Tatlı Çeşitleri",
      product_image: "https://via.placeholder.com/100"
    }
  ];

  useEffect(() => {
    // Gerçek uygulamada API çağrısı yapılacak
    const fetchReviews = async () => {
      try {
        setLoading(true);
        // API çağrısı burada olacak
        // const response = await fetch('/api/user/reviews');
        // const data = await response.json();
        
        // Mock data kullanıyoruz
        await new Promise(resolve => setTimeout(resolve, 1000)); // Loading simulation
        setReviews(mockReviews);
      } catch (error) {
        console.error('Değerlendirmeler yüklenirken hata oluştu:', error);
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