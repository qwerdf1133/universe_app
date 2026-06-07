import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { fetchRecipes } from '../utils/api';
import { getHouseholdData, setHouseholdData } from '../utils/household';
import { getFoodIcon, isIngredientMatched } from '../utils/categories';

const RECIPES = [
  {
    id: 'r1',
    name: '돼지고기 김치찌개',
    ingredients: '김치 1/4포기, 돼지고기 200g, 두부 1/2모, 대파 1대, 마늘 1T, 고춧가루 2T, 국간장 1T',
    matchIngredients: ['김치', '돼지고기', '삼겹살', '두부', '대파', '파', '마늘', '고춧가루', '국간장', '간장'],
    recipe: [
      '1. 냄비에 식용유를 약간 두르고 돼지고기와 다진 마늘을 넣고 볶습니다.',
      '2. 돼지고기 표면이 익으면 썰어둔 김치를 넣고 함께 충분히 볶아줍니다.',
      '3. 물 또는 육수를 재료가 잠길 정도로 붓고 끓입니다.',
      '4. 끓어오르면 두부, 대파를 썰어 넣고 고춧가루와 국간장으로 간을 하여 한소끔 더 끓여 완성합니다.'
    ]
  },
  {
    id: 'r2',
    name: '차돌 된장찌개',
    ingredients: '된장 2T, 두부 1/2모, 감자 1개, 양파 1/2개, 대파 1/2대, 마늘 1T, 차돌박이 100g',
    matchIngredients: ['된장', '두부', '감자', '양파', '대파', '파', '마늘', '차돌박이', '고기', '돼지고기'],
    recipe: [
      '1. 뚝배기에 차돌박이를 넣고 살짝 볶아 기름을 냅니다.',
      '2. 물을 붓고 된장을 잘 풀어준 뒤, 썰어둔 감자와 양파를 먼저 넣고 끓입니다.',
      '3. 재료가 익으면 두부와 다진 마늘을 넣습니다.',
      '4. 송송 썬 대파를 넣고 한소끔 더 끓여 완성합니다.'
    ]
  },
  {
    id: 'r3',
    name: '매콤 제육볶음',
    ingredients: '돼지고기 300g, 양파 1/2개, 대파 1대, 고추장 2T, 고춧가루 1T, 간장 1T, 설탕 1T, 마늘 1T, 참기름 1T',
    matchIngredients: ['돼지고기', '삼겹살', '고기', '양파', '대파', '파', '고추장', '고춧가루', '간장', '설탕', '마늘', '참기름'],
    recipe: [
      '1. 돼지고기를 먹기 좋은 크기로 썬 후 고추장, 고춧가루, 간장, 설탕, 다진 마늘을 섞어 양념장을 만들어 버무려 둡니다.',
      '2. 양파와 대파는 큼직하게 썰어 준비합니다.',
      '3. 달궈진 팬에 양념한 고기를 먼저 넣고 중불에서 볶아줍니다.',
      '4. 고기가 거의 익어가면 양파와 대파를 넣고 볶다가 마지막에 참기름을 둘러 마무리합니다.'
    ]
  },
  {
    id: 'r4',
    name: '파송송 계란말이',
    ingredients: '계란 4알, 대파 1/2대, 소금 1/2t, 식용유 2T, 참기름 1t',
    matchIngredients: ['계란', '달걀', '대파', '파', '소금', '식용유', '참기름'],
    recipe: [
      '1. 볼에 계란 4알을 깨뜨려 넣고 소금을 가볍게 넣어 잘 풀어줍니다.',
      '2. 대파를 아주 잘게 다져 계란물에 섞어줍니다.',
      '3. 달궈진 팬에 식용유를 두르고 계란물종류를 조금씩 부어가며 얇게 폅니다.',
      '4. 가장자리가 익기 시작하면 끝에서부터 돌돌 말아가며 계란말이를 완성합니다.'
    ]
  },
  {
    id: 'r5',
    name: '국물 떡볶이',
    ingredients: '떡볶이 떡 200g, 어묵 2장, 대파 1대, 고추장 2T, 설탕 1.5T, 간장 1T, 물 2컵',
    matchIngredients: ['떡', '어묵', '대파', '파', '고추장', '설탕', '간장'],
    recipe: [
      '1. 냄비에 물 2컵을 붓고 고추장, 설탕, 간장을 잘 풀어 소스를 끓입니다.',
      '2. 끓어오르면 씻어둔 떡과 한 입 크기로 썬 어묵을 넣습니다.',
      '3. 떡이 말랑해지고 양념이 적당히 졸아들 때까지 끓여줍니다.',
      '4. 마지막으로 대파를 어긋 썰어 넣고 조금 더 끓여 완성합니다.'
    ]
  },
  {
    id: 'r6',
    name: '백종원 간장계란밥',
    ingredients: '햇반 1개, 계란 1알, 간장 1T, 참기름 1T, 식용유 1T',
    matchIngredients: ['햇반', '밥', '계란', '달걀', '간장', '참기름', '식용유'],
    recipe: [
      '1. 팬에 식용유를 두르고 계란 1알을 깨서 서니사이드업 프라이를 만들어줍니다.',
      '2. 따뜻하게 데운 햇반을 그릇에 예쁘게 담아줍니다.',
      '3. 밥 위에 계란 프라이를 얹고, 간장 1T와 고소한 참기름 1T를 뿌려줍니다.',
      '4. 기호에 따라 으깨어가며 잘 비벼 맛있게 먹습니다.'
    ]
  }
];



