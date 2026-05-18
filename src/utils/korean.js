/**
 * 한국어 조사 (을/를, 이/가 등)를 단어의 받침 유무에 따라 알맞게 선택하여 반환합니다.
 * @param {string} word - 단어 (예: '김치찌개', '간장계란밥')
 * @param {string} choice1 - 받침이 있을 때의 조사 (기본값: '을')
 * @param {string} choice2 - 받침이 없을 때의 조사 (기본값: '를')
 * @returns {string} 단어와 조사가 합쳐진 문자열 또는 조사만 반환
 */
export const getPostposition = (word, choice1 = '을', choice2 = '를') => {
  if (!word) return '';
  const lastChar = word.charCodeAt(word.length - 1);
  
  // 한글 유니코드 영역(0xAC00 ~ 0xD7A3)을 벗어난 경우
  if (lastChar < 0xAC00 || lastChar > 0xD7A3) {
    return `${word}${choice2}`; // 기본적으로 choice2 붙여 반환
  }
  
  // 받침 유무 판별: (유니코드 값 - 0xAC00) % 28 > 0 이면 받침이 있음
  const hasBatchim = (lastChar - 0xAC00) % 28 > 0;
  return hasBatchim ? `${word}${choice1}` : `${word}${choice2}`;
};
