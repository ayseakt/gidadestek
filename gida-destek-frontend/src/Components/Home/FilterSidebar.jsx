import React, { useState, memo } from 'react';
import { FaChevronDown, FaChevronUp, FaFilter, FaUtensils, FaSortAmountDown } from 'react-icons/fa';
import './FilterSidebar.css';

// React Memo kullanarak gereksiz yeniden render'ları önlüyoruz
const FilterSidebar = memo(({ onFilterChange, onSortChange }) => {
  // Filtre/sıralama seçimleri için state'ler
  const [sortOption, setSortOption] = useState('recommended');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Kategoriler listesi - SofraPay uygulaması için yiyecek kategorileri
  const categories = [
'Tümü', 'Restoran', 'Fırın & Pastane', 'Market', 'Kafe', 'Manav', 'Diğer'
  ];

  // Kategori tıklama event handler'ı
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    // Filtrelemeyi uygula ve filtre panelini kapat
    onFilterChange && onFilterChange(category);
  };

  // Sıralama seçeneği değişikliği handler'ı
  const handleSortOptionChange = (option) => {
    setSortOption(option);
    // Sıralamayı uygula
    onSortChange && onSortChange(option);
  };

  // Filtre görünürlüğünü değiştir
  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  // Aktif filtre sayısını hesapla
  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    return count;
  };

  return (
    <div className="filter-sidebar hover-lift">
      {/* Filtre başlığı */}
      <div 
        className="filter-header"
        onClick={toggleFilter}
      >
        <h2>
          <FaFilter className="filter-icon" /> 
          Filtrele ve Sırala
          {getActiveFilterCount() > 0 && <span className="filter-badge">{getActiveFilterCount()}</span>}
        </h2>
        <div className={`filter-header-icon ${isFilterOpen ? 'open' : ''}`}>
          {isFilterOpen ? <FaChevronUp /> : <FaChevronDown />}
        </div>
      </div>
      
      {/* Filtreleme içeriği - açılır/kapanır */}
      {isFilterOpen && (
        <div className="filter-content animate-fadeIn">
          {/* Sıralama seçenekleri */}
          <div className="filter-section">
            <h3 className="filter-section-title">
              <FaSortAmountDown className="section-icon" /> Sırala
            </h3>
             <div className="sort-options-grid">
              {[
                { id: 'recommended', label: 'Önerilen' },
                { id: 'alphabetical', label: 'Alfabetik' },
                { id: 'rating', label: 'Puana Göre' },
                { id: 'distance', label: 'Yakınlığa Göre' },
                { id: 'reviewCount', label: 'Değerlendirme Sayısına Göre' }
              ].map(option => (
                <label
                  key={option.id}
                  className={`option-item ${sortOption === option.id ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="sort"
                    checked={sortOption === option.id}
                    onChange={() => handleSortOptionChange(option.id)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Mutfak kategorileri */}
          <div className="filter-section">
            <h3 className="filter-section-title">
              <FaUtensils className="section-icon" /> Mutfaklar
            </h3>
            <div className="categories-container">
              <label className={`category-item ${selectedCategory === 'all' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="category"
                  checked={selectedCategory === 'all'}
                  onChange={() => handleCategoryClick('all')}
                />
                <span>Tümü</span>
              </label>
              
              {categories.map((category, index) => (
                <label 
                  key={index} 
                  className={`category-item ${selectedCategory === category ? 'selected' : ''}`}
                >
                  <input 
                    type="radio"
                    name="category"
                    checked={selectedCategory === category}
                    onChange={() => handleCategoryClick(category)}
                  />
                  <span>{category}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Seçili filtreler gösterimi - Panel kapalıyken */}
      {!isFilterOpen && getActiveFilterCount() > 0 && (
        <div className="selected-filters">
          <span className="selected-filters-label">Seçili:</span>
          <div className="selected-filters-container">
            {selectedCategory !== 'all' && (
              <span className="selected-category-tag">
                {selectedCategory}
                <button 
                  className="remove-category-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCategoryClick('all');
                  }}
                >
                  &times;
                </button>
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Tümünü Gör butonu */}
      <div className="view-all-container">
        <button className="view-all-btn">
          Tümünü Gör
        </button>
      </div>
    </div>
  );
});

export default FilterSidebar;