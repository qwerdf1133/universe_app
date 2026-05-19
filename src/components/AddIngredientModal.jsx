import React, { useState } from 'react';
import { X, Camera, Edit3, Beef, Carrot, Milk, Snowflake, Droplet, Box, Calendar, Sparkles } from 'lucide-react';

const CATEGORIES = [
  { id: 'auto', name: '자동 설정', icon: Sparkles, defaultExpDays: null },
  { id: 'meat', name: '육류', icon: Beef, defaultExpDays: 5 },
  { id: 'veg', name: '채소', icon: Carrot, defaultExpDays: 7 },
  { id: 'dairy', name: '유제품', icon: Milk, defaultExpDays: 14 },
  { id: 'frozen', name: '냉동식품', icon: Snowflake, defaultExpDays: 180 },
  { id: 'sauce', name: '소스/양념', icon: Droplet, defaultExpDays: 365 },
];

const getAutoExpiryDate = (name, pDateStr) => {
  const pDate = pDateStr ? new Date(pDateStr) : new Date();
  const n = name.trim().toLowerCase();
  let days = 30; // default generic fallback

  if (n.includes('우유') || n.includes('요거트') || n.includes('치즈') || n.includes('유제품')) {
    days = 3; // 우유 3일
  } else if (n.includes('계란') || n.includes('달걀') || n.includes('알')) {
    days = 7; // 계란 7일
  } else if (n.includes('생선') || n.includes('해산물') || n.includes('오징어') || n.includes('고등어') || n.includes('새우')) {
    days = 2; // 생선 2일
  } else if (n.includes('삼겹살') || n.includes('고기') || n.includes('목살') || n.includes('소고기') || n.includes('닭고기') || n.includes('육류')) {
    days = 3; // 고기 3일
  } else if (n.includes('통조림') || n.includes('캔') || n.includes('참치캔') || n.includes('스팸')) {
    days = 730; // 캔 2년
  } else if (n.includes('라면') || n.includes('면')) {
    days = 365; // 라면 1년
  } else if (n.includes('소스') || n.includes('간장') || n.includes('쌈장') || n.includes('양념') || n.includes('고추장') || n.includes('된장')) {
    days = 180; // 소스 6개월
  } else if (n.includes('상추') || n.includes('깻잎') || n.includes('시금치')) {
    days = 4;
  } else if (n.includes('마늘') || n.includes('양파') || n.includes('파') || n.includes('감자') || n.includes('당근') || n.includes('채소')) {
    days = 7;
  } else if (n.includes('만두') || n.includes('피자') || n.includes('튀김') || n.includes('냉동')) {
    days = 180;
  }

  pDate.setDate(pDate.getDate() + days);
  return pDate.toISOString().split('T')[0];
};

