import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import AddIngredientModal from '../components/AddIngredientModal';
import IngredientDetailModal from '../components/IngredientDetailModal';
import { Plus, Box, Droplet, Snowflake, Heart } from 'lucide-react';

const DUMMY_INGREDIENTS = [
  { id: 1, name: '돼지고기 삼겹살', category: '육류', storageLocation: '냉장', expDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), isFavorite: true, purchaseDate: new Date().toISOString().split('T')[0], memo: '구이용 삼겹살' },
  { id: 2, name: '깐마늘', category: '채소', storageLocation: '냉동', expDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), isFavorite: false, purchaseDate: new Date().toISOString().split('T')[0], memo: '요리용 다진마늘' },
  { id: 3, name: '상추', category: '채소', storageLocation: '냉장', expDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), isFavorite: false, purchaseDate: new Date().toISOString().split('T')[0], memo: '쌈용 상추' },
  { id: 4, name: '햇반', category: '기타', storageLocation: '실온', expDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), isFavorite: true, purchaseDate: new Date().toISOString().split('T')[0], memo: '비상용 밥' },
  { id: 5, name: '우유', category: '유제품', storageLocation: '냉장', expDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), isFavorite: false, purchaseDate: new Date().toISOString().split('T')[0], memo: '매일 아침 마심' },
];

