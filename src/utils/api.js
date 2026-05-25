// Food Safety Korea API Utility

const API_KEY = 'sample'; // Can be replaced with actual key if needed
const SERVICE_ID = 'COOKRCP01';

export const fetchRecipes = async (startIdx = 1, endIdx = 15) => {
  try {
    const response = await fetch(`http://openapi.foodsafetykorea.go.kr/api/${API_KEY}/${SERVICE_ID}/json/${startIdx}/${endIdx}`);
    const data = await response.json();
    
    if (data && data[SERVICE_ID] && data[SERVICE_ID].row) {
      return data[SERVICE_ID].row.map(item => {
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
              actionImage: stepImg || null
            });
          }
        }

        return {
          id: item.RCP_SEQ,
          name: item.RCP_NM,
          ingredients: item.RCP_PARTS_DTLS,
          matchIngredients: item.RCP_PARTS_DTLS ? item.RCP_PARTS_DTLS.split(/[\s,\(\)\[\]]/).filter(s => s.length > 1) : [],
          difficulty: '보통',
          emoji: '🥘',
          imageBg: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
          mainImage: item.ATT_FILE_NO_MAIN || item.ATT_FILE_NO_MK || null,
          detailedSteps
        };
      });
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch recipes:', error);
    return [];
  }
};