const AddIngredientModal = ({ isOpen, onClose, onSave }) => {
  const [step, setStep] = useState('select-method'); // 'select-method', 'manual', 'camera', 'camera-result'
  
  // Manual Entry State
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]); // '자동 설정' is default!
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expDate, setExpDate] = useState('');
  const [storageLocation, setStorageLocation] = useState('냉장'); // '실온', '냉장', '냉동'
  const [memo, setMemo] = useState('');

  // Camera Mock State
  const [isScanning, setIsScanning] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setStep('select-method');
    setName('');
    setCategory(CATEGORIES[0]);
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setExpDate('');
    setStorageLocation('냉장');
    setMemo('');
    onClose();
  };

  const handleCategorySelect = (cat) => {
    setCategory(cat);
    if (cat.id === 'auto') {
      setExpDate('');
    } else if (purchaseDate) {
      const pDate = new Date(purchaseDate);
      pDate.setDate(pDate.getDate() + cat.defaultExpDays);
      setExpDate(pDate.toISOString().split('T')[0]);
    }
  };

  const handlePurchaseDateChange = (e) => {
    const newDate = e.target.value;
    setPurchaseDate(newDate);
    if (category && category.id !== 'auto') {
      const pDate = new Date(newDate);
      pDate.setDate(pDate.getDate() + category.defaultExpDays);
      setExpDate(pDate.toISOString().split('T')[0]);
    } else {
      setExpDate('');
    }
  };

  const handleSave = () => {
    const stored = localStorage.getItem('ingredients');
    let list = stored ? JSON.parse(stored) : [];

    if (step === 'camera-result') {
      const items = [
        { id: Date.now() + 1, name: '돼지고기 삼겹살', category: '육류', purchaseDate: new Date().toISOString().split('T')[0], expDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), storageLocation: '냉장', memo: '영수증 인식', isFavorite: false },
        { id: Date.now() + 2, name: '양파', category: '채소', purchaseDate: new Date().toISOString().split('T')[0], expDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), storageLocation: '냉장', memo: '영수증 인식', isFavorite: false },
        { id: Date.now() + 3, name: '깐마늘', category: '채소', purchaseDate: new Date().toISOString().split('T')[0], expDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), storageLocation: '냉동', memo: '영수증 인식', isFavorite: false },
        { id: Date.now() + 4, name: '상추', category: '채소', purchaseDate: new Date().toISOString().split('T')[0], expDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), storageLocation: '냉장', memo: '영수증 인식', isFavorite: false },
      ];
      list = [...list, ...items];
    } else {
      if (!name.trim()) {
        alert('식재료 이름을 입력해 주세요.');
        return;
      }

      let finalExp = expDate;
      let finalCat = category ? category.name : '자동 설정';

      // Auto detection logic
      if (!category || category.id === 'auto') {
        // Detect category name
        const n = name.toLowerCase();
        if (n.includes('삼겹살') || n.includes('고기') || n.includes('목살') || n.includes('소고기') || n.includes('닭고기')) {
          finalCat = '육류';
        } else if (n.includes('마늘') || n.includes('양파') || n.includes('파') || n.includes('상추') || n.includes('깻잎')) {
          finalCat = '채소';
        } else if (n.includes('우유') || n.includes('요거트') || n.includes('치즈')) {
          finalCat = '유제품';
        } else if (n.includes('만두') || n.includes('피자') || n.includes('튀김') || n.includes('냉동')) {
          finalCat = '냉동식품';
        } else if (n.includes('소스') || n.includes('간장') || n.includes('쌈장') || n.includes('양념')) {
          finalCat = '소스/양념';
        } else {
          finalCat = '기타';
        }

        if (!finalExp) {
          finalExp = getAutoExpiryDate(name, purchaseDate);
        }
      }

      if (!finalExp) {
        finalExp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (finalExp.indexOf('T') === -1) {
        finalExp = new Date(finalExp).toISOString();
      }

      const newIngredient = {
        id: Date.now(),
        name,
        category: finalCat,
        purchaseDate,
        expDate: finalExp,
        storageLocation,
        memo,
        isFavorite: false
      };
      list.push(newIngredient);
    }

    localStorage.setItem('ingredients', JSON.stringify(list));
    alert('저장되었습니다!');
    if (onSave) onSave();
    handleClose();
  };

  const handleTakePhoto = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setStep('camera-result');
    }, 2000);
  };

  const renderContent = () => {
    if (step === 'select-method') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={() => setStep('manual')}
          >
            <Edit3 size={20} /> 직접 입력하기
          </button>
          <button 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#e0f2ec', color: 'var(--primary-color)' }}
            onClick={() => setStep('camera')}
          >
            <Camera size={20} /> 영수증 촬영하기
          </button>
        </div>
      );
    }

    if (step === 'manual') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '70vh', padding: '4px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>식재료 이름</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="예: 돼지고기 목살" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>카테고리</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isSelected = category?.id === cat.id;
                return (
                  <div 
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat)}
                    style={{ 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                      padding: '12px 8px', borderRadius: '8px', cursor: 'pointer',
                      border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--gray-200)',
                      background: isSelected ? '#e0f2ec' : '#fff'
                    }}
                  >
                    <Icon size={24} color={isSelected ? 'var(--primary-color)' : 'var(--gray-400)'} style={{ marginBottom: '4px' }} />
                    <span style={{ fontSize: '12px', color: isSelected ? 'var(--primary-color)' : 'var(--gray-600)', fontWeight: isSelected ? 'bold' : 'normal' }}>
                      {cat.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>구매일</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="date" 
                  className="input-field" 
                  value={purchaseDate}
                  onChange={handlePurchaseDateChange}
                />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>유통기한</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="date" 
                  className="input-field" 
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                />
              </div>
            </div>
          </div>
           {category && (
            <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '-12px' }}>
              {category.id === 'auto' 
                ? '* AI 추천: 식재료 이름(예: 삼겹살, 상추 등)을 분석하여 최적의 유통기한이 저장 시 자동 지정됩니다.'
                : `* AI 추천: ${category.name}의 일반적 유통기한 적용`}
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>보관 장소</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: '실온', icon: Box },
                { id: '냉장', icon: Droplet },
                { id: '냉동', icon: Snowflake }
              ].map(loc => {
                const isSelected = storageLocation === loc.id;
                const Icon = loc.icon;
                return (
                  <button 
                    key={loc.id}
                    className="btn-primary"
                    style={{ 
                      flex: 1, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      background: isSelected ? 'var(--primary-color)' : '#fff',
                      color: isSelected ? '#fff' : 'var(--gray-600)',
                      border: isSelected ? 'none' : '1px solid var(--gray-200)'
                    }}
                    onClick={() => setStorageLocation(loc.id)}
                  >
                    <Icon size={16} /> {loc.id}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>메모 (선택)</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="보관 방법 등" 
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>

          <button className="btn-primary" style={{ marginTop: '16px' }} onClick={handleSave}>
            저장
          </button>
        </div>
      );
    }

    if (step === 'camera') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <p style={{ color: 'var(--gray-400)', fontSize: '14px', textAlign: 'center' }}>영수증이 사각형 안에 들어오게 맞춰주세요</p>
          <div style={{ 
            width: '100%', height: '300px', backgroundColor: '#1e1e1e', borderRadius: '12px', 
            position: 'relative', overflow: 'hidden'
          }}>
            {/* Camera Viewport Mock */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ width: '80%', height: '80%', border: '2px dashed rgba(255,255,255,0.7)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '20px', height: '20px', borderTop: '4px solid #fff', borderLeft: '4px solid #fff' }} />
                <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '20px', height: '20px', borderTop: '4px solid #fff', borderRight: '4px solid #fff' }} />
                <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '20px', height: '20px', borderBottom: '4px solid #fff', borderLeft: '4px solid #fff' }} />
                <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderBottom: '4px solid #fff', borderRight: '4px solid #fff' }} />
              </div>
            </div>
            
            {isScanning && (
              <div style={{ 
                position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: 'var(--primary-color)',
                boxShadow: '0 0 10px var(--primary-color)',
                animation: 'scan 2s infinite linear'
              }} />
            )}
          </div>
          
          <button 
            className="btn-primary" 
            style={{ width: '80px', height: '80px', borderRadius: '50%', padding: 0, border: '4px solid #e0f2ec', background: 'var(--primary-color)' }}
            onClick={handleTakePhoto}
            disabled={isScanning}
          >
            <Camera color="#fff" size={32} style={{ margin: '0 auto' }} />
          </button>
        </div>
      );
    }

    if (step === 'camera-result') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>영수증 인식 결과</h3>
            <p style={{ color: 'var(--gray-400)', fontSize: '14px' }}>인식된 식재료들을 확인하고 저장하세요.</p>
          </div>
          
          <div style={{ background: '#f9fafb', borderRadius: '8px', border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--gray-200)', background: '#fff' }}>
              <span style={{ fontWeight: 'bold' }}>돼지고기 삼겹살</span>
              <span>600g</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--gray-200)', background: '#fff' }}>
              <span style={{ fontWeight: 'bold' }}>양파</span>
              <span>1망 (5개)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--gray-200)', background: '#fff' }}>
              <span style={{ fontWeight: 'bold' }}>깐마늘</span>
              <span>200g</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#fff' }}>
              <span style={{ fontWeight: 'bold' }}>상추</span>
              <span>1봉</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button className="btn-primary" style={{ flex: 1, background: '#e0f2ec', color: 'var(--primary-color)' }} onClick={() => setStep('camera')}>
              다시 촬영
            </button>
            <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave}>
              모두 저장 (4건)
            </button>
          </div>
        </div>
      );
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'select-method': return '식재료 추가';
      case 'manual': return '직접 입력';
      case 'camera': return '영수증 촬영';
      case 'camera-result': return '인식 완료';
      default: return '식재료 추가';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={handleClose}
      />
      
      {/* Modal / Bottom Sheet */}
      <div 
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          backgroundColor: '#fff', zIndex: 1000,
          borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
          padding: '24px 20px',
          maxHeight: '90vh',
          animation: 'slideUp 0.3s ease-out',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>{getTitle()}</h2>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={24} color="var(--gray-400)" />
          </button>
        </div>
        
        {renderContent()}
      </div>
    </>
  );
};

export default AddIngredientModal;
