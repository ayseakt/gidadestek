import React, { useState, useEffect } from 'react';
import statisticsService from '../services/statisticsService';
import { 
  FaChartLine,
  FaUtensils, 
  FaMoneyBillWave, 
  FaLeaf, 
  FaPercent,
  FaClock 
} from 'react-icons/fa';
import './Statistics.css';

const StatisticsDashboard = () => {
  const [istatistikler, setIstatistikler] = useState(null);
  const [haftalikSatis, setHaftalikSatis] = useState([]);
  const [kategoriDagilimi, setKategoriDagilimi] = useState([]);
  const [aylikTrend, setAylikTrend] = useState([]);
  const [saatlikDagilim, setSaatlikDagilim] = useState([]);
  const [timeRange, setTimeRange] = useState('7gun');

  useEffect(() => {
    statisticsService.getGeneralStatistics().then(setIstatistikler);
    statisticsService.getWeeklySales().then(setHaftalikSatis);
    statisticsService.getCategoryDistribution().then(setKategoriDagilimi);
    statisticsService.getMonthlyTrend().then(setAylikTrend);
    statisticsService.getHourlyDistribution().then(setSaatlikDagilim);
  }, []);

  if (!istatistikler) return <div>Yükleniyor...</div>;

  const StatCard = ({ icon: Icon, title, value, subtitle, trend, color }) => (
    <div className="stat-card">
      <div className="stat-icon-wrapper" style={{ backgroundColor: `${color}20` }}>
        <Icon style={{ color: color }} className="stat-icon" />
      </div>
      <div className="stat-content">
        <h3 className="stat-value">{value}</h3>
        <p className="stat-title">{title}</p>
        {subtitle && <p className="stat-subtitle">{subtitle}</p>}
        {trend && (
          <div className="stat-trend">
            <FaChartLine className="trend-icon" />
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  );

  const DataTable = ({ title, data, columns }) => (
    <div className="data-table-container">
      <h3 className="table-title">{title}</h3>
      <div className="data-table">
        <div className="table-header">
          {columns.map((col, index) => (
            <div key={index} className="table-header-cell">{col.header}</div>
          ))}
        </div>
        <div className="table-body">
          {data.map((row, rowIndex) => (
            <div key={rowIndex} className="table-row">
              {columns.map((col, colIndex) => (
                <div key={colIndex} className="table-cell">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ProgressBar = ({ label, value, maxValue, color }) => (
    <div className="progress-item">
      <div className="progress-label">
        <span>{label}</span>
        <span className="progress-value">{value}</span>
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ 
            width: `${(value / maxValue) * 100}%`,
            backgroundColor: color
          }}
        ></div>
      </div>
    </div>
  );

  // Kategori renkleri için örnek dizi
  const kategoriRenkleri = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

  return (
    <div className="statistics-dashboard">
      <div className="dashboard-header">
        <div>
          <h2>İstatistikler</h2>
          <p className="dashboard-subtitle">İşletmenizin performans analizi</p>
        </div>
        <div className="time-selector">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-select"
          >
            <option value="7gun">Son 7 Gün</option>
            <option value="30gun">Son 30 Gün</option>
            <option value="3ay">Son 3 Ay</option>
            <option value="yil">Bu Yıl</option>
          </select>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard
          icon={FaUtensils}
          title="Toplam Paket"
          value={istatistikler.toplamPaket}
          subtitle="Bu ay"
          trend="+12%"
          color="#FF6B6B"
        />
        <StatCard
          icon={FaMoneyBillWave}
          title="Toplam Kazanç"
          value={`₺${istatistikler.kazanilanTutar?.toLocaleString()}`}
          subtitle="Bu ay"
          trend="+8%"
          color="#4ECDC4"
        />
        <StatCard
          icon={FaLeaf}
          title="CO₂ Azaltıldı"
          value={`${istatistikler.azaltilanCO2}kg`}
          subtitle="Çevre katkısı"
          trend="+15%"
          color="#96CEB4"
        />
        <StatCard
          icon={FaPercent}
          title="Başarı Oranı"
          value={`%${istatistikler.basariOrani || 0}`}
          subtitle="Satılan/Oluşturulan"
          trend="+3%"
          color="#45B7D1"
        />
      </div>

      {/* Data Tables */}
      <div className="charts-grid">
        
        {/* Haftalık Satış Tablosu */}
        <div className="chart-container">
          <DataTable
            title="Haftalık Satış Detayları"
            data={haftalikSatis}
            columns={[
              { key: 'gun', header: 'Gün' },
              { key: 'satis', header: 'Satış Adedi' },
              { 
                key: 'kazanc', 
                header: 'Kazanç', 
                render: (value) => `₺${value?.toLocaleString()}`
              }
            ]}
          />
        </div>

        {/* Kategori Dağılımı */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Kategori Dağılımı</h3>
            <p>Paket türleri oranı</p>
          </div>
          <div className="category-grid">
            {kategoriDagilimi.map((kategori, index) => (
              <div key={index} className="category-item">
                <div className="category-color" style={{ backgroundColor: kategoriRenkleri[index % kategoriRenkleri.length] }}></div>
                <div className="category-info">
                  <span className="category-name">{kategori.kategori}</span>
                  <span className="category-percentage">{kategori.paket_sayisi} paket</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Aylık Trend Tablosu */}
        <div className="chart-container full-width">
          <DataTable
            title="Aylık Performans Trendi"
            data={aylikTrend}
            columns={[
              { key: 'ay', header: 'Ay' },
              { key: 'paket', header: 'Paket Sayısı' },
              { 
                key: 'co2', 
                header: 'CO₂ (kg)',
                render: (value) => `${value}kg`
              },
              { 
                key: 'kazanc', 
                header: 'Kazanç',
                render: (value) => `₺${value?.toLocaleString()}`
              }
            ]}
          />
        </div>

        {/* Saatlik Dağılım */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Günlük Sipariş Dağılımı</h3>
            <p>Hangi saatlerde daha aktif?</p>
          </div>
          <div className="hourly-distribution">
            {saatlikDagilim.map((item, index) => (
              <ProgressBar
                key={index}
                label={item.saat}
                value={item.siparis}
                maxValue={35}
                color="#45B7D1"
              />
            ))}
          </div>
        </div>

        {/* Özet Metrikler */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Önemli Metrikler</h3>
            <p>Temel performans göstergeleri</p>
          </div>
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-icon">
                <FaMoneyBillWave style={{ color: '#4ECDC4' }} />
              </div>
              <div className="metric-info">
                <span className="metric-value">₺{istatistikler.ortalamaPaketFiyati}</span>
                <span className="metric-label">Ortalama Paket Fiyatı</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon">
                <FaUtensils style={{ color: '#FF6B6B' }} />
              </div>
              <div className="metric-info">
                <span className="metric-value">{istatistikler.toplamMusteri}</span>
                <span className="metric-label">Toplam Müşteri</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon">
                <FaChartLine style={{ color: '#96CEB4' }} />
              </div>
              <div className="metric-info">
                <span className="metric-value">{istatistikler.tekrarMusteri}</span>
                <span className="metric-label">Tekrar Eden Müşteri</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon">
                <FaClock style={{ color: '#45B7D1' }} />
              </div>
              <div className="metric-info">
                <span className="metric-value">18dk</span>
                <span className="metric-label">Ortalama Hazırlık</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsDashboard;