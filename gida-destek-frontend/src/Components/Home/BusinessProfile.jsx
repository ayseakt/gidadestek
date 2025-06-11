import React, { useState, useEffect } from 'react';
import { 
  FaTimes, FaStar, FaMapMarkerAlt, FaClock, FaPhone, 
  FaInstagram, FaFacebook, FaTwitter, FaGlobe, FaHeart,
  FaRegHeart, FaStore, FaCalendarAlt, FaThumbsUp, FaThumbsDown,
  FaReply, FaFlag, FaCamera, FaImages, FaShare
} from 'react-icons/fa';
import './BusinessProfile.css';

const BusinessProfile = ({ 
  business, 
  isVisible, 
  onClose, 
  onAddToCart,
  currentUserId 
}) => {
  const [activeTab, setActiveTab] = useState('about');
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: '',
    photos: []
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [businessStats, setBusinessStats] = useState({
    totalPackages: 0,
    totalSaved: 0,
    averageRating: 4.8,
    reviewCount: 0
  });
  const [businessInfo, setBusinessInfo] = useState(null);
  const [activePackages, setActivePackages] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);

  // Mock data - gerçek API'lerle değiştirilecek
  useEffect(() => {
    if (business && isVisible) {
      loadBusinessProfile();
      loadBusinessReviews();
      loadActivePackages();
      checkIfFollowing();
    }
  }, [business, isVisible]);

  const loadBusinessProfile = async () => {
    // API çağrısı yapılacak
    try {
      // const response = await businessService.getBusinessProfile(business.sellerId);
      // Mock data
      setBusinessInfo({
        id: business.sellerId,
        businessName: business.storeName,
        category: business.category,
        description: "Kaliteli ve taze ürünlerle müşterilerimize hizmet veriyoruz. Gıda israfının önlenmesi konusunda duyarlı bir işletmeyiz.",
        address: "Kadıköy, İstanbul",
        phone: "+90 555 123 45 67",
        email: "info@" + business.storeName.toLowerCase().replace(/\s+/g, '') + ".com",
        website: "www." + business.storeName.toLowerCase().replace(/\s+/g, '') + ".com",
        socialMedia: {
          instagram: "@" + business.storeName.toLowerCase().replace(/\s+/g, ''),
          facebook: business.storeName,
          twitter: "@" + business.storeName.toLowerCase().replace(/\s+/g, '')
        },
        workingHours: {
          monday: "08:00 - 22:00",
          tuesday: "08:00 - 22:00",
          wednesday: "08:00 - 22:00",
          thursday: "08:00 - 22:00",
          friday: "08:00 - 23:00",
          saturday: "09:00 - 23:00",
          sunday: "09:00 - 21:00"
        },
        features: [
          "Halal Sertifikalı",
          "Organik Ürünler",
          "Ev Yapımı",
          "Vegan Seçenekleri"
        ],
        joinDate: "2023-06-15",
        totalSales: 245,
        satisfactionRate: 98
      });

      setBusinessStats({
        totalPackages: 156,
        totalSaved: 1240,
        averageRating: 4.8,
        reviewCount: 89
      });
    } catch (error) {
      console.error('İşletme profili yüklenirken hata:', error);
    }
  };

  const loadBusinessReviews = async () => {
    // API çağrısı yapılacak
    try {
      // const response = await reviewService.getBusinessReviews(business.sellerId);
      // Mock data
      setReviews([
        {
          id: 1,
          userId: 101,
          userName: "Ahmet K.",
          userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face",
          rating: 5,
          comment: "Harika bir deneyimdi! Paket içeriği beklentimin üzerindeydi. Kesinlikle tekrar sipariş vereceğim.",
          date: "2024-01-15",
          helpful: 12,
          photos: [
            "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=150&fit=crop"
          ],
          businessReply: {
            reply: "Teşekkür ederiz Ahmet Bey! Memnuniyetinizi duymak bizleri çok mutlu etti.",
            date: "2024-01-16"
          }
        },
        {
          id: 2,
          userId: 102,
          userName: "Elif M.",
          userAvatar: "https://images.unsplash.com/photo-1494790108755-2616b9beb6db?w=50&h=50&fit=crop&crop=face",
          rating: 4,
          comment: "Güzel bir inisiyatif. Çevre dostu olmak önemli. Sadece teslim saati biraz daha esnek olabilir.",
          date: "2024-01-10",
          helpful: 8,
          photos: []
        },
        {
          id: 3,
          userId: 103,
          userName: "Mehmet Y.",
          userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face",
          rating: 5,
          comment: "Fiyat performans açısından mükemmel. İçerik çok çeşitli ve lezzetliydi.",
          date: "2024-01-08",
          helpful: 15,
          photos: []
        }
      ]);
    } catch (error) {
      console.error('Yorumlar yüklenirken hata:', error);
    }
  };

  const loadActivePackages = async () => {
    // API çağrısı yapılacak - bu işletmenin aktif paketleri
    try {
      // Mock data
      setActivePackages([
        {
          id: business.id,
          ...business
        }
        // Diğer aktif paketler
      ]);
    } catch (error) {
      console.error('Aktif paketler yüklenirken hata:', error);
    }
  };

  const checkIfFollowing = async () => {
    // API çağrısı - kullanıcı bu işletmeyi takip ediyor mu?
    try {
      // const response = await followService.checkFollowing(business.sellerId);
      setIsFollowing(false); // Mock
    } catch (error) {
      console.error('Takip durumu kontrol edilirken hata:', error);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        // await followService.unfollowBusiness(business.sellerId);
        setIsFollowing(false);
      } else {
        // await followService.followBusiness(business.sellerId);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Takip işlemi hatası:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!newReview.comment.trim()) {
      alert('Lütfen yorum yazın');
      return;
    }

    setIsSubmittingReview(true);
    try {
      // const response = await reviewService.submitReview({
      //   businessId: business.sellerId,
      //   rating: newReview.rating,
      //   comment: newReview.comment,
      //   photos: newReview.photos
      // });

      // Mock success
      const mockNewReview = {
        id: Date.now(),
        userId: currentUserId,
        userName: "Ben",
        userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop&crop=face",
        rating: newReview.rating,
        comment: newReview.comment,
        date: new Date().toISOString().split('T')[0],
        helpful: 0,
        photos: newReview.photos
      };
      
      setReviews(prev => [mockNewReview, ...prev]);
      setNewReview({ rating: 5, comment: '', photos: [] });
      alert('Yorumunuz başarıyla gönderildi!');
    } catch (error) {
      console.error('Yorum gönderilirken hata:', error);
      alert('Yorum gönderilirken bir hata oluştu');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleHelpfulVote = async (reviewId, isHelpful) => {
    try {
      // API çağrısı
      console.log('Helpful vote:', { reviewId, isHelpful });
    } catch (error) {
      console.error('Yardımcı oy verme hatası:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating, interactive = false, onRatingChange = null) => {
    return (
      <div className="stars-container">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`star ${star <= rating ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
          />
        ))}
      </div>
    );
  };

  if (!isVisible || !business) return null;

  return (
    <div className="business-profile-overlay" onClick={onClose}>
      <div className="business-profile-container" onClick={(e) => e.stopPropagation()}>
        <div className="profile-header">
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
          
          <div className="business-header-info">
            <div className="business-logo">
              <img src={business.image} alt={business.storeName} />
            </div>
            
            <div className="business-basic-info">
              <h1 className="business-name">{business.storeName}</h1>
              <div className="business-category">
                <FaStore /> {business.category}
              </div>
              <div className="business-rating">
                {renderStars(businessStats.averageRating)}
                <span className="rating-text">
                  {businessStats.averageRating} ({businessStats.reviewCount} değerlendirme)
                </span>
              </div>
              <div className="business-stats">
                <div className="stat">
                  <span className="stat-number">{businessStats.totalPackages}</span>
                  <span className="stat-label">Toplam Paket</span>
                </div>
                <div className="stat">
                  <span className="stat-number">{businessStats.totalSaved}</span>
                  <span className="stat-label">Kurtarılan Yemek</span>
                </div>
                <div className="stat">
                  <span className="stat-number">%{businessInfo?.satisfactionRate || 98}</span>
                  <span className="stat-label">Memnuniyet</span>
                </div>
              </div>
            </div>
            
            <div className="business-actions">
              <button 
                className={`follow-button ${isFollowing ? 'following' : ''}`}
                onClick={handleFollow}
              >
                {isFollowing ? <FaHeart /> : <FaRegHeart />}
                {isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
              </button>
              <button className="share-button">
                <FaShare /> Paylaş
              </button>
            </div>
          </div>
        </div>

        <div className="profile-tabs">
          <button 
            className={`tab ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            Hakkında
          </button>
          <button 
            className={`tab ${activeTab === 'packages' ? 'active' : ''}`}
            onClick={() => setActiveTab('packages')}
          >
            Aktif Paketler ({activePackages.length})
          </button>
          <button 
            className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Yorumlar ({reviews.length})
          </button>
        </div>

        <div className="profile-content">
          {activeTab === 'about' && businessInfo && (
            <div className="about-tab">
              <div className="about-section">
                <h3>İşletme Hakkında</h3>
                <p>{businessInfo.description}</p>
              </div>

              <div className="contact-section">
                <h3>İletişim Bilgileri</h3>
                <div className="contact-info">
                  <div className="contact-item">
                    <FaMapMarkerAlt />
                    <span>{businessInfo.address}</span>
                  </div>
                  <div className="contact-item">
                    <FaPhone />
                    <span>{businessInfo.phone}</span>
                  </div>
                  <div className="contact-item">
                    <FaGlobe />
                    <span>{businessInfo.website}</span>
                  </div>
                </div>
              </div>

              <div className="working-hours-section">
                <h3>Çalışma Saatleri</h3>
                <div className="working-hours">
                  {Object.entries(businessInfo.workingHours).map(([day, hours]) => (
                    <div key={day} className="hours-row">
                      <span className="day">
                        {day === 'monday' && 'Pazartesi'}
                        {day === 'tuesday' && 'Salı'}
                        {day === 'wednesday' && 'Çarşamba'}
                        {day === 'thursday' && 'Perşembe'}
                        {day === 'friday' && 'Cuma'}
                        {day === 'saturday' && 'Cumartesi'}
                        {day === 'sunday' && 'Pazar'}
                      </span>
                      <span className="hours">{hours}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="features-section">
                <h3>Özellikler</h3>
                <div className="features-list">
                  {businessInfo.features.map((feature, index) => (
                    <span key={index} className="feature-tag">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <div className="social-media-section">
                <h3>Sosyal Medya</h3>
                <div className="social-links">
                  <a href="#" className="social-link instagram">
                    <FaInstagram /> {businessInfo.socialMedia.instagram}
                  </a>
                  <a href="#" className="social-link facebook">
                    <FaFacebook /> {businessInfo.socialMedia.facebook}
                  </a>
                  <a href="#" className="social-link twitter">
                    <FaTwitter /> {businessInfo.socialMedia.twitter}
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'packages' && (
            <div className="packages-tab">
              <div className="packages-grid">
                {activePackages.map((pkg) => (
                  <div key={pkg.id} className="package-card">
                    <img src={pkg.image} alt={pkg.product} />
                    <div className="package-info">
                      <h4>{pkg.product}</h4>
                      <div className="package-price">
                        <span className="old-price">₺{pkg.oldPrice}</span>
                        <span className="new-price">₺{pkg.newPrice}</span>
                      </div>
                      <div className="package-time">
                        <FaClock /> {pkg.time}
                      </div>
                      <button 
                        className="package-buy-button"
                        onClick={() => onAddToCart(pkg)}
                      >
                        🛒 Kurtar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="reviews-tab">
              <div className="review-form">
                <h3>Değerlendirme Yap</h3>
                <div className="rating-input">
                  <span>Puanınız:</span>
                  {renderStars(newReview.rating, true, (rating) => 
                    setNewReview(prev => ({ ...prev, rating }))
                  )}
                </div>
                <textarea
                  placeholder="Deneyiminizi paylaşın..."
                  value={newReview.comment}
                  onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                  rows={4}
                />
                <button 
                  className="submit-review-button"
                  onClick={handleSubmitReview}
                  disabled={isSubmittingReview}
                >
                  {isSubmittingReview ? 'Gönderiliyor...' : 'Yorum Gönder'}
                </button>
              </div>

              <div className="reviews-list">
                {reviews.map((review) => (
                  <div key={review.id} className="review-item">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <img 
                          src={review.userAvatar} 
                          alt={review.userName}
                          className="reviewer-avatar"
                        />
                        <div>
                          <div className="reviewer-name">{review.userName}</div>
                          <div className="review-date">{formatDate(review.date)}</div>
                        </div>
                      </div>
                      <div className="review-rating">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    
                    <div className="review-content">
                      <p>{review.comment}</p>
                      {review.photos && review.photos.length > 0 && (
                        <div className="review-photos">
                          {review.photos.map((photo, index) => (
                            <img key={index} src={photo} alt="Review" />
                          ))}
                        </div>
                      )}
                    </div>

                    {review.businessReply && (
                      <div className="business-reply">
                        <div className="reply-header">
                          <FaStore />
                          <span>İşletme Yanıtı</span>
                          <span className="reply-date">{formatDate(review.businessReply.date)}</span>
                        </div>
                        <p>{review.businessReply.reply}</p>
                      </div>
                    )}

                    <div className="review-actions">
                      <button 
                        className="helpful-button"
                        onClick={() => handleHelpfulVote(review.id, true)}
                      >
                        <FaThumbsUp /> Yararlı ({review.helpful})
                      </button>
                      <button className="flag-button">
                        <FaFlag /> Bildir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessProfile;