// Food Safety Korea API Utility

const API_KEY = 'sample'; // Can be replaced with actual key if needed
const SERVICE_ID = 'COOKRCP01';

export const fetchRecipes = async (startIdx = 1, endIdx = 15) => {
  try {
    const response = await fetch(`http://openapi.foodsafetykorea.go.kr/api/${API_KEY}/${SERVICE_ID}/json/${startIdx}/${endIdx}`);
    const data = await response.json();
    
    if (data && data[SERVICE_ID] && data[SERVICE_ID].row) {
      return data[SERVICE_ID].row.map(item => ({
        id: item.RCP_SEQ,
        name: item.RCP_NM,
        ingredients: item.RCP_PARTS_DTLS,
        // matchIngredients can be parsed from RCP_PARTS_DTLS, but we'll extract nouns roughly or just use name & parts
        matchIngredients: item.RCP_PARTS_DTLS.split(/[\s,\(\)\[\]]/).filter(s => s.length > 1),
        difficulty: '보통', // API doesn't provide difficulty natively in a simple format, defaulting to '보통'
        emoji: '🥘', // Default emoji, though we will use main image
        imageBg: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
        mainImage: item.ATT_FILE_NO_MAIN || item.ATT_FILE_NO_MK, // Main photo
        detailedSteps: [
          { stepText: item.MANUAL01, actionIcon: '🔪', actionBg: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)', actionImage: item.MANUAL_IMG01 },
          { stepText: item.MANUAL02, actionIcon: '🥣', actionBg: 'linear-gradient(135deg, #ffedd5 0%, #f97316 100%)', actionImage: item.MANUAL_IMG02 },
          { stepText: item.MANUAL03, actionIcon: '🍳', actionBg: 'linear-gradient(135deg, #dcfce7 0%, #22c55e 100%)', actionImage: item.MANUAL_IMG03 },
          { stepText: item.MANUAL04, actionIcon: '🔥', actionBg: 'linear-gradient(135deg, #ecfeff 0%, #06b6d4 100%)', actionImage: item.MANUAL_IMG04 },
          { stepText: item.MANUAL05, actionIcon: '🧂', actionBg: 'linear-gradient(135deg, #fef3c7 0%, #f59e0b 100%)', actionImage: item.MANUAL_IMG05 },
          { stepText: item.MANUAL06, actionIcon: '🍲', actionBg: 'linear-gradient(135deg, #fee2e2 0%, #ef4444 100%)', actionImage: item.MANUAL_IMG06 }
        ].filter(step => step.stepText) // filter out empty steps
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch recipes:', error);
    return [];
  }
};
