import React, { useState } from 'react';
import { X, Calendar, MapPin, Tag, FileText, Trash2, Edit } from 'lucide-react';
import { getHouseholdData, setHouseholdData } from '../utils/household';

const CATEGORIES = ['채소', '과일', '육류', '수산물', '유제품', '달걀류', '해조류', '곡류', '가공식품', '빵·제과', '음료', '조미료', '발효식품', '소스류', '향신료', '냉동식품', '기타'];

const IngredientDetailModal = ({ isOpen, onClose, ingredient, onReload }) => {
  if (!isOpen || !ingredient) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(ingredient.name);
  const [category, setCategory] = useState(ingredient.category);
  const [purchaseDate, setPurchaseDate] = useState(ingredient.purchaseDate || new Date().toISOString().split('T')[0]);
  const [expDate, setExpDate] = useState(ingredient.expDate ? ingredient.expDate.split('T')[0] : '');
  const [storageLocation, setStorageLocation] = useState(ingredient.storageLocation);
  const [memo, setMemo] = useState(ingredient.memo || '');
  const [quantity, setQuantity] = useState(ingredient.quantity || '1개');

  // Helper for Category Colors/Icons
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
    if (category === '채소') return '🥬';
    if (category === '과일') return '🍎';
    if (category === '육류') return '🥩';
    if (category === '수산물') return '🐟';
    if (category === '유제품') return '🥛';
    if (category === '달걀류') return '🥚';
    if (category === '해조류') return '🌿';
    if (category === '곡류') return '🌾';
    if (category === '가공식품') return '🥫';
    if (category === '빵·제과') return '🍞';
    if (category === '음료') return '🥤';
    if (category === '조미료') return '🧂';
    if (category === '발효식품') return '🍯';
    if (category === '소스류') return '🥫';
    if (category === '향신료') return '🌶️';
    if (category === '냉동식품') return '❄️';
    return '📦';
  };

  const handleUpdate = () => {
    if (!name.trim()) {
      alert('이름을 입력해 주세요.');
      return;
    }
    const list = getHouseholdData('ingredients', []);

    const index = list.findIndex(item => item.id === ingredient.id);
    if (index !== -1) {
      list[index] = {
        ...list[index],
        name,
        category,
        purchaseDate,
        expDate: expDate ? new Date(expDate).toISOString() : '',
        storageLocation,
        memo,
        quantity
      };
      setHouseholdData('ingredients', list);
      alert('수정되었습니다!');
      setIsEditing(false);
      onReload();
      onClose();
    }
  };

  const handleDelete = () => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      const list = getHouseholdData('ingredients', []);

      const filtered = list.filter(item => item.id !== ingredient.id);
      setHouseholdData('ingredients', filtered);
      alert('삭제되었습니다!');
      onReload();
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1001,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={onClose}
      />
      
      {/* Modal Bottom Sheet */}
      <div 
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          backgroundColor: '#fff', zIndex: 1002,
          borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
          padding: '24px 20px',
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'slideUp 0.3s ease-out',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {isEditing ? '식재료 정보 수정' : '식재료 상세 정보'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={24} color="var(--gray-400)" />
          </button>
        </div>

        {isEditing ? (
          // --- EDIT VIEW ---
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px' }}>식재료 이름</label>
              <input 
                type="text" 
                className="input-field" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px' }}>카테고리</label>
              <select 
                className="input-field" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                style={{ paddingRight: '12px' }}
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px' }}>구매일</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={purchaseDate} 
                  onChange={(e) => setPurchaseDate(e.target.value)} 
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px' }}>유통기한</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={expDate} 
                  onChange={(e) => setExpDate(e.target.value)} 
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px' }}>보관 위치</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['실온', '냉장', '냉동'].map(loc => {
                  const isSelected = storageLocation === loc;
                  return (
                    <button 
                      key={loc}
                      className="btn-primary"
                      style={{
                        flex: 1,
                        background: isSelected ? 'var(--primary-color)' : '#fff',
                        color: isSelected ? '#fff' : 'var(--gray-600)',
                        border: isSelected ? 'none' : '1px solid var(--gray-200)'
                      }}
                      onClick={() => setStorageLocation(loc)}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px' }}>수량</label>
              <input 
                type="text" 
                className="input-field" 
                value={quantity} 
                onChange={(e) => setQuantity(e.target.value)} 
                placeholder="예: 2개, 500g 등"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px' }}>메모</label>
              <input 
                type="text" 
                className="input-field" 
                value={memo} 
                onChange={(e) => setMemo(e.target.value)} 
                placeholder="보관 방법 등 입력"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button 
                className="btn-primary" 
                style={{ flex: 1, background: '#f3f4f6', color: 'var(--gray-600)', border: 'none' }}
                onClick={() => setIsEditing(false)}
              >
                취소
              </button>
              <button 
                className="btn-primary" 
                style={{ flex: 2 }}
                onClick={handleUpdate}
              >
                저장하기
              </button>
            </div>
          </div>
        ) : (
          // --- DETAIL VIEW ---
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', background: '#f9fafb', padding: '16px', borderRadius: '16px', border: '1px solid var(--gray-100)' }}>
              <div style={{ fontSize: '40px', background: '#fff', width: '70px', height: '70px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                {getFoodIcon(ingredient.name, ingredient.category)}
              </div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>{ingredient.name}</h3>
                <span style={{ fontSize: '12px', background: '#e0f2ec', color: 'var(--primary-color)', padding: '3px 8px', borderRadius: '6px', fontWeight: '500' }}>
                  {ingredient.category}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Calendar size={18} color="var(--gray-400)" />
                <span style={{ color: 'var(--gray-500)', width: '70px', fontSize: '14px' }}>구매일</span>
                <span style={{ fontWeight: '500', fontSize: '14px' }}>{purchaseDate}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Calendar size={18} color="var(--gray-400)" />
                <span style={{ color: 'var(--gray-500)', width: '70px', fontSize: '14px' }}>유통기한</span>
                <span style={{ fontWeight: '500', fontSize: '14px', color: 'red' }}>{expDate || '미지정'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MapPin size={18} color="var(--gray-400)" />
                <span style={{ color: 'var(--gray-500)', width: '70px', fontSize: '14px' }}>보관위치</span>
                <span style={{ fontWeight: '500', fontSize: '14px' }}>{storageLocation}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Tag size={18} color="var(--gray-400)" />
                <span style={{ color: 'var(--gray-500)', width: '70px', fontSize: '14px' }}>수량</span>
                <span style={{ fontWeight: '500', fontSize: '14px' }}>{ingredient.quantity || '1개'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <FileText size={18} color="var(--gray-400)" style={{ marginTop: '2px' }} />
                <span style={{ color: 'var(--gray-500)', width: '70px', fontSize: '14px' }}>메모</span>
                <span style={{ fontWeight: '500', fontSize: '14px', flex: 1 }}>{memo || '메모가 없습니다.'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {/* 수정 버튼: 배경 #ecf2f0, 글자 색깔 #379271 */}
              <button 
                className="btn-primary" 
                style={{ 
                  flex: 1, 
                  background: '#ecf2f0', 
                  color: '#379271', 
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                onClick={() => setIsEditing(true)}
              >
                <Edit size={16} /> 수정
              </button>
              
              {/* 삭제 버튼: 배경 #cc0000, 글자 색깔 #FFFFFF */}
              <button 
                className="btn-primary" 
                style={{ 
                  flex: 1, 
                  background: '#cc0000', 
                  color: '#FFFFFF', 
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                onClick={handleDelete}
              >
                <Trash2 size={16} /> 삭제
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default IngredientDetailModal;
