import React, { useState } from 'react';
import { 
  FaChartBar, FaMoneyBillWave, FaLeaf, FaUsers, 
  FaArrowUp, FaArrowDown, FaCalendarAlt, FaDownload,
  FaBox, FaCheckCircle, FaTimesCircle, FaStar
} from 'react-icons/fa';
import './Statistics.css'
const StatisticsDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');

  const StatCard = ({ icon, title, value, subValue, trend, color = 'blue' }) => (
    <div style={{
      background: 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: `3px solid ${color === 'blue' ? '#3b82f6' : color === 'green' ? '#10b981' : color === 'emerald' ? '#059669' : '#8b5cf6'}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '24px', color: color === 'blue' ? '#3b82f6' : color === 'green' ? '#10b981' : color === 'emerald' ? '#059669' : '#8b5cf6' }}>
          {icon}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {trend > 0 ? <FaArrowUp style={{ color: '#10b981' }} /> : <FaArrowDown style={{ color: '#ef4444' }} />}
          <span style={{ color: trend > 0 ? '#10b981' : '#ef4444', fontSize: '14px' }}>
            {Math.abs(trend)}%
          </span>
        </div>
      </div>
      <div>
        <h3 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 5px 0' }}>{value}</h3>
        <p style={{ color: '#6b7280', margin: '0 0 5px 0' }}>{title}</p>
        {subValue && <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0' }}>{subValue}</p>}
      </div>
    </div>
  );

  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 10px 0' }}>
          Detaylı İstatistiklerim
        </h1>
        <p style={{ color: '#6b7280', margin: '0 0 20px 0' }}>
          Performansınızı analiz edin ve gelişim alanlarını keşfedin
        </p>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaCalendarAlt style={{ color: '#6b7280' }} />
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              backgroundColor: 'white'
            }}
          >
            <option value="7days">Son 7 gün</option>
            <option value="30days">Son 30 gün</option>
            <option value="3months">Son 3 ay</option>
            <option value="1year">Son 1 yıl</option>
            <option value="all">Tüm zamanlar</option>
          </select>
          <button style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}>
            <FaDownload />
            Rapor İndir
          </button>
        </div>
      </div>

      {/* Ana Metrik Kartları */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <StatCard
          icon={<FaBox />}
          title="Toplam Paket"
          value="142"
          subValue="Bu ay +18"
          trend={12}
          color="blue"
        />
        <StatCard
          icon={<FaMoneyBillWave />}
          title="Toplam Kazanç"
          value="₺3,240"
          subValue="Ortalama ₺23/paket"
          trend={8}
          color="green"
        />
        <StatCard
          icon={<FaLeaf />}
          title="CO₂ Azaltıldı"
          value="426 kg"
          subValue="18 ağaç eşdeğeri"
          trend={15}
          color="emerald"
        />
        <StatCard
          icon={<FaUsers />}
          title="Müşteri Sayısı"
          value="89"
          subValue="4.8★ ortalama puan"
          trend={5}
          color="purple"
        />
      </div>

      {/* Detaylı İstatistik Kartları */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px' 
      }}>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: '#dcfce7'
          }}>
            <FaCheckCircle style={{ color: '#16a34a', fontSize: '24px' }} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 5px 0', color: '#1f2937' }}>Teslim Oranı</h4>
            <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 2px 0' }}>94.2%</p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '0' }}>134/142 paket başarıyla teslim edildi</p>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: '#fef3c7'
          }}>
            <FaTimesCircle style={{ color: '#d97706', fontSize: '24px' }} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 5px 0', color: '#1f2937' }}>İptal Oranı</h4>
            <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 2px 0' }}>5.8%</p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '0' }}>8 paket iptal edildi</p>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: '#dbeafe'
          }}>
            <FaStar style={{ color: '#2563eb', fontSize: '24px' }} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 5px 0', color: '#1f2937' }}>Müşteri Memnuniyeti</h4>
            <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 2px 0' }}>4.8/5.0</p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '0' }}>127 değerlendirme</p>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: '#f3e8ff'
          }}>
            <FaUsers style={{ color: '#7c3aed', fontSize: '24px' }} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 5px 0', color: '#1f2937' }}>Sadık Müşteri</h4>
            <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 2px 0' }}>72%</p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '0' }}>Tekrar alım yapan müşteriler</p>
          </div>
        </div>
      </div>

      {/* Grafik Alanı Placeholder */}
      <div style={{
        marginTop: '30px',
        background: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <FaChartBar style={{ fontSize: '48px', color: '#6b7280', marginBottom: '15px' }} />
        <h3 style={{ color: '#1f2937', margin: '0 0 10px 0' }}>Grafik Alanı</h3>
        <p style={{ color: '#6b7280', margin: '0' }}>
          Recharts uyumluluk sorunu nedeniyle geçici olarak devre dışı. 
          Alternatif grafik kütüphanesi entegre edilecek.
        </p>
      </div>
    </div>
  );
  
};

export default StatisticsDashboard;