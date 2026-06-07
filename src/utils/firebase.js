import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  sendPasswordResetEmail,
  signOut,
  deleteUser
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  collection, 
  where, 
  getDocs 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCvP6dk6PSBQx168S0JK-WnyqZD1Ith9Cs",
  authDomain: "project-login-service-f65f1.firebaseapp.com",
  projectId: "project-login-service-f65f1",
  storageBucket: "project-login-service-f65f1.firebasestorage.app",
  messagingSenderId: "428007184908",
  appId: "1:428007184908:web:573718d3dfc594cd87ac29",
  measurementId: "G-H6B1VCT2NW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.warn("Analytics initialization failed:", e);
}

export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * 아이디 중복 확인
 */
export const checkDuplicateIdInFirebase = async (id) => {
  if (!id) return false;
  const docRef = doc(db, "users", id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
};

/**
 * 닉네임 중복 확인
 */
export const checkDuplicateNicknameInFirebase = async (nickname) => {
  if (!nickname) return false;
  const q = query(collection(db, "users"), where("nickname", "==", nickname));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

/**
 * 회원 가입 (Email로 계정 생성 후 Firestore에 아이디 매핑 정보 저장)
 */
export const signUpUserInFirebase = async (id, email, password, nickname) => {
  // 1. Firebase Auth 회원가입
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // 2. 이메일 인증 메일 발송
  try {
    await sendEmailVerification(user);
  } catch (e) {
    console.error("Failed to send verification email:", e);
  }

  // 3. Firestore에 사용자 상세 정보 기록
  const userDocRef = doc(db, "users", id);
  await setDoc(userDocRef, {
    id,
    email,
    nickname,
    uid: user.uid,
    householdCode: "",
    householdType: "미정",
    createdAt: new Date().toISOString()
  });

  return user;
};

/**
 * 로그인 (아이디로 이메일 조회 후 Firebase Auth 로그인)
 */
export const signInUserInFirebase = async (id, password) => {
  // 1. Firestore에서 아이디 문서 확인
  const userDocRef = doc(db, "users", id);
  const userDoc = await getDoc(userDocRef);
  if (!userDoc.exists()) {
    throw new Error("존재하지 않는 아이디입니다.");
  }
  const userData = userDoc.data();

  // 2. 해당 이메일과 비밀번호로 로그인
  await signInWithEmailAndPassword(auth, userData.email, password);

  return userData;
};

/**
 * 사용자 정보 업데이트
 */
export const updateUserInFirebase = async (id, updates) => {
  const userDocRef = doc(db, "users", id);
  await updateDoc(userDocRef, updates);
};

/**
 * 사용자 가구 정보 업데이트
 */
export const updateUserHouseholdInFirebase = async (id, householdCode, householdType) => {
  const userDocRef = doc(db, "users", id);
  await updateDoc(userDocRef, {
    householdCode,
    householdType
  });
};

/**
 * 가구 냉장고 상태 데이터 Firestore에 저장
 */
export const saveHouseholdDataInFirebase = async (householdCode, key, data) => {
  if (!householdCode) return;
  const docRef = doc(db, "households", householdCode);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    await updateDoc(docRef, {
      [key]: data
    });
  } else {
    await setDoc(docRef, {
      [key]: data
    });
  }
};

/**
 * 가구 냉장고 상태 데이터 Firestore에서 로드
 */
export const getHouseholdDataFromFirebase = async (householdCode) => {
  if (!householdCode) return null;
  const docRef = doc(db, "households", householdCode);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
};

/**
 * 비밀번호 찾기 (이메일로 비밀번호 재설정 메일 발송)
 */
export const sendPasswordResetEmailByUsername = async (id, nickname) => {
  const userDocRef = doc(db, "users", id);
  const userDoc = await getDoc(userDocRef);
  if (!userDoc.exists()) {
    throw new Error("입력하신 정보와 일치하는 계정이 없습니다.");
  }
  
  const userData = userDoc.data();
  if (userData.nickname !== nickname) {
    throw new Error("입력하신 정보와 일치하는 계정이 없습니다.");
  }

  await sendPasswordResetEmail(auth, userData.email);
  return userData.email;
};

/**
 * 회원 탈퇴
 */
export const deleteUserAccount = async (id) => {
  // 1. Firestore 유저 문서 삭제
  const userDocRef = doc(db, "users", id);
  await deleteDoc(userDocRef);

  // 2. Firebase Auth 유저 탈퇴
  const currentUser = auth.currentUser;
  if (currentUser) {
    await deleteUser(currentUser);
  }
};

/**
 * 로그아웃
 */
export const signOutUser = async () => {
  await signOut(auth);
};
