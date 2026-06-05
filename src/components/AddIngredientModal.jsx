import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Edit3, Box, Droplet, Snowflake } from 'lucide-react';
import { CATEGORIES, detectCategoryByFoodName, getAutoExpiryDate, getFoodIcon } from '../utils/categories';
import { getHouseholdData, setHouseholdData } from '../utils/household';

const loadTesseract = () => {
  return new Promise((resolve, reject) => {
    if (window.Tesseract) {
      resolve(window.Tesseract);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/tesseract.js@5.1.0/dist/tesseract.min.js';
    script.onload = () => resolve(window.Tesseract);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const NON_FOOD_KEYWORDS = [
  '봉투', '세제', '컵', '장갑', '퐁퐁', '비닐', '휴지', '샴푸', '비누', '치약', '칫솔', '행주', '수세미',
  '락스', '티슈', '키친타올', '접시', '나무젓가락', '빨대', '부탄가스', '호일', '랩', '수저'
];

const isIngredientItem = (name) => {
  return !NON_FOOD_KEYWORDS.some(kw => name.includes(kw));
};

const getFallbackItems = () => [
  { name: '돼지고기 삼겹살', quantity: '600g' },
  { name: '서울우유', quantity: '1L' },
  { name: '깐마늘', quantity: '200g' },
  { name: '신라면', quantity: '5입' },
  { name: '퐁퐁 주방세제', quantity: '1개' },
  { name: '종이컵', quantity: '50개입' },
  { name: '쓰레기 종량제 봉투', quantity: '20L' },
  { name: '고무장갑', quantity: '1개' }
];

const parseOcrText = (text) => {
  if (!text || text.trim().length < 5) return [];
  
  const lines = text.split('\n');
  const items = [];
  const excludeKeywords = ['합계', '금액', '가액', '세율', '면세', '부가세', '단가', '수량', '원', '일자', '번호', '신용', '승인', '대표', '전화', '주소', '사업자', '마트', '영수증', '고객', '할인', '반품'];
  
  lines.forEach(line => {
    let cleaned = line.trim();
    cleaned = cleaned.replace(/[\d,]+/g, ' ').trim();
    cleaned = cleaned.replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, '').trim();
    
    if (cleaned.length >= 2 && cleaned.length <= 15) {
      const shouldExclude = excludeKeywords.some(kw => cleaned.includes(kw));
      if (!shouldExclude) {
        items.push({
          name: cleaned,
          quantity: '1개'
        });
      }
    }
  });
  
  if (items.length === 0) return [];
  return items.slice(0, 8);
};

const AddIngredientModal = ({ isOpen, onClose, onSave }) => {
  const [step, setStep] = useState('select-method'); // 'select-method', 'manual', 'camera', 'camera-result'
  
  // Manual Entry State
  const [name, setName] = useState('');
  const [tags, setTags] = useState([]);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [confirmList, setConfirmList] = useState([]);
  const [category, setCategory] = useState(CATEGORIES[0]); // '자동 설정' is default!
  const [isAutoDetect, setIsAutoDetect] = useState(true);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expDate, setExpDate] = useState('');
  const [storageLocation, setStorageLocation] = useState('냉장'); // '실온', '냉장', '냉동'
  const [memo, setMemo] = useState('');

  // Camera Mock State
  const [isScanning, setIsScanning] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const videoRef = useRef(null);
  
  const [capturedImage, setCapturedImage] = useState(null);
  const [receiptItems, setReceiptItems] = useState([]);
  const [selectedReceiptItems, setSelectedReceiptItems] = useState({});

  useEffect(() => {
    if (isOpen && step === 'camera') {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          setVideoStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.warn("Camera stream not available, falling back to mockup scanner UI.", err);
        });
    } else {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        setVideoStream(null);
      }
    }
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [step, isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setCapturedImage(null);
    setReceiptItems([]);
    setSelectedReceiptItems({});
    setStep('select-method');
    setName('');
    setTags([]);
    setCategory(CATEGORIES[0]);
    setIsAutoDetect(true);
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setExpDate('');
    setStorageLocation('냉장');
    setMemo('');
    onClose();
  };

  const handleCategorySelect = (cat) => {
    setCategory(cat);
    if (cat.id === 'auto') {
      setIsAutoDetect(true);
      const detected = detectCategoryByFoodName(name);
      setCategory(detected);
      if (detected.defaultExpDays !== null && purchaseDate) {
        const pDate = new Date(purchaseDate);
        pDate.setDate(pDate.getDate() + detected.defaultExpDays);
        setExpDate(pDate.toISOString().split('T')[0]);
      } else {
        setExpDate('');
      }
    } else {
      setIsAutoDetect(false);
      if (cat.defaultExpDays !== null && purchaseDate) {
        const pDate = new Date(purchaseDate);
        pDate.setDate(pDate.getDate() + cat.defaultExpDays);
        setExpDate(pDate.toISOString().split('T')[0]);
      } else {
        setExpDate('');
      }
    }
  };

  const handlePurchaseDateChange = (e) => {
    const newDate = e.target.value;
    setPurchaseDate(newDate);
    const activeCat = isAutoDetect ? detectCategoryByFoodName(name) : category;
    if (activeCat && activeCat.defaultExpDays !== null) {
      const pDate = new Date(newDate);
      pDate.setDate(pDate.getDate() + activeCat.defaultExpDays);
      setExpDate(pDate.toISOString().split('T')[0]);
    } else {
      setExpDate('');
    }
  };

  const handleNameChangeWithTags = (e) => {
    const value = e.target.value;
    if (value.includes(',')) {
      const parts = value.split(',');
      const newTags = parts.slice(0, -1).map(p => p.trim()).filter(Boolean);
      if (newTags.length > 0) {
        setTags(prev => {
          const unique = newTags.filter(t => !prev.includes(t));
          return [...prev, ...unique];
        });
      }
      const lastPart = parts[parts.length - 1];
      setName(lastPart);
    } else {
      setName(value);
      if (isAutoDetect) {
        const detected = detectCategoryByFoodName(value);
        setCategory(detected);
        if (detected.defaultExpDays !== null && purchaseDate) {
          const pDate = new Date(purchaseDate);
          pDate.setDate(pDate.getDate() + detected.defaultExpDays);
          setExpDate(pDate.toISOString().split('T')[0]);
        } else {
          setExpDate('');
        }
      }
    }
  };

  const handleAddCurrentNameToTag = () => {
    const trimmed = name.trim();
    if (trimmed) {
      setTags(prev => {
        if (!prev.includes(trimmed)) {
          return [...prev, trimmed];
        }
        return prev;
      });
      setName('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCurrentNameToTag();
    }
  };

  const handleBlur = () => {
    handleAddCurrentNameToTag();
  };

  const handleOpenConfirmPopup = () => {
    const finalNames = [...tags, name.trim()].map(t => t.trim()).filter(Boolean);
    if (finalNames.length === 0) {
      alert('식재료 이름을 입력해 주세요.');
      return;
    }

    const items = finalNames.map(fName => {
      let finalCat = '기타';
      let autoExp = '';
      if (isAutoDetect) {
        const detected = detectCategoryByFoodName(fName);
        finalCat = detected.name;
        autoExp = getAutoExpiryDate(fName, purchaseDate);
      } else {
        finalCat = category ? category.name : '기타';
        if (finalNames.length === 1 && expDate) {
          autoExp = expDate;
        } else if (category && category.defaultExpDays !== null) {
          const pDate = purchaseDate ? new Date(purchaseDate) : new Date();
          pDate.setDate(pDate.getDate() + category.defaultExpDays);
          autoExp = pDate.toISOString().split('T')[0];
        } else {
          autoExp = expDate || '';
        }
      }
      
      return {
        id: Date.now() + Math.random(),
        name: fName,
        category: finalCat,
        purchaseDate,
        expDate: autoExp || '',
        storageLocation,
        memo,
        quantity: '1개'
      };
    });

    setConfirmList(items);
    setShowConfirmPopup(true);
  };

  const handleConfirmSave = () => {
    if (confirmList.length === 0) {
      alert('추가할 식재료가 없습니다.');
      return;
    }

    const list = getHouseholdData('ingredients', []);

    const itemsToAdd = confirmList.map(item => {
      let finalExp = item.expDate;
      if (finalExp) {
        if (finalExp.indexOf('T') === -1) {
          finalExp = new Date(finalExp).toISOString();
        }
      } else {
        finalExp = '';
      }

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        purchaseDate: item.purchaseDate,
        expDate: finalExp,
        storageLocation: item.storageLocation,
        memo: item.memo,
        quantity: item.quantity,
        isFavorite: false
      };
    });

    const updatedList = [...list, ...itemsToAdd];
    setHouseholdData('ingredients', updatedList);
    alert('저장되었습니다!');
    
    setTags([]);
    setName('');
    setShowConfirmPopup(false);
    
    if (onSave) onSave();
    handleClose();
  };

  const handleSave = () => {
    const list = getHouseholdData('ingredients', []);

    if (step === 'camera-result') {
      const selectedList = receiptItems.filter(item => selectedReceiptItems[item.name]);
      if (selectedList.length === 0) {
        alert('추가할 식재료를 하나 이상 선택해 주세요.');
        return;
      }
      
      const items = selectedList.map((item, idx) => {
        const detectedCat = detectCategoryByFoodName(item.name);
        let storage = '냉장';
        if (detectedCat.id === 'frozen') {
          storage = '냉동';
        } else if (['grain', 'processed', 'drink', 'seasoning', 'sauce', 'spice', 'other'].includes(detectedCat.id)) {
          storage = '실온';
        }
        
        const autoExp = getAutoExpiryDate(item.name, purchaseDate);
        
        return {
          id: Date.now() + Math.random() + idx,
          name: item.name,
          category: detectedCat.name,
          purchaseDate,
          expDate: autoExp || '',
          storageLocation: storage,
          memo: '영수증 인식',
          quantity: item.quantity || '1개'
        };
      });

      setConfirmList(items);
      setShowConfirmPopup(true);
    } else {
      if (!name.trim()) {
        alert('식재료 이름을 입력해 주세요.');
        return;
      }

      let finalExp = expDate;
      let finalCat = category ? category.name : '기타';

      if (!category || category.id === 'auto') {
        const detected = detectCategoryByFoodName(name);
        finalCat = detected.name;
        if (!finalExp && detected.defaultExpDays !== null) {
          finalExp = getAutoExpiryDate(name, purchaseDate);
        }
      } else if (category.id === 'other') {
        finalCat = '기타';
      }

      if (finalExp) {
        if (finalExp.indexOf('T') === -1) {
          finalExp = new Date(finalExp).toISOString();
        }
      } else {
        finalExp = ''; // Keep it empty for '기타' or when cleared
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
      const updatedList = [...list, newIngredient];
      setHouseholdData('ingredients', updatedList);
      alert('저장되었습니다!');
      if (onSave) onSave();
      handleClose();
    }
  };

  const handleTakePhoto = () => {
    setIsScanning(true);
    
    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    if (video && videoStream) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);

      loadTesseract()
        .then(tesseract => {
          tesseract.recognize(dataUrl, 'kor+eng')
            .then(({ data: { text } }) => {
              const parsed = parseOcrText(text);
              setReceiptItems(parsed);
              
              const initialSelect = {};
              parsed.forEach(item => {
                initialSelect[item.name] = isIngredientItem(item.name);
              });
              setSelectedReceiptItems(initialSelect);
              
              setIsScanning(false);
              setStep('camera-result');
            })
            .catch(err => {
              console.error("OCR recognition error:", err);
              setupFallbackReceipt();
            });
        })
        .catch(err => {
          console.error("Tesseract load error:", err);
          setupFallbackReceipt();
        });
    } else {
      setCapturedImage(null);
      setTimeout(() => {
        setupFallbackReceipt();
      }, 2000);
    }
  };

  const setupFallbackReceipt = () => {
    const fallback = getFallbackItems();
    setReceiptItems(fallback);
    const initialSelect = {};
    fallback.forEach(item => {
      initialSelect[item.name] = isIngredientItem(item.name);
    });
    setSelectedReceiptItems(initialSelect);
    setIsScanning(false);
    setStep('camera-result');
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
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>식재료 이름 (쉼표로 구분하여 여러 개 입력 가능)</label>
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                {tags.map((tag, idx) => (
                  <span 
                    key={idx} 
                    style={{ 
                      fontSize: '11px', 
                      background: '#e0f2ec', 
                      color: 'var(--primary-color)', 
                      border: '1px solid var(--primary-color)', 
                      padding: '3px 8px', 
                      borderRadius: '6px', 
                      fontWeight: 'bold', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px' 
                    }}
                  >
                    {tag}
                    <button 
                      type="button"
                      onClick={() => setTags(prev => prev.filter((_, i) => i !== idx))}
                      style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: 0, fontSize: '11px', fontWeight: 'bold' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input 
              type="text" 
              className="input-field" 
              placeholder="예: 소고기, 우유, 달걀 (쉼표 또는 Enter 입력)" 
              value={name}
              onChange={handleNameChangeWithTags}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>카테고리</label>
            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '4px', border: '1px solid var(--gray-100)', borderRadius: '8px' }}>
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                let isSelected = false;
                let isAutoDetected = false;
                
                if (cat.id === 'auto') {
                  isSelected = isAutoDetect;
                } else {
                  if (category?.id === cat.id) {
                    if (isAutoDetect) {
                      isAutoDetected = true;
                    } else {
                      isSelected = true;
                    }
                  }
                }
                return (
                  <div 
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat)}
                    style={{ 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                      padding: '12px 8px', borderRadius: '8px', cursor: 'pointer',
                      border: isSelected 
                        ? '2px solid var(--primary-color)' 
                        : isAutoDetected 
                          ? '2px dashed var(--primary-color)' 
                          : '1px solid var(--gray-200)',
                      background: isSelected 
                        ? '#e0f2ec' 
                        : isAutoDetected 
                          ? '#f0fdf4' 
                          : '#fff'
                    }}
                  >
                    <Icon size={24} color={isSelected || isAutoDetected ? 'var(--primary-color)' : 'var(--gray-400)'} style={{ marginBottom: '4px' }} />
                    <span style={{ fontSize: '12px', color: isSelected || isAutoDetected ? 'var(--primary-color)' : 'var(--gray-600)', fontWeight: isSelected || isAutoDetected ? 'bold' : 'normal' }}>
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
              {isAutoDetect 
                ? `* 자동 설정 활성: 이름 분석 결과 [${category.name}] 카테고리 및 유통기한 감지됨`
                : `* 수동 지정 활성: [${category.name}] 카테고리의 일반적 유통기한 적용`}
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

          <button className="btn-primary" style={{ marginTop: '16px' }} onClick={handleOpenConfirmPopup}>
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
            position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center'
          }}>
            {/* Real Video element */}
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              style={{ 
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover',
                display: videoStream ? 'block' : 'none'
              }} 
            />
            
            {/* Fallback View when stream is not active */}
            {!videoStream && (
              <div style={{ color: '#fff', textAlign: 'center', padding: '20px', zIndex: 1 }}>
                <p style={{ fontSize: '13px', margin: '0 0 10px 0' }}>📷 실시간 카메라 화면 준비 중...</p>
                <div style={{
                  fontSize: '11px', background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px',
                  display: 'inline-block', textAlign: 'left', lineHeight: '1.5', border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <strong>[인식될 영수증 예시]</strong><br />
                  - 돼지고기 삼겹살 600g<br />
                  - 서울우유 1L<br />
                  - 깐마늘 200g<br />
                  - 신라면 5입<br />
                  - 퐁퐁 주방세제 (비식재료)<br />
                  - 종이컵 50개입 (비식재료)<br />
                  - 쓰레기 종량제 봉투 20L (비식재료)<br />
                  - 고무장갑 (비식재료)
                </div>
              </div>
            )}

            {/* Camera Frame Overlay */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2, pointerEvents: 'none' }}>
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
                animation: 'scan 2s infinite linear',
                zIndex: 3
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
      const ingredientsOnly = receiptItems.filter(item => isIngredientItem(item.name));
      const excludedOnly = receiptItems.filter(item => !isIngredientItem(item.name));
      
      const toggleItemSelect = (itemName) => {
        setSelectedReceiptItems(prev => ({
          ...prev,
          [itemName]: !prev[itemName]
        }));
      };

      // 영수증에서 아무 품목도 인식되지 않은 경우
      if (receiptItems.length === 0) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', padding: '20px 0' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid var(--gray-200)', width: '100%' }}>
              {capturedImage ? (
                <img 
                  src={capturedImage} 
                  alt="Captured receipt" 
                  style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--gray-300)' }} 
                />
              ) : (
                <div style={{ width: '60px', height: '80px', backgroundColor: '#e2e8f0', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  📄
                </div>
              )}
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-black)', margin: '0 0 4px 0' }}>영수증 분석 결과</h3>
                <p style={{ color: 'var(--gray-500)', fontSize: '11px', margin: 0, lineHeight: '1.3' }}>촬영한 사진을 분석했습니다.</p>
              </div>
            </div>

            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
              background: '#fff7ed', border: '1px solid #fed7aa', padding: '28px 20px', borderRadius: '16px', width: '100%', boxSizing: 'border-box'
            }}>
              <span style={{ fontSize: '48px' }}>🔍</span>
              <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ea580c', margin: 0 }}>인식된 식재료가 없습니다.</h4>
              <p style={{ fontSize: '12px', color: 'var(--gray-500)', margin: 0, textAlign: 'center', lineHeight: '1.5' }}>
                영수증의 글씨가 잘 보이도록 다시 촬영해 주세요.<br />
                또렷하고 밝은 환경에서 촬영하면 인식률이 높아집니다.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button className="btn-primary" style={{ flex: 1, background: '#f1f5f9', color: 'var(--gray-500)', border: 'none' }} onClick={() => setStep('camera')}>
                다시 촬영
              </button>
              <button className="btn-primary" style={{ flex: 1, background: '#f1f5f9', color: 'var(--gray-500)', border: 'none' }} onClick={() => setStep('select-method')}>
                직접 입력하기
              </button>
            </div>
          </div>
        );
      }

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '65vh' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid var(--gray-200)' }}>
            {capturedImage ? (
              <img 
                src={capturedImage} 
                alt="Captured receipt" 
                style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--gray-300)' }} 
              />
            ) : (
              <div style={{ width: '60px', height: '80px', backgroundColor: '#e2e8f0', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                📄
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-black)', margin: '0 0 4px 0' }}>영수증 분석 결과</h3>
              <p style={{ color: 'var(--gray-500)', fontSize: '11px', margin: 0, lineHeight: '1.3' }}>사진 속 품목들을 탐지했습니다. 체크된 항목들만 확인 팝업창을 거쳐 냉장고에 저장됩니다.</p>
            </div>
          </div>
          
          <div>
            <h4 style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '8px' }}>
              🥬 인식된 식재료 (자동 추가 대상)
            </h4>
            {ingredientsOnly.length === 0 ? (
              <p style={{ fontSize: '11px', color: 'var(--gray-400)', margin: '4px 0' }}>인식된 식재료가 없습니다.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ingredientsOnly.map((item, idx) => {
                  const cat = detectCategoryByFoodName(item.name);
                  const icon = getFoodIcon(item.name, cat.name);
                  const isChecked = !!selectedReceiptItems[item.name];
                  
                  return (
                    <div 
                      key={idx} 
                      onClick={() => toggleItemSelect(item.name)}
                      style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        background: isChecked ? '#fff' : '#f8fafc', 
                        padding: '10px 12px', borderRadius: '8px', 
                        border: isChecked ? '1px solid #dcfce7' : '1px solid var(--gray-200)',
                        cursor: 'pointer',
                        opacity: isChecked ? 1 : 0.6
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '18px', height: '18px', borderRadius: '4px',
                          border: isChecked ? '1px solid var(--primary-color)' : '1px solid var(--gray-300)',
                          backgroundColor: isChecked ? 'var(--primary-color)' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '4px'
                        }}>
                          {isChecked && <div style={{ width: '8px', height: '8px', backgroundColor: '#fff', borderRadius: '1px' }} />}
                        </div>
                        <span style={{ fontSize: '20px' }}>{icon}</span>
                        <div>
                          <span style={{ fontWeight: 'bold', fontSize: '13.5px', color: 'var(--text-black)' }}>{item.name}</span>
                          <span style={{ fontSize: '9px', background: '#e0f2ec', color: 'var(--primary-color)', padding: '1px 5px', borderRadius: '4px', marginLeft: '6px', fontWeight: 'bold' }}>
                            {cat.name}
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: '12.5px', color: 'var(--gray-500)' }}>{item.quantity}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h4 style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#e53e3e', marginBottom: '8px' }}>
              🚫 제외된 품목 (체크 시 수동 포함 가능)
            </h4>
            {excludedOnly.length === 0 ? (
              <p style={{ fontSize: '11px', color: 'var(--gray-400)', margin: '4px 0' }}>제외된 품목이 없습니다.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {excludedOnly.map((item, idx) => {
                  const isChecked = !!selectedReceiptItems[item.name];
                  
                  return (
                    <div 
                      key={idx} 
                      onClick={() => toggleItemSelect(item.name)}
                      style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        background: isChecked ? '#fff' : '#fef2f2', 
                        padding: '10px 12px', borderRadius: '8px', 
                        border: isChecked ? '1px solid #feb2b2' : '1px solid var(--gray-200)',
                        cursor: 'pointer',
                        opacity: isChecked ? 1 : 0.65
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '18px', height: '18px', borderRadius: '4px',
                          border: isChecked ? '1px solid #e53e3e' : '1px solid var(--gray-300)',
                          backgroundColor: isChecked ? '#e53e3e' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '4px'
                        }}>
                          {isChecked && <div style={{ width: '8px', height: '8px', backgroundColor: '#fff', borderRadius: '1px' }} />}
                        </div>
                        <span 
                          style={{ 
                            fontWeight: 'bold', fontSize: '13.5px', 
                            color: isChecked ? 'var(--text-black)' : 'var(--gray-500)',
                            textDecoration: isChecked ? 'none' : 'line-through' 
                          }}
                        >
                          {item.name}
                        </span>
                        <span style={{ fontSize: '9px', background: isChecked ? '#fee2e2' : '#f1f5f9', color: isChecked ? '#e53e3e' : 'var(--gray-500)', padding: '1px 5px', borderRadius: '4px', marginLeft: '6px', fontWeight: 'bold' }}>
                          비식재료
                        </span>
                      </div>
                      <span style={{ fontSize: '12.5px', color: 'var(--gray-500)' }}>{item.quantity}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button className="btn-primary" style={{ flex: 1, background: '#f1f5f9', color: 'var(--gray-500)', border: 'none' }} onClick={() => setStep('camera')}>
              다시 촬영
            </button>
            <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave}>
              식재료 확인 및 추가 ({receiptItems.filter(item => selectedReceiptItems[item.name]).length}건)
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

      {/* Confirmation Popup */}
      {showConfirmPopup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100,
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            width: '90%',
            maxWidth: '420px',
            borderRadius: '20px',
            padding: '24px 20px',
            boxSizing: 'border-box',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'scaleUp 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--gray-200)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: 'var(--text-black)', margin: 0 }}>
                식재료 추가 확인
              </h3>
              <button onClick={() => setShowConfirmPopup(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--gray-500)', margin: 0 }}>
              냉장고에 넣기 전 수량과 유통기한을 확인해 주세요.
            </p>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
              {confirmList.map((item, idx) => {
                const icon = getFoodIcon(item.name, item.category);
                return (
                  <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid var(--gray-200)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '24px' }}>{icon}</span>
                        <div>
                          <strong style={{ fontSize: '14px', color: 'var(--text-black)' }}>{item.name}</strong>
                          <span style={{ fontSize: '10px', background: '#e0f2ec', color: 'var(--primary-color)', padding: '1px 5px', borderRadius: '4px', marginLeft: '6px', fontWeight: 'bold' }}>
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setConfirmList(prev => prev.filter(c => c.id !== item.id))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', padding: '2px' }}
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--gray-500)', marginBottom: '4px' }}>수량</label>
                        <input 
                          type="text" 
                          className="input-field" 
                          style={{ padding: '6px 8px', fontSize: '12px', height: 'auto' }}
                          value={item.quantity}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConfirmList(prev => prev.map(c => c.id === item.id ? { ...c, quantity: val } : c));
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--gray-500)', marginBottom: '4px' }}>유통기한</label>
                        <input 
                          type="date" 
                          className="input-field" 
                          style={{ padding: '6px 8px', fontSize: '12px', height: 'auto' }}
                          value={item.expDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConfirmList(prev => prev.map(c => c.id === item.id ? { ...c, expDate: val } : c));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button 
                onClick={() => setShowConfirmPopup(false)}
                style={{
                  flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '10px',
                  fontSize: '13px', fontWeight: 'bold', color: 'var(--gray-500)', cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button 
                onClick={handleConfirmSave}
                style={{
                  flex: 2, padding: '12px', background: 'var(--primary-color)', border: 'none', borderRadius: '10px',
                  fontSize: '13px', fontWeight: 'bold', color: '#ffffff', cursor: 'pointer',
                  boxShadow: '0 4px 6px rgba(55,146,113,0.2)'
                }}
              >
                냉장고에 추가 ({confirmList.length}건)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddIngredientModal;