const Home = () => {
  const navigate = useNavigate();
  const [expiringItems, setExpiringItems] = useState([]);
  const [recommendedRecipes, setRecommendedRecipes] = useState([]);

  const loadRecommendedRecipes = async (list) => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const expiring = list.filter(item => {
      if (!item.expDate) return false; // 유통기한 미지정 항목 제외
      const exp = new Date(item.expDate);
      if (isNaN(exp.getTime())) return false;
      exp.setHours(0,0,0,0);
      const diffTime = exp - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    });

    let apiRecipes = await fetchRecipes(1, 1000);
    
    if (!apiRecipes || apiRecipes.length === 0) {
      apiRecipes = RECIPES;
    }

    const scored = apiRecipes.map(recipe => {
      // parsedIngredients를 단일 기준으로 사용: 없으면 matchIngredients로 대체
      const parsedIngredients = (recipe.parsedIngredients && recipe.parsedIngredients.length > 0)
        ? recipe.parsedIngredients
        : (recipe.matchIngredients || []).map(m => ({ cleanName: m, quantity: '', fullName: m }));

      let ownedMatchCount = 0;
      let expiringMatchCount = 0;

      // 레시피 재료 기준으로 순회 (중복 카운팅 방지)
      parsedIngredients.forEach(p => {
        if (list.some(item => isIngredientMatched(item.name, p.cleanName))) {
          ownedMatchCount++;
          if (expiring.some(item => isIngredientMatched(item.name, p.cleanName))) {
            expiringMatchCount++;
          }
        }
      });
      
      const score = (expiringMatchCount * 100) + ownedMatchCount;
      
      return {
        ...recipe,
        matchCount: ownedMatchCount,
        expiringMatchCount,
        score
      };
    });

    scored.sort((a, b) => b.score - a.score);
    setRecommendedRecipes(scored.slice(0, 5));
  };

  const handleDeleteExpired = () => {
    let list = getHouseholdData('ingredients');
    if (!list || list.length === 0) return;

    const today = new Date();
    today.setHours(0,0,0,0);

    const updated = list.filter(item => {
      if (!item.expDate) return true; // 유통기한 미지정 항목은 유지
      const expDate = new Date(item.expDate);
      if (isNaN(expDate.getTime())) return true;
      const diffDays = Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0;
    });

    setHouseholdData('ingredients', updated);
    alert('유통기한이 만료된 식재료가 삭제되었습니다.');

    const expiring = updated.filter(item => {
      if (!item.expDate) return false; // 유통기한 미지정 항목 제외
      const exp = new Date(item.expDate);
      if (isNaN(exp.getTime())) return false;
      exp.setHours(0,0,0,0);
      const diffTime = exp - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    });
    setExpiringItems(expiring);

    loadRecommendedRecipes(updated);
  };

  useEffect(() => {
    const list = getHouseholdData('ingredients', []);

    const today = new Date();
    today.setHours(0,0,0,0);

    const expiring = list.filter(item => {
      if (!item.expDate) return false; // 유통기한 미지정 항목 제외
      const exp = new Date(item.expDate);
      if (isNaN(exp.getTime())) return false;
      exp.setHours(0,0,0,0);
      const diffTime = exp - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    });
    setExpiringItems(expiring);

    loadRecommendedRecipes(list);
  }, []);

  return (
    <div className="page-container">
      <Header title="우리집 냉장고 홈" />
      <div className="content" style={{ paddingBottom: '80px', paddingTop: '10px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px', marginTop: '10px' }}>
          <img src="/favicon.svg" alt="우리집 냉장고 로고" width="50" height="50" style={{ marginBottom: '8px' }} />
        </div>

        <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-black)' }}>
          <AlertTriangle size={18} color="red" /> 유통기한 임박 식재료
        </h2>

        {expiringItems.length === 0 ? (
          <div style={{ padding: '24px 20px', background: '#f9fafb', border: '1px solid var(--gray-200)', borderRadius: '12px', color: 'var(--gray-500)', textAlign: 'center', fontSize: '13px', marginBottom: '32px' }}>
            유통기한 임박 식재료가 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
            {expiringItems.map(item => {
              const expDate = item.expDate ? new Date(item.expDate) : null;
              const diffDays = expDate && !isNaN(expDate.getTime()) ? Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
              const isExpired = diffDays !== null && diffDays < 0;
              return (
                <div 
                  key={item.id} 
                  style={{ 
                    padding: '12px 14px', 
                    background: isExpired ? '#fff5f5' : '#fff', 
                    border: isExpired ? '1px solid #feb2b2' : '1px solid var(--gray-200)', 
                    borderRadius: '12px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Food Emoji Icon */}
                    <div style={{ fontSize: '20px', background: '#f3f4f6', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {getFoodIcon(item.name, item.category)}
                    </div>
                    
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold', color: isExpired ? '#c53030' : 'var(--text-black)', fontSize: '14px' }}>{item.name}</span>
                        <span style={{ fontSize: '9px', background: isExpired ? '#fed7d7' : '#e0f2ec', color: isExpired ? '#9b2c2c' : 'var(--primary-color)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{item.storageLocation}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: isExpired ? '#e53e3e' : 'var(--gray-500)', marginTop: '2px' }}>
                        유통기한: {item.expDate ? item.expDate.split('T')[0] : '미지정'}
                        {diffDays !== null && (
                          <span style={{ fontWeight: 'bold', marginLeft: '6px', color: isExpired ? '#e53e3e' : 'red' }}>
                            {isExpired ? '유통기한 만료!' : `(${diffDays}일 남음)`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Expired Ingredient Delete Button */}
            {expiringItems.some(item => {
              if (!item.expDate) return false;
              const d = new Date(item.expDate);
              return !isNaN(d.getTime()) && Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24)) < 0;
            }) && (
              <button
                onClick={handleDeleteExpired}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px',
                  background: '#fff5f5',
                  border: '1px solid #feb2b2',
                  borderRadius: '12px',
                  color: '#e53e3e',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginTop: '6px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fed7d7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fff5f5';
                }}
              >
                <Trash2 size={16} color="#e53e3e" />
                유통기한 만료 식재료 삭제하기
              </button>
            )}
          </div>
        )}
        
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-black)' }}>오늘의 추천 요리</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {recommendedRecipes.map(recipe => (
            <div 
              key={recipe.id} 
              onClick={() => navigate('/cooking', { state: { recipe } })}
              style={{
                padding: '12px 14px',
                background: '#FFFFFF',
                border: '1px solid var(--gray-200)',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.01)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.01)';
              }}
            >
              {/* Left Side: Recipe image */}
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                background: recipe.imageBg || 'linear-gradient(135deg, #e0f2ec 0%, #379271 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                flexShrink: 0,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                overflow: 'hidden'
              }}>
                {recipe.mainImage ? (
                  <img src={recipe.mainImage} alt={recipe.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  recipe.emoji || '🥘'
                )}
              </div>

              {/* Center: Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '14.5px', color: 'var(--text-black)', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {recipe.name}
                </h3>
                <p style={{ fontSize: '11.5px', color: 'var(--gray-500)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  재료: {recipe.ingredients}
                </p>
              </div>

              {/* Right: Badge */}
              <div style={{ 
                fontSize: '10.5px', 
                background: recipe.matchCount > 0 ? '#e0f2ec' : '#f3f4f6', 
                color: recipe.matchCount > 0 ? 'var(--primary-color)' : 'var(--gray-500)', 
                padding: '4px 8px', 
                borderRadius: '6px', 
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                재료 {recipe.matchCount}개 보유
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Home;