const Ingredients = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  
  const [ingredients, setIngredients] = useState([]); 
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'expiring', '냉장', '냉동', '실온', '기타', 'favorite'

  const loadData = () => {
    const stored = localStorage.getItem('ingredients');
    if (!stored) {
      localStorage.setItem('ingredients', JSON.stringify([]));
      setIngredients([]);
    } else {
      setIngredients(JSON.parse(stored));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getFilteredIngredients = () => {
    if (activeFilter === 'all') return ingredients;
    
    if (activeFilter === 'expiring') {
      const today = new Date();
      today.setHours(0,0,0,0);
      return ingredients.filter(item => {
        const exp = new Date(item.expDate);
        exp.setHours(0,0,0,0);
        const diffTime = exp - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 3; // 3일 이하 (경과된 상품 포함하여 경고)
      });
    }

    if (activeFilter === 'favorite') {
      return ingredients.filter(item => item.isFavorite);
    }

    return ingredients.filter(item => item.storageLocation === activeFilter);
  };

  const toggleFavorite = (id, e) => {
    e.stopPropagation(); // Card 클릭 모달 방지
    const updated = ingredients.map(item => {
      if (item.id === id) {
        return { ...item, isFavorite: !item.isFavorite };
      }
      return item;
    });
    setIngredients(updated);
    localStorage.setItem('ingredients', JSON.stringify(updated));
  };

  const handleCardClick = (item) => {
    setSelectedIngredient(item);
    setIsDetailOpen(true);
  };

  // Helper for Dynamic Icons
  const getFoodIcon = (name, category) => {
    const n = name.toLowerCase();
    if (n.includes('삼겹살') || n.includes('고기') || n.includes('목살') || n.includes('소고기') || n.includes('닭고기')) return '🥩';
    if (n.includes('마늘') || n.includes('양파') || n.includes('파') || n.includes('감자') || n.includes('당근')) return '🧄';
    if (n.includes('상추') || n.includes('배추') || n.includes('깻잎') || n.includes('샐러드') || n.includes('야채')) return '🥬';
    if (n.includes('햇반') || n.includes('밥') || n.includes('쌀')) return '🍚';
    if (n.includes('우유') || n.includes('요거트') || n.includes('치즈')) return '🥛';
    if (n.includes('계란') || n.includes('달걀') || n.includes('알')) return '🥚';
    if (n.includes('사과') || n.includes('바나나') || n.includes('과일')) return '🍎';
    if (n.includes('만두') || n.includes('피자') || n.includes('튀김')) return '🥟';
    
    // Category Fallbacks
    if (category === '육류') return '🥩';
    if (category === '채소') return '🥦';
    if (category === '유제품') return '🥛';
    if (category === '냉동식품') return '❄️';
    if (category === '소스/양념') return '🧂';
    return '📦';
  };

  // Remaining Expiration Bar (6 Segments)
  const renderProgressBar = (expDate) => {
    const diffDays = Math.ceil((new Date(expDate) - new Date()) / (1000 * 60 * 60 * 24));
    let filled = 1;
    let color = '#48bb78'; // Green
    
    if (diffDays > 7) {
      filled = 6;
      color = '#48bb78'; // Green
    } else if (diffDays >= 4 && diffDays <= 7) {
      filled = 4;
      color = '#ecc94b'; // Yellow
    } else if (diffDays === 3) {
      filled = 2;
      color = '#dd6b20'; // Orange
    } else {
      filled = 1;
      color = '#e53e3e'; // Red
    }
    
    return (
      <div style={{ display: 'flex', gap: '3px', marginTop: '6px' }}>
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            style={{ 
              width: '12px', 
              height: '6px', 
              borderRadius: '2px', 
              backgroundColor: i < filled ? color : '#e2e8f0' 
            }} 
          />
        ))}
      </div>
    );
  };

  const filteredData = getFilteredIngredients();

  return (
    <div className="page-container">
      <Header title="내 식재료 관리" />
      <div className="content" style={{ paddingBottom: '80px', paddingTop: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
            보유 식재료 총 {ingredients.length}개
          </span>
          <button 
            style={{ 
              background: 'none', border: 'none', color: 'var(--primary-color)', 
              display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' 
            }} 
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={16} /> 식재료 추가
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '12px', marginBottom: '12px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap', width: 'auto', background: activeFilter === 'all' ? 'var(--primary-color)' : '#fff', color: activeFilter === 'all' ? '#fff' : 'var(--text-black)', border: activeFilter === 'all' ? 'none' : '1px solid var(--gray-200)' }} onClick={() => setActiveFilter('all')}>전체</button>
          <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap', width: 'auto', background: activeFilter === 'expiring' ? 'var(--primary-color)' : '#fff', color: activeFilter === 'expiring' ? '#fff' : 'var(--text-black)', border: activeFilter === 'expiring' ? 'none' : '1px solid var(--gray-200)' }} onClick={() => setActiveFilter('expiring')}>유통기한 임박</button>
          <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap', width: 'auto', background: activeFilter === '냉장' ? 'var(--primary-color)' : '#fff', color: activeFilter === '냉장' ? '#fff' : 'var(--text-black)', border: activeFilter === '냉장' ? 'none' : '1px solid var(--gray-200)' }} onClick={() => setActiveFilter('냉장')}>냉장</button>
          <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap', width: 'auto', background: activeFilter === '냉동' ? 'var(--primary-color)' : '#fff', color: activeFilter === '냉동' ? '#fff' : 'var(--text-black)', border: activeFilter === '냉동' ? 'none' : '1px solid var(--gray-200)' }} onClick={() => setActiveFilter('냉동')}>냉동</button>
          <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap', width: 'auto', background: activeFilter === '실온' ? 'var(--primary-color)' : '#fff', color: activeFilter === '실온' ? '#fff' : 'var(--text-black)', border: activeFilter === '실온' ? 'none' : '1px solid var(--gray-200)' }} onClick={() => setActiveFilter('실온')}>실온</button>
          <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap', width: 'auto', background: activeFilter === '기타' ? 'var(--primary-color)' : '#fff', color: activeFilter === '기타' ? '#fff' : 'var(--text-black)', border: activeFilter === '기타' ? 'none' : '1px solid var(--gray-200)' }} onClick={() => setActiveFilter('기타')}>기타</button>
          <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap', width: 'auto', background: activeFilter === 'favorite' ? 'var(--primary-color)' : '#fff', color: activeFilter === 'favorite' ? '#fff' : 'var(--text-black)', border: activeFilter === 'favorite' ? 'none' : '1px solid var(--gray-200)' }} onClick={() => setActiveFilter('favorite')}>찜 목록</button>
        </div>
        
        {filteredData.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '200px', border: '2px dashed var(--gray-300)', borderRadius: '12px',
            backgroundColor: '#fafafa', marginTop: '40px'
          }}>
            <div style={{ color: 'var(--gray-400)', marginBottom: '16px' }}>
              <Plus size={32} />
            </div>
            <button 
              className="btn-primary" 
              style={{ width: 'auto', padding: '10px 24px' }}
              onClick={() => setIsModalOpen(true)}
            >
              식재료 추가하기
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredData.map(item => {
              const diffDays = Math.ceil((new Date(item.expDate) - new Date()) / (1000 * 60 * 60 * 24));
              const isExpired = diffDays < 0;

              return (
                <div 
                  key={item.id} 
                  onClick={() => handleCardClick(item)}
                  style={{ 
                    padding: '16px', 
                    background: isExpired ? '#fff5f5' : '#fff', 
                    border: isExpired ? '1px solid #feb2b2' : '1px solid var(--gray-200)', 
                    borderRadius: '12px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Dynamic Food Emoji Icon */}
                    <div style={{ fontSize: '28px', background: '#f3f4f6', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {getFoodIcon(item.name, item.category)}
                    </div>
                    
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 'bold', color: isExpired ? '#c53030' : 'var(--text-black)' }}>{item.name}</span>
                        <span style={{ fontSize: '10px', background: isExpired ? '#fed7d7' : '#e0f2ec', color: isExpired ? '#9b2c2c' : 'var(--primary-color)', padding: '2px 6px', borderRadius: '4px' }}>
                          {item.storageLocation}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: '11px', color: isExpired ? '#e53e3e' : 'var(--gray-500)' }}>
                        유통기한: {item.expDate.split('T')[0]} 
                        {isExpired ? (
                          <span style={{ color: '#e53e3e', fontWeight: 'bold', marginLeft: '4px' }}>(만료됨)</span>
                        ) : (
                          diffDays <= 3 && <span style={{ color: 'red', marginLeft: '4px', fontWeight: 'bold' }}>({diffDays}일 남음)</span>
                        )}
                      </div>
                      
                      {/* Expiration Bar */}
                      {renderProgressBar(item.expDate)}
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => toggleFavorite(item.id, e)}
                    style={{ background: 'none', border: 'none', color: item.isFavorite ? 'red' : 'var(--gray-300)', padding: '8px', cursor: 'pointer' }}
                  >
                    <Heart size={20} fill={item.isFavorite ? "red" : "none"} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Add Modal */}
      <AddIngredientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={loadData}
      />

      {/* Detail / Edit / Delete Modal */}
      <IngredientDetailModal 
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedIngredient(null); }}
        ingredient={selectedIngredient}
        onReload={loadData}
      />
      
      <BottomNav />
    </div>
  );
};

export default Ingredients;
