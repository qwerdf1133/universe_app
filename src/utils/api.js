// Food Safety Korea API Utility
import { parseIngredientsList } from './categories';

const API_KEY = '2769a878073d4c44a540'; 
const SERVICE_ID = 'COOKRCP01';

const sanitizeImageUrl = (url) => {
  if (!url) return null;
  return url.replace(/^http:\/\//i, 'https://');
};

let cachedRecipes = null;

export const fetchRecipes = async (startIdx = 1, endIdx = 20, recipeName = '', category = '') => {
  try {
    if (!cachedRecipes) {
      const url = `https://openapi.foodsafetykorea.go.kr/api/${API_KEY}/${SERVICE_ID}/json/1/1000`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data[SERVICE_ID] && data[SERVICE_ID].row) {
        cachedRecipes = data[SERVICE_ID].row.map(item => {
          const detailedSteps = [];
          for (let i = 1; i <= 20; i++) {
            const stepNum = String(i).padStart(2, '0');
            const stepText = item[`MANUAL${stepNum}`];
            const stepImg = item[`MANUAL_IMG${stepNum}`];
            if (stepText && stepText.trim()) {
              let actionIcon = '🍳';
              if (i === 1) actionIcon = '🔪';
              else if (stepText.includes('볶') || stepText.includes('튀')) actionIcon = '🍳';
              else if (stepText.includes('끓') || stepText.includes('삶') || stepText.includes('탕') || stepText.includes('국')) actionIcon = '🍲';
              else if (stepText.includes('썰') || stepText.includes('자르') || stepText.includes('채')) actionIcon = '🔪';
              else if (stepText.includes('물') || stepText.includes('육수')) actionIcon = '💧';
              else if (stepText.includes('그릇') || stepText.includes('접시') || stepText.includes('담')) actionIcon = '🍽️';
              else if (stepText.includes('양념') || stepText.includes('소금') || stepText.includes('설탕')) actionIcon = '🧂';
              else if (stepText.includes('섞') || stepText.includes('버무')) actionIcon = '🥣';

              const colors = [
                'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                'linear-gradient(135deg, #ffedd5 0%, #f97316 100%)',
                'linear-gradient(135deg, #dcfce7 0%, #22c55e 100%)',
                'linear-gradient(135deg, #ecfeff 0%, #06b6d4 100%)',
                'linear-gradient(135deg, #fef3c7 0%, #f59e0b 100%)',
                'linear-gradient(135deg, #fee2e2 0%, #ef4444 100%)'
              ];
              const actionBg = colors[(i - 1) % colors.length];

              detailedSteps.push({
                stepText: stepText.trim(),
                actionName: `단계 ${i}`,
                actionIcon,
                actionBg,
                actionImage: sanitizeImageUrl(stepImg)
              });
            }
          }

          const parsed = item.RCP_PARTS_DTLS ? parseIngredientsList(item.RCP_PARTS_DTLS) : [];

          return {
            id: item.RCP_SEQ,
            name: item.RCP_NM,
            category: item.RCP_PAT2 || '기타',
            weight: item.INFO_WGT || '',
            hashTag: item.HASH_TAG || '',
            ingredients: item.RCP_PARTS_DTLS,
            parsedIngredients: parsed,
            matchIngredients: parsed.map(p => p.cleanName),
            difficulty: '보통',
            emoji: '🥘',
            imageBg: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
            mainImage: sanitizeImageUrl(item.ATT_FILE_NO_MAIN || item.ATT_FILE_NO_MK),
            detailedSteps
          };
        });
      } else {
        cachedRecipes = [];
      }
    }

    // Local Filtering
    let filtered = cachedRecipes;

    if (category && category !== '전체') {
      filtered = filtered.filter(item => {
        const n = item.name.toLowerCase();
        const c = item.category;
        const i = item.ingredients ? item.ingredients.toLowerCase() : '';
        
        switch (category) {
          case '밥': return c === '밥' || n.includes('밥') || n.includes('비빔') || n.includes('볶음밥') || n.includes('김밥');
          case '국': return c === '국&찌개' && (n.includes('국') || n.includes('탕') || n.includes('전골'));
          case '찌개': return c === '국&찌개' && n.includes('찌개');
          case '면': return n.includes('면') || n.includes('국수') || n.includes('우동') || n.includes('파스타') || n.includes('스파게티') || n.includes('짬뽕') || n.includes('짜장');
          case '볶음': return n.includes('볶음') || n.includes('잡채') || n.includes('마파');
          case '튀김': return n.includes('튀김') || n.includes('카츠') || n.includes('치킨') || n.includes('탕수육') || n.includes('강정');
          case '고기': return n.includes('고기') || n.includes('갈비') || n.includes('스테이크') || n.includes('삼겹살') || n.includes('목살') || n.includes('제육') || n.includes('불고기') || i.includes('돼지고기') || i.includes('소고기') || i.includes('닭고기');
          case '생선': return n.includes('생선') || n.includes('고등어') || n.includes('연어') || n.includes('갈치') || n.includes('오징어') || n.includes('새우') || n.includes('해물') || i.includes('생선') || i.includes('오징어') || i.includes('새우');
          case '채소': return n.includes('나물') || n.includes('무침') || n.includes('샐러드') || n.includes('김치') || i.includes('시금치') || i.includes('배추');
          case '디저트': return c === '후식' || n.includes('케이크') || n.includes('빵') || n.includes('쿠키') || n.includes('빙수') || n.includes('과일');
          case '음료': return c === '후식' && (n.includes('주스') || n.includes('차') || n.includes('에이드') || n.includes('스무디') || n.includes('음료'));
          case '분식': return n.includes('떡볶이') || n.includes('순대') || n.includes('튀김') || n.includes('어묵') || n.includes('오뎅') || n.includes('김밥') || n.includes('만두');
          default: return c === category || n.includes(category);
        }
      });
    }

    if (recipeName) {
      const search = recipeName.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(search) || 
        (item.ingredients && item.ingredients.toLowerCase().includes(search)) ||
        (item.hashTag && item.hashTag.toLowerCase().includes(search))
      );
    }

    // Pagination
    return filtered.slice(startIdx - 1, endIdx);

  } catch (error) {
    console.error('Failed to fetch recipes:', error);
    return [];
  }
};
