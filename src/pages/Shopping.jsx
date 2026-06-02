import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Plus, X, CheckSquare, Square, Trash2, User, Copy, ArrowRight, Beef, Carrot, Milk, Snowflake, Droplet, Box, Sparkles, ShoppingBag, Send } from 'lucide-react';

const CATEGORIES = [
  { id: 'auto', name: '자동 설정', icon: Sparkles },
  { id: 'meat', name: '육류', icon: Beef },
  { id: 'veg', name: '채소', icon: Carrot },
  { id: 'dairy', name: '유제품', icon: Milk },
  { id: 'frozen', name: '냉동식품', icon: Snowflake },
  { id: 'sauce', name: '소스/양념', icon: Droplet },
];

const INITIAL_SHOPPING = [];

// Initial Member Request Dummy Data
const INITIAL_MEMBER_REQUESTS = [];

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

const Shopping = () => {
  const [activeTab, setActiveTab] = useState('my'); // 'my' or 'member'
  const [shoppingList, setShoppingList] = useState([]);
  const [memberRequests, setMemberRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('add-item'); // 'add-item' or 'request-item'

  // Simplified Add Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]); // '자동 설정' is default!
  const [memo, setMemo] = useState('');

  // Load Initial Lists
  useEffect(() => {
    // 1. My Shopping List
    const storedShopping = localStorage.getItem('shopping-list');
    if (!storedShopping) {
      localStorage.setItem('shopping-list', JSON.stringify(INITIAL_SHOPPING));
      setShoppingList(INITIAL_SHOPPING);
    } else {
      setShoppingList(JSON.parse(storedShopping));
    }

    // 2. Member Requests List
    const storedRequests = localStorage.getItem('member-requests');
    if (!storedRequests) {
      localStorage.setItem('member-requests', JSON.stringify(INITIAL_MEMBER_REQUESTS));
      setMemberRequests(INITIAL_MEMBER_REQUESTS);
    } else {
      setMemberRequests(JSON.parse(storedRequests));
    }
  }, []);

  const saveShoppingList = (newList) => {
    setShoppingList(newList);
    localStorage.setItem('shopping-list', JSON.stringify(newList));
  };

  const saveMemberRequests = (newList) => {
    setMemberRequests(newList);
    localStorage.setItem('member-requests', JSON.stringify(newList));
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
      const storedIngredients = localStorage.getItem('ingredients');
      let ingredientsList = storedIngredients ? JSON.parse(storedIngredients) : [];

      checkedItems.forEach(item => {
        const todayStr = new Date().toISOString().split('T')[0];
        
        // Auto Category Identification
        let finalCat = item.category;
        if (item.category === '자동 설정' || !item.category) {
          const n = item.name.toLowerCase();
          if (n.includes('삼겹살') || n.includes('고기') || n.includes('목살') || n.includes('소고기') || n.includes('닭고기')) finalCat = '육류';
          else if (n.includes('마늘') || n.includes('양파') || n.includes('파') || n.includes('상추') || n.includes('깻잎')) finalCat = '채소';
          else if (n.includes('우유') || n.includes('요거트') || n.includes('치즈')) finalCat = '유제품';
          else if (n.includes('만두') || n.includes('피자') || n.includes('튀김') || n.includes('냉동')) finalCat = '냉동식품';
          else if (n.includes('소스') || n.includes('간장') || n.includes('쌈장') || n.includes('양념')) finalCat = '소스/양념';
          else finalCat = '기타';
        }

        // Auto Storage Location
        let storage = '냉장';
        if (finalCat === '냉동식품') storage = '냉동';
        else if (finalCat === '소스/양념' || finalCat === '기타') storage = '실온';

        // Auto Expiry Date calculation
        const autoExp = getAutoExpiryDate(item.name, todayStr);

        ingredientsList.push({
          id: Date.now() + Math.random(),
          name: item.name,
          category: finalCat,
          purchaseDate: todayStr,
          expDate: new Date(autoExp).toISOString(),
          storageLocation: storage,
          memo: item.memo || '장보기 구매 완료',
          isFavorite: false
        });
      });

      localStorage.setItem('ingredients', JSON.stringify(ingredientsList));
      alert(`구매 완료된 식재료 ${checkedItems.length}건이 냉장고 식재료 목록에 실시간 연동/추가되었습니다!`);
    }
  };

  // Add Item Manually or Create Member Request
  const handleAddItem = () => {
    if (!name.trim()) {
      alert('식재료 이름을 입력해 주세요.');
      return;
    }

    let finalCat = category ? category.name : '기타';
    if (!category || category.id === 'auto') {
      const n = name.toLowerCase();
      if (n.includes('삼겹살') || n.includes('고기') || n.includes('목살') || n.includes('소고기') || n.includes('닭고기')) finalCat = '육류';
      else if (n.includes('마늘') || n.includes('양파') || n.includes('파') || n.includes('상추') || n.includes('깻잎')) finalCat = '채소';
      else if (n.includes('우유') || n.includes('요거트') || n.includes('치즈')) finalCat = '유제품';
      else if (n.includes('만두') || n.includes('피자') || n.includes('튀김') || n.includes('냉동')) finalCat = '냉동식품';
      else if (n.includes('소스') || n.includes('간장') || n.includes('쌈장') || n.includes('양념')) finalCat = '소스/양념';
      else finalCat = '기타';
    }

    if (modalTab === 'add-item') {
      // Add to My Shopping List
      const newItem = {
        id: Date.now(),
        name,
        category: finalCat,
        memo,
        checked: false
      };
      const updated = [...shoppingList, newItem];
      saveShoppingList(updated);
      alert(`"${name}"이(가) 내 장보기 목록에 추가되었습니다.`);
    } else {
      // Add to Member Requests List (requested by currentUser with dynamic avatar)
      const currentUserStr = localStorage.getItem('currentUser');
      const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
      const nickname = currentUser ? currentUser.nickname : '나';

      const avatars = ['🐰', '🐱', '🦊', '🐻', '🐼', '🦁', '🐸', '🐨', '🐯', '😎'];
      const charCodeSum = nickname.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const avatar = avatars[charCodeSum % avatars.length];

      const newRequest = {
        id: Date.now(),
        name,
        category: finalCat,
        qty: memo || '1개',
        checked: false,
        requester: nickname,
        avatar: avatar
      };
      const updated = [...memberRequests, newRequest];
      saveMemberRequests(updated);
      alert(`"${name}" 장보기 요청이 등록되었습니다.`);
    }

    // Reset Form
    setName('');
    setCategory(CATEGORIES[0]);
    setMemo('');
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
            onClick={() => setIsModalOpen(false)}
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
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
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
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>식재료 이름</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="예: 계란, 대파, 두부" 
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
                        onClick={() => setCategory(cat)}
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

              {/* Submit Buttons */}
              <button 
                className="btn-primary" 
                style={{ 
                  marginTop: '16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px' 
                }} 
                onClick={handleAddItem}
              >
                {modalTab === 'add-item' ? <ShoppingBag size={18} /> : <Send size={18} />}
                {modalTab === 'add-item' ? '장바구니 추가' : '구성원 요청 발송'}
              </button>
            </div>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
};

export default Shopping;
