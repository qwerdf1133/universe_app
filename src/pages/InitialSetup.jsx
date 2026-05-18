import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const InitialSetup = () => {
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState([]);
  
  const items = ['간장', '고추장', '된장', '설탕', '소금', '식초', '참기름', '식용유', '후추'];
  
  const toggleItem = (item) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter(i => i !== item));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleComplete = () => {
    const stored = localStorage.getItem('ingredients');
    const existing = stored ? JSON.parse(stored) : [];
    
    const today = new Date();
    const oneYearLater = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString();
    
    const newIngredients = selectedItems.map((item, index) => ({
      id: Date.now() + index,
      name: item,
      category: '소스/양념',
      storageLocation: '실온',
      expDate: oneYearLater,
      isFavorite: false,
      purchaseDate: today.toISOString().split('T')[0],
      memo: '기본 양념 소스'
    }));
    
    localStorage.setItem('ingredients', JSON.stringify([...existing, ...newIngredients]));
    navigate('/home');
  };

  return (
    <div className="page-container" style={{ padding: '20px' }}>
      <div style={{ marginTop: '40px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', lineHeight: '1.4' }}>
          집에 기본적으로 있는<br />소스나 장 종류가 있나요?
        </h2>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '32px' }}>
        {items.map(item => {
          const isSelected = selectedItems.includes(item);
          return (
            <button 
              key={item}
              onClick={() => toggleItem(item)}
              style={{
                padding: '16px 0',
                borderRadius: '8px',
                border: isSelected ? '1px solid var(--primary-color)' : '1px solid var(--gray-300)',
                backgroundColor: isSelected ? 'var(--primary-color)' : '#FFFFFF',
                color: isSelected ? '#FFFFFF' : 'var(--text-black)',
                fontWeight: '500',
                fontSize: '15px',
                transition: 'all 0.2s',
                boxShadow: isSelected ? '0 4px 6px rgba(55, 146, 113, 0.2)' : 'none'
              }}
            >
              {item}
            </button>
          );
        })}
      </div>
      
      <div style={{ marginTop: 'auto' }}>
        <button className="btn-primary" onClick={handleComplete}>
          시작하기
        </button>
      </div>
    </div>
  );
};

export default InitialSetup;
