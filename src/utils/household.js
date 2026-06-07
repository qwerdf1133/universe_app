import { saveHouseholdDataInFirebase } from './firebase';

/**
 * 가구 공유 데이터 접근 유틸리티
 * 모든 식재료, 장보기, 구성원 요청 데이터는 가구 코드 단위로 공유됩니다.
 */

/**
 * 현재 로그인한 사용자의 가구 코드를 반환합니다.
 */
export const getHouseholdCode = () => {
  const sessionStr = localStorage.getItem('currentUser');
  if (!sessionStr) return null;

  const session = JSON.parse(sessionStr);
  const usersStr = localStorage.getItem('users');
  if (!usersStr) return null;

  const users = JSON.parse(usersStr);
  const fullUser = users.find(u => u.id === session.id);
  return fullUser?.householdCode || null;
};

/**
 * 현재 로그인한 사용자의 전체 정보를 반환합니다.
 */
export const getCurrentUserFull = () => {
  const sessionStr = localStorage.getItem('currentUser');
  if (!sessionStr) return null;

  const session = JSON.parse(sessionStr);
  const usersStr = localStorage.getItem('users');
  if (!usersStr) return session;

  const users = JSON.parse(usersStr);
  const fullUser = users.find(u => u.id === session.id);
  return fullUser ? { ...session, ...fullUser } : session;
};

/**
 * 가구 코드가 포함된 localStorage 키를 반환합니다.
 * @param {string} key - 'ingredients' | 'shopping-list' | 'member-requests'
 */
export const getHouseholdKey = (key) => {
  const code = getHouseholdCode();
  if (!code) return key; // 가구 코드 없으면 개인 키 사용 (fallback)
  return `${key}_${code}`;
};

/**
 * 가구 공유 데이터를 읽습니다.
 * @param {string} key - 데이터 키
 * @param {any} defaultValue - 기본값 (없을 경우)
 */
export const getHouseholdData = (key, defaultValue = []) => {
  const storageKey = getHouseholdKey(key);
  const stored = localStorage.getItem(storageKey);
  if (stored === null) return defaultValue;
  try {
    return JSON.parse(stored);
  } catch {
    return defaultValue;
  }
};


/**
 * 가구 공유 데이터를 씁니다.
 * @param {string} key - 데이터 키
 * @param {any} data - 저장할 데이터
 */
export const setHouseholdData = (key, data) => {
  const storageKey = getHouseholdKey(key);
  localStorage.setItem(storageKey, JSON.stringify(data));

  // Firebase Firestore 백그라운드 동기화
  const user = getCurrentUserFull();
  if (user && user.id) {
    const code = user.householdCode;
    const syncKey = code || `user_${user.id}`;
    saveHouseholdDataInFirebase(syncKey, key, data).catch(err => {
      console.error(`Firebase Firestore sync failed for key "${key}":`, err);
    });
  }
};

/**
 * 현재 로그인한 사용자가 가구 관리자(가구 생성자)인지 확인합니다.
 */
export const isAdmin = () => {
  const user = getCurrentUserFull();
  return user?.householdType === '가구 생성';
};

/**
 * 현재 가구의 모든 구성원을 반환합니다.
 */
export const getHouseholdMembers = () => {
  const code = getHouseholdCode();
  if (!code) return [];

  const usersStr = localStorage.getItem('users');
  if (!usersStr) return [];

  const users = JSON.parse(usersStr);
  return users.filter(u => u.householdCode === code);
};
