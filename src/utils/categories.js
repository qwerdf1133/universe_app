import {
  Carrot, Apple, Beef, Fish, Milk, Egg, Waves, Wheat, Package,
  Croissant, CupSoda, Soup, Flame, Droplet, Leaf, Snowflake, Box, Sparkles
} from 'lucide-react';

export const CATEGORIES = [
  { id: 'auto', name: '자동 설정', icon: Sparkles, defaultExpDays: null, keywords: [] },
  { id: 'veg', name: '채소', icon: Carrot, defaultExpDays: 7, keywords: ['상추', '배추', '양파', '당근', '감자', '브로콜리', '무', '오이', '호박', '가지', '버섯', '마늘', '파', '고추', '깻잎', '샐러드', '야채', '채소', '시금치', '부추', '양배추', '아스파라거스', '파프리카', '피망'] },
  { id: 'fruit', name: '과일', icon: Apple, defaultExpDays: 10, keywords: ['사과', '바나나', '딸기', '포도', '오렌지', '귤', '수박', '참외', '멜론', '복숭아', '자두', '체리', '블루베리', '토마토', '방울토마토', '감', '배', '석류', '자몽', '레몬', '라임', '망고', '파인애플', '키위', '과일'] },
  { id: 'meat', name: '육류', icon: Beef, defaultExpDays: 3, keywords: ['소고기', '돼지고기', '닭고기', '오리고기', '삼겹살', '목살', '갈비', '등심', '안심', '차돌박이', '닭가슴살', '베이컨', '양고기', '육류', '고기'] },
  { id: 'seafood', name: '수산물', icon: Fish, defaultExpDays: 2, keywords: ['생선', '새우', '게', '조개', '오징어', '고등어', '갈치', '조기', '굴', '전복', '낙지', '문어', '쭈꾸미', '명란', '연어', '참치', '회', '해산물', '수산물', '조개류'] },
  { id: 'dairy', name: '유제품', icon: Milk, defaultExpDays: 14, keywords: ['우유', '치즈', '요구르트', '요거트', '버터', '생크림', '크림치즈', '모짜렐라', '체다', '유제품'] },
  { id: 'egg', name: '달걀류', icon: Egg, defaultExpDays: 28, keywords: ['계란', '달걀', '메추리알', '오리알', '달걀류'] },
  { id: 'seaweed', name: '해조류', icon: Waves, defaultExpDays: 180, keywords: ['김', '미역', '다시마', '파래', '톳', '해조류'] },
  { id: 'grain', name: '곡류', icon: Wheat, defaultExpDays: 365, keywords: ['쌀', '현미', '보리', '밀', '귀리', '옥수수', '찹쌀', '잡곡', '흑미', '곡류'] },
  { id: 'processed', name: '가공식품', icon: Package, defaultExpDays: 180, keywords: ['라면', '햄', '소시지', '통조림', '시리얼', '스팸', '참치캔', '캔', '가공식품', '즉석밥', '햇반'] },
  { id: 'bakery', name: '빵·제과', icon: Croissant, defaultExpDays: 7, keywords: ['식빵', '케이크', '쿠키', '머핀', '크루아상', '베이글', '빵', '제과', '도넛', '마카롱'] },
  { id: 'drink', name: '음료', icon: CupSoda, defaultExpDays: 180, keywords: ['물', '주스', '커피', '차', '탄산음료', '두유', '콜라', '사이다', '음료', '맥주', '소주', '와인', '주류'] },
  { id: 'seasoning', name: '조미료', icon: Soup, defaultExpDays: 365, keywords: ['소금', '설탕', '식초', '고춧가루', '조미료', '참기름', '들기름', '식용유', '올리브유'] },
  { id: 'fermented', name: '발효식품', icon: Flame, defaultExpDays: 180, keywords: ['김치', '된장', '청국장', '낫토', '간장', '고추장', '쌈장', '발효식품', '젓갈'] },
  { id: 'sauce', name: '소스류', icon: Droplet, defaultExpDays: 180, keywords: ['케첩', '마요네즈', '머스타드', '핫소스', '소스', '드레싱', '굴소스', '돈까스소스', '소스류'] },
  { id: 'spice', name: '향신료', icon: Leaf, defaultExpDays: 730, keywords: ['후추', '계피', '바질', '오레가노', '로즈마리', '파슬리', '향신료'] },
  { id: 'frozen', name: '냉동식품', icon: Snowflake, defaultExpDays: 180, keywords: ['냉동만두', '냉동피자', '냉동볶음밥', '냉동육류', '냉동', '아이스크림'] },
  { id: 'other', name: '기타', icon: Box, defaultExpDays: null, keywords: [] },
];

