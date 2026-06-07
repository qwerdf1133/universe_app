import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Plus, X, CheckSquare, Square, Trash2, User, Copy, ArrowRight, ShoppingBag, Send } from 'lucide-react';
import { CATEGORIES, detectCategoryByFoodName, getAutoExpiryDate, getFoodIcon } from '../utils/categories';
import { getHouseholdData, setHouseholdData } from '../utils/household';

const INITIAL_SHOPPING = [];
const INITIAL_MEMBER_REQUESTS = [];

const Shopping = () => {
  const [activeTab, setActiveTab] = useState('my'); // 'my' or 'member'
  const [shoppingList, setShoppingList] = useState([]);
  const [memberRequests, setMemberRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('add-item'); // 'add-item' or 'request-item'

  // Simplified Add Form State
  const [name, setName] = useState('');
  const [tags, setTags] = useState([]);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [confirmList, setConfirmList] = useState([]);
  const [category, setCategory] = useState(CATEGORIES[0]); // '자동 설정' is default!
  const [isAutoDetect, setIsAutoDetect] = useState(true);
  const [memo, setMemo] = useState('');

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    if (isAutoDetect) {
      const detected = detectCategoryByFoodName(newName);
      setCategory(detected);
    }
  };

  const handleCategorySelect = (cat) => {
    setCategory(cat);
    if (cat.id === 'auto') {
      setIsAutoDetect(true);
      const detected = detectCategoryByFoodName(name);
      setCategory(detected);
    } else {
      setIsAutoDetect(false);
    }
  };

  const handleCloseModal = () => {
    setName('');
    setTags([]);
    setCategory(CATEGORIES[0]);
    setIsAutoDetect(true);
    setMemo('');
    setIsModalOpen(false);
  };

  // Load Initial Lists
  useEffect(() => {
    const loadLists = () => {
      // 1. My Shopping List
      const storedShopping = getHouseholdData('shopping-list', INITIAL_SHOPPING);
      setShoppingList(storedShopping);

      // 2. Member Requests List
      const storedRequests = getHouseholdData('member-requests', INITIAL_MEMBER_REQUESTS);
      setMemberRequests(storedRequests);
    };

    loadLists();
    window.addEventListener('fridgeSync', loadLists);
    return () => window.removeEventListener('fridgeSync', loadLists);
  }, []);

  const saveShoppingList = (newList) => {
    setShoppingList(newList);
    setHouseholdData('shopping-list', newList);
  };

  const saveMemberRequests = (newList) => {
    setMemberRequests(newList);
    setHouseholdData('member-requests', newList);
  };


  // Toggle Single Checkbox (My Shopping)
  const handleToggleCheck = (id, e) => {
    e.stopPropagation();
    const updated = shoppingList.map(item => {
      if (item.id === id) {
        return { ...item, checked: !item.checked };
      }
      return item;
    });
    saveShoppingList(updated);
  };

  // Select All (My Shopping)
  const handleSelectAll = () => {
    const allChecked = shoppingList.every(item => item.checked);
    const updated = shoppingList.map(item => ({ ...item, checked: !allChecked }));
    saveShoppingList(updated);
  };

  // Delete Checked Items (My Shopping)
  const handleDeleteChecked = () => {
    const remaining = shoppingList.filter(item => !item.checked);
    saveShoppingList(remaining);
  };

  // Purchase Complete Action -> Add to ingredients & remove from shopping
  const handlePurchaseComplete = () => {
    const checkedItems = shoppingList.filter(item => item.checked);
    if (checkedItems.length === 0) {
      alert('구매 완료할 식재료를 체크해 주세요.');
      return;
    }

    if (window.confirm(`선택한 ${checkedItems.length}건의 상품 구매를 완료하고 냉장고 식재료 목록에 넣으시겠습니까?`)) {
      // 1. Remove from My Shopping
      const remaining = shoppingList.filter(item => !item.checked);
      saveShoppingList(remaining);

      // 2. Add to ingredients
      const ingredientsList = getHouseholdData('ingredients', []);

      checkedItems.forEach(item => {
        const todayStr = new Date().toISOString().split('T')[0];
        
        // Auto Category Identification
        let finalCat = item.category;
        if (item.category === '자동 설정' || !item.category) {
          finalCat = detectCategoryByFoodName(item.name).name;
        }

        // Auto Storage Location
        let storage = '냉장';
        if (finalCat === '냉동식품') {
          storage = '냉동';
        } else if (['곡류', '가공식품', '음료', '조미료', '소스류', '향신료', '기타'].includes(finalCat)) {
          storage = '실온';
        }

        // Auto Expiry Date calculation
        const autoExp = getAutoExpiryDate(item.name, todayStr);
        const finalExp = autoExp ? new Date(autoExp).toISOString() : '';

        ingredientsList.push({
          id: Date.now() + Math.random(),
          name: item.name,
          category: finalCat,
          purchaseDate: todayStr,
          expDate: finalExp,
          storageLocation: storage,
          memo: item.memo || '장보기 구매 완료',
          quantity: item.quantity || '1개',
          isFavorite: false
        });
      });

      setHouseholdData('ingredients', ingredientsList);
      alert(`구매 완료된 식재료 ${checkedItems.length}건이 냉장고 식재료 목록에 실시간 연동/추가되었습니다!`);
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
      let finalCat = category ? category.name : '기타';
      if (!category || category.id === 'auto') {
        finalCat = detectCategoryByFoodName(fName).name;
      }
      return {
        id: Date.now() + Math.random(),
        name: fName,
        category: finalCat,
        qty: '1개',
        memo: memo || ''
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

    if (modalTab === 'add-item') {
      const newItems = confirmList.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        memo: item.memo ? `수량: ${item.qty}, ${item.memo}` : `수량: ${item.qty}`,
        quantity: item.qty,
        checked: false
      }));
      const updated = [...shoppingList, ...newItems];
      saveShoppingList(updated);
      alert(`장보기 목록에 ${confirmList.length}건이 추가되었습니다.`);
    } else {
      const currentUserStr = localStorage.getItem('currentUser');
      const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
      const nickname = currentUser ? currentUser.nickname : '나';

      const avatars = ['🐰', '🐱', '🦊', '🐻', '🐼', '🦁', '🐸', '🐨', '🐯', '😎'];
      const charCodeSum = nickname.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const avatar = avatars[charCodeSum % avatars.length];

      const newRequests = confirmList.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        qty: item.qty || '1개',
        checked: false,
        requester: nickname,
        avatar: avatar,
        memo: item.memo || ''
      }));
      const updated = [...memberRequests, ...newRequests];
      saveMemberRequests(updated);
      alert(`장보기 요청이 ${confirmList.length}건 등록되었습니다.`);
    }

    setTags([]);
    setName('');
    setMemo('');
    setCategory(CATEGORIES[0]);
    setIsAutoDetect(true);
    setShowConfirmPopup(false);
    setIsModalOpen(false);
  };

  // Copy Member Request Item to My List
  const handleCopyToMyList = (reqItem) => {
    const exists = shoppingList.some(item => item.name === reqItem.name);
    if (exists) {
      alert(`"${reqItem.name}"은(는) 이미 장보기 목록에 존재합니다.`);
      return;
    }

    const newItem = {
      id: Date.now(),
      name: reqItem.name,
      category: reqItem.category,
      memo: `${reqItem.requester}의 요청 (${reqItem.qty})`,
      checked: false
    };

    const updated = [...shoppingList, newItem];
    saveShoppingList(updated);
    alert(`"${reqItem.name}"이(가) 내 장보기 목록에 추가되었습니다!`);
  };

  // Toggle Single Checkbox (Member Requests)
  const handleToggleRequestCheck = (id, e) => {
    e.stopPropagation();
    const updated = memberRequests.map(item => {
      if (item.id === id) {
        return { ...item, checked: !item.checked };
      }
      return item;
    });
    saveMemberRequests(updated);
  };

  // Select All (Member Requests)
  const handleRequestSelectAll = () => {
    const allChecked = memberRequests.every(item => item.checked);
    const updated = memberRequests.map(item => ({ ...item, checked: !allChecked }));
    saveMemberRequests(updated);
  };

  // Purchase Planned (Move Checked Member Requests to My Shopping)
  const handlePurchasePlanned = () => {
    const checkedReqs = memberRequests.filter(item => item.checked);
    if (checkedReqs.length === 0) {
      alert('내 장보기 목록으로 가져올 구성원 요청 식재료를 체크해 주세요.');
      return;
    }

    let currentShopping = [...shoppingList];
    let addedCount = 0;

    checkedReqs.forEach(reqItem => {
      const exists = currentShopping.some(item => item.name === reqItem.name);
      if (!exists) {
        currentShopping.push({
          id: Date.now() + Math.random(),
          name: reqItem.name,
          category: reqItem.category,
          memo: `${reqItem.requester}의 요청 (${reqItem.qty})`,
          checked: false
        });
        addedCount++;
      }
    });

    saveShoppingList(currentShopping);

    // Remove checked requests from Member Requests
    const remainingRequests = memberRequests.filter(item => !item.checked);
    saveMemberRequests(remainingRequests);

    alert(`선택하신 구성원 요청 ${checkedReqs.length}건 중 ${addedCount}건이 내 장보기 목록에 구매 예정으로 이전되었습니다!`);
  };

  // Delete Member Requests
  const handleDeleteRequests = () => {
    const checkedReqs = memberRequests.filter(item => item.checked);
    if (checkedReqs.length === 0) {
      alert('삭제할 요청 식재료를 체크해 주세요.');
      return;
    }

    if (window.confirm(`선택한 ${checkedReqs.length}건의 요청을 삭제하시겠습니까?`)) {
      const remainingRequests = memberRequests.filter(item => !item.checked);
      saveMemberRequests(remainingRequests);
    }
  };

  return (
    <div className="page-container">
      <Header title="장보기 관리" />
      <div className="content" style={{ paddingBottom: '80px', paddingTop: '10px' }}>
        
        {/* Top Actions Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
            {activeTab === 'my' ? `내 장바구니 항목: ${shoppingList.length}개` : `구성원 요청 항목: ${memberRequests.length}개`}
          </span>
          <button 
            style={{ 
              background: 'none', border: 'none', color: 'var(--primary-color)', 
              display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' 
            }}
            onClick={() => {
              setModalTab('add-item');
              setIsModalOpen(true);
            }}
          >
            <Plus size={16} /> 항목 추가
          </button>
        </div>

        {/* Custom Premium Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', marginBottom: '16px' }}>
          <button 
            style={{ 
              flex: 1, 
              padding: '12px', 
              fontSize: '14px', 
              fontWeight: activeTab === 'my' ? 'bold' : 'normal', 
              color: activeTab === 'my' ? 'var(--primary-color)' : 'var(--gray-500)', 
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'my' ? '2px solid var(--primary-color)' : 'none',
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab('my')}
          >
            내 장보기 목록
          </button>
          <button 
            style={{ 
              flex: 1, 
              padding: '12px', 
              fontSize: '14px', 
              fontWeight: activeTab === 'member' ? 'bold' : 'normal', 
              color: activeTab === 'member' ? 'var(--primary-color)' : 'var(--gray-500)', 
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'member' ? '2px solid var(--primary-color)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onClick={() => setActiveTab('member')}
          >
            구성원 장보기 요청 목록
            {memberRequests.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', background: '#fee2e2', color: '#ef4444', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>
                🔔 {memberRequests.length}
              </div>
            )}
          </button>
        </div>

        {/* ==================== 내 장보기 목록 ==================== */}
        {activeTab === 'my' && (
          <div>
            {shoppingList.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: '200px', border: '2px dashed var(--gray-300)', borderRadius: '12px',
                backgroundColor: '#fafafa', marginTop: '20px'
              }}>
                <p style={{ color: 'var(--gray-400)', fontSize: '14px', marginBottom: '16px' }}>장보기 목록이 비어 있습니다.</p>
                <button 
                  className="btn-primary" 
                  style={{ width: 'auto', padding: '10px 24px' }}
                  onClick={() => {
                    setModalTab('add-item');
                    setIsModalOpen(true);
                  }}
                >
                  직접 추가하기
                </button>
              </div>
            ) : (
              <div>
                {/* Header Controls: Select All & Delete Selected */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <button 
                    onClick={handleSelectAll}
                    style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gray-600)', fontSize: '13px', cursor: 'pointer' }}
                  >
                    {shoppingList.every(item => item.checked) ? <CheckSquare size={16} color="var(--primary-color)" /> : <Square size={16} />}
                    전체 선택 ({shoppingList.filter(item => item.checked).length}/{shoppingList.length})
                  </button>

                  <button 
                    onClick={handleDeleteChecked}
                    disabled={!shoppingList.some(item => item.checked)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      color: shoppingList.some(item => item.checked) ? 'red' : 'var(--gray-300)', 
                      fontSize: '13px',
                      cursor: shoppingList.some(item => item.checked) ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <Trash2 size={15} /> 선택 삭제
                  </button>
                </div>

                {/* Shopping Item Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                  {shoppingList.map(item => (
                    <div 
                      key={item.id} 
                      onClick={(e) => handleToggleCheck(item.id, e)}
                      style={{ 
                        padding: '14px 16px', 
                        background: '#fff', 
                        border: '1px solid var(--gray-200)', 
                        borderRadius: '12px', 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ color: item.checked ? 'var(--primary-color)' : 'var(--gray-300)' }}>
                          {item.checked ? <CheckSquare size={20} /> : <Square size={20} />}
                        </div>
                        
                        {/* Food Icon Integration */}
                        <div style={{ fontSize: '24px', background: '#f3f4f6', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {getFoodIcon(item.name, item.category)}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span 
                              style={{ 
                                fontWeight: 'bold', 
                                textDecoration: item.checked ? 'line-through' : 'none', 
                                color: item.checked ? 'var(--gray-400)' : 'var(--text-black)',
                                fontSize: '15px'
                              }}
                            >
                              {item.name}
                            </span>
                            <span style={{ fontSize: '9px', background: '#e0f2ec', color: 'var(--primary-color)', padding: '1px 5px', borderRadius: '4px' }}>
                              {item.category}
                            </span>
                          </div>
                          {item.memo && (
                            <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '2px' }}>
                              {item.memo}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 구매 완료 버튼 (Purchase Complete Button) */}
                <button 
                  onClick={handlePurchaseComplete}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    borderRadius: '12px',
                    background: shoppingList.some(item => item.checked) ? 'var(--primary-color)' : '#cbd5e1',
                    color: '#fff',
                    border: 'none',
                    cursor: shoppingList.some(item => item.checked) ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 6px -1px rgba(55,146,113,0.2)'
                  }}
                  disabled={!shoppingList.some(item => item.checked)}
                >
                  <ShoppingBag size={18} /> 구매 완료 (냉장고로 넣기)
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================== 구성원 장보기 요청 목록 ==================== */}
        {activeTab === 'member' && (
          <div>
            {memberRequests.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: '200px', border: '2px dashed var(--gray-300)', borderRadius: '12px',
                backgroundColor: '#fafafa', marginTop: '20px'
              }}>
                <p style={{ color: 'var(--gray-500)', fontSize: '15px', fontWeight: 'bold' }}>요청사항이 없어요!</p>
              </div>
            ) : (
              <div>
                {/* Requester Header box */}
                {(() => {
                  const latestReq = memberRequests[memberRequests.length - 1];
                  const latestRequester = latestReq ? latestReq.requester : '구성원';
                  const latestAvatar = latestReq ? latestReq.avatar : '👩';
                  
                  const currentUserStr = localStorage.getItem('currentUser');
                  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
                  const currentNickname = currentUser ? currentUser.nickname : '나';

                  return (
                    <div style={{ background: '#f0fdf4', border: '1px dashed #bbf7d0', padding: '16px', borderRadius: '16px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '24px' }}>{latestAvatar}</span>
                        <div>
                          <h4 style={{ fontWeight: 'bold', color: 'var(--primary-color)', fontSize: '14.5px', margin: 0 }}>
                            {latestRequester === currentNickname ? '내가' : `${latestRequester}님이`} 재료를 사오라고 요청했어요! <span style={{ color: 'red' }}>(총 {memberRequests.length}개)</span>
                          </h4>
                          <p style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '4px', margin: 0 }}>
                            최근 요청일: {new Date(latestReq ? latestReq.id : Date.now()).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Header Controls for Member Requests */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <button 
                    onClick={handleRequestSelectAll}
                    style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gray-600)', fontSize: '13px', cursor: 'pointer' }}
                  >
                    {memberRequests.every(item => item.checked) ? <CheckSquare size={16} color="var(--primary-color)" /> : <Square size={16} />}
                    전체 선택 ({memberRequests.filter(item => item.checked).length}/{memberRequests.length})
                  </button>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={handlePurchasePlanned}
                      disabled={!memberRequests.some(item => item.checked)}
                      style={{ 
                        background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', 
                        color: memberRequests.some(item => item.checked) ? 'var(--primary-color)' : 'var(--gray-300)', 
                        fontSize: '13px', fontWeight: 'bold',
                        cursor: memberRequests.some(item => item.checked) ? 'pointer' : 'not-allowed'
                      }}
                    >
                      <Copy size={14} /> 구매 예정
                    </button>
                    <button 
                      onClick={handleDeleteRequests}
                      disabled={!memberRequests.some(item => item.checked)}
                      style={{ 
                        background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', 
                        color: memberRequests.some(item => item.checked) ? 'red' : 'var(--gray-300)', 
                        fontSize: '13px',
                        cursor: memberRequests.some(item => item.checked) ? 'pointer' : 'not-allowed'
                      }}
                    >
                      <Trash2 size={14} /> 삭제
                    </button>
                  </div>
                </div>

                {/* Requested Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {memberRequests.map(reqItem => (
                    <div 
                      key={reqItem.id} 
                      onClick={(e) => handleToggleRequestCheck(reqItem.id, e)}
                      style={{ 
                        padding: '16px', 
                        background: '#fff', 
                        border: '1px solid var(--gray-200)', 
                        borderRadius: '12px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                        {/* Checkbox */}
                        <div style={{ color: reqItem.checked ? 'var(--primary-color)' : 'var(--gray-300)', flexShrink: 0 }}>
                          {reqItem.checked ? <CheckSquare size={20} /> : <Square size={20} />}
                        </div>

                        {/* Requester Profile Badge */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '50px', flexShrink: 0 }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e0f2ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                            {reqItem.avatar || '👤'}
                          </div>
                          <span style={{ fontSize: '9px', color: 'var(--gray-500)', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '50px' }}>
                            {reqItem.requester || '미정'}
                          </span>
                        </div>
                        
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reqItem.name}</span>
                            <span style={{ fontSize: '10px', background: '#e2e8f0', color: 'var(--gray-600)', padding: '2px 5px', borderRadius: '4px', flexShrink: 0 }}>
                              {reqItem.category}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', color: 'var(--gray-500)' }}>요청자: <strong>{reqItem.requester || '미정'}</strong></span>
                            <span style={{ fontSize: '11px', color: 'var(--gray-300)' }}>|</span>
                            <span style={{ fontSize: '11px', color: 'var(--primary-color)', fontWeight: 'bold' }}>요구량: {reqItem.qty}</span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyToMyList(reqItem);
                        }}
                        style={{ 
                          background: '#e0f2ec', 
                          color: 'var(--primary-color)', 
                          border: 'none', 
                          padding: '8px 12px', 
                          borderRadius: '8px', 
                          fontSize: '12px', 
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          flexShrink: 0,
                          marginLeft: '8px'
                        }}
                      >
                        내 목록 추가 <ArrowRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ==================== DUAL ADD MODAL (ADD / REQUEST) ==================== */}
      {isModalOpen && (
        <>
          <div 
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999,
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={handleCloseModal}
          />
          
          <div 
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              backgroundColor: '#fff', zIndex: 1000,
              borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
              padding: '24px 20px',
              maxHeight: '90vh',
              animation: 'slideUp 0.3s ease-out',
              boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>장보기 관리 추가</h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={24} color="var(--gray-400)" />
              </button>
            </div>

            {/* Modal Internal Tabs */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '4px', marginBottom: '20px' }}>
              <button 
                onClick={() => setModalTab('add-item')}
                style={{
                  flex: 1, padding: '10px', fontSize: '13px', fontWeight: 'bold', border: 'none', borderRadius: '8px',
                  background: modalTab === 'add-item' ? '#fff' : 'transparent',
                  color: modalTab === 'add-item' ? 'var(--primary-color)' : 'var(--gray-500)',
                  boxShadow: modalTab === 'add-item' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer'
                }}
              >
                장보기 식재료 추가
              </button>
              <button 
                onClick={() => setModalTab('request-item')}
                style={{
                  flex: 1, padding: '10px', fontSize: '13px', fontWeight: 'bold', border: 'none', borderRadius: '8px',
                  background: modalTab === 'request-item' ? '#fff' : 'transparent',
                  color: modalTab === 'request-item' ? 'var(--primary-color)' : 'var(--gray-500)',
                  boxShadow: modalTab === 'request-item' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer'
                }}
              >
                구성원에게 장보기 요청하기
              </button>
            </div>

            {/* Modal Interactive Fields Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                  placeholder="예: 계란, 대파, 두부 (쉼표 또는 Enter 입력)" 
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
                {category && (
                  <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '6px' }}>
                    {isAutoDetect 
                      ? `* 자동 설정 활성: 이름 분석 결과 [${category.name}] 카테고리 감지됨`
                      : `* 수동 지정 활성: [${category.name}] 카테고리 적용`}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  {modalTab === 'add-item' ? '메모 (선택)' : '요구량 / 메모 (선택)'}
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder={modalTab === 'add-item' ? '수량, 특정 브랜드 등 메모' : '예: 2모, 1판, 500g 등'}
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                />
              </div>

              <button 
                className="btn-primary" 
                style={{ 
                  marginTop: '16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px' 
                }} 
                onClick={handleOpenConfirmPopup}
              >
                {modalTab === 'add-item' ? <ShoppingBag size={18} /> : <Send size={18} />}
                {modalTab === 'add-item' ? '장바구니 추가' : '구성원 요청 발송'}
              </button>
            </div>
          </div>
        </>
      )}

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
                {modalTab === 'add-item' ? '장보기 식재료 추가 확인' : '장보기 요청 확인'}
              </h3>
              <button onClick={() => setShowConfirmPopup(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--gray-500)', margin: 0 }}>
              최종 추가하기 전 수량(요구량)과 메모를 확인해 주세요.
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
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--gray-500)', marginBottom: '4px' }}>수량 / 요구량</label>
                        <input 
                          type="text" 
                          className="input-field" 
                          style={{ padding: '6px 8px', fontSize: '12px', height: 'auto' }}
                          value={item.qty}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConfirmList(prev => prev.map(c => c.id === item.id ? { ...c, qty: val } : c));
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--gray-500)', marginBottom: '4px' }}>메모</label>
                        <input 
                          type="text" 
                          className="input-field" 
                          style={{ padding: '6px 8px', fontSize: '12px', height: 'auto' }}
                          value={item.memo}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConfirmList(prev => prev.map(c => c.id === item.id ? { ...c, memo: val } : c));
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
                {modalTab === 'add-item' ? '장바구니 추가' : '요청 발송'} ({confirmList.length}건)
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Shopping;