export const detectCategoryByFoodName = (name) => {
  const n = name.trim().toLowerCase();
  if (!n) return CATEGORIES[0];
  for (let i = 1; i < CATEGORIES.length - 1; i++) {
    const cat = CATEGORIES[i];
    if (cat.keywords.some(keyword => n.includes(keyword))) {
      return cat;
    }
  }
  return CATEGORIES.find(c => c.id === 'other') || CATEGORIES[CATEGORIES.length - 1];
};

export const getAutoExpiryDate = (name, pDateStr) => {
  const pDate = pDateStr ? new Date(pDateStr) : new Date();
  const matchedCat = detectCategoryByFoodName(name);
  const expDays = (matchedCat && matchedCat.defaultExpDays !== null) ? matchedCat.defaultExpDays : 7;
  pDate.setDate(pDate.getDate() + expDays);
  return pDate.toISOString().split('T')[0];
};

export const getBaseIngredientName = (name) => {
  if (!name) return '';
  let clean = name.trim();

  // 1. Remove parentheses and bracket metadata (e.g. 소고기(국거리용) -> 소고기)
  clean = clean.replace(/\([^)]*\)/g, '');
  clean = clean.replace(/\[[^\]]*\]/g, '');

  // 2. Remove trailing numbers/fractions and unit suffixes (e.g., 올리브유 30g, 양파 1/2개)
  clean = clean.replace(/[\s\d\/\.\~\-]+(?:g|kg|ml|l|L|개|입|마리|봉지?|대|뿌리|쪽|알|통|줌|꼬집|큰술|작은술|컵|숟가락|스푼|Ts|ts|T|t|팩|캔|병|조각|장|공기|인분)?$/gi, '');

  // 3. Remove trailing standalone units or quantities (e.g., 대파 약간, 소금 적당량)
  clean = clean.replace(/\s*(?:g|kg|ml|l|L|개|입|마리|봉지?|대|뿌리|쪽|알|통|줌|꼬집|큰술|작은술|컵|숟가락|스푼|Ts|ts|T|t|팩|캔|병|조각|장|공기|인분|약간|적당량|적당히|조금|취향껏|한꼬집)$/gi, '');

  // 4. Remove trailing numbers (e.g., 올리브유 30)
  clean = clean.replace(/\s+[\d\/\.\~\-]+$/g, '');

  return clean.trim();
};

export const isIngredientMatched = (ownedName, recipeName) => {
  if (!ownedName || !recipeName) return false;
  const ownedBase = getBaseIngredientName(ownedName).toLowerCase().replace(/\s+/g, '');
  const recipeBase = getBaseIngredientName(recipeName).toLowerCase().replace(/\s+/g, '');
  if (!ownedBase || !recipeBase) return false;
  return ownedBase.includes(recipeBase) || recipeBase.includes(ownedBase);
};

export const getFoodIcon = (name, category) => {
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

export const parseIngredientsList = (ingredientsStr) => {
  if (!ingredientsStr) return [];
  // Split by comma or newline
  const rawItems = ingredientsStr.split(/,|\n/);
  const result = [];
  for (let raw of rawItems) {
    let text = raw.trim();
    if (!text) continue;

    // Remove headers like ●주재료 :, ●양념장 :, [1인분], ·, *, etc.
    text = text.replace(/●[^:]+:/g, '');
    text = text.replace(/\[[^\]]+\]/g, '');
    text = text.replace(/^[·\*\-\s:\+]+/g, '');
    text = text.trim();
    if (!text) continue;

    // Check if the text is just a category separator or header
    if (text.match(/^(주재료|부재료|양념|소스|밑간|고명|양념장|재료|준비물)$/)) {
      continue;
    }

    // Match name and quantity
    const quantMatch = text.match(/^(.*?)\s+(\d.*|약간.*|적당량.*|한꼬집.*|조금.*|취향껏.*|적당히.*)$/);
    if (quantMatch) {
      const cleanName = quantMatch[1].trim();
      const quantity = quantMatch[2].trim();
      if (cleanName) {
        result.push({
          cleanName,
          quantity,
          fullName: `${cleanName} ${quantity}`
        });
        continue;
      }
    }

    const digitMatch = text.match(/^(.*?)(\d.*)$/);
    if (digitMatch) {
      const cleanName = digitMatch[1].trim();
      const quantity = digitMatch[2].trim();
      if (cleanName) {
        result.push({
          cleanName,
          quantity,
          fullName: `${cleanName} ${quantity}`
        });
        continue;
      }
    }

    result.push({
      cleanName: text,
      quantity: '',
      fullName: text
    });
  }
  return result;
};
