import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  checkDuplicateIdInFirebase,
  checkDuplicateNicknameInFirebase,
  signUpUserInFirebase,
  updateUserHouseholdInFirebase,
  db
} from '../utils/firebase';
import { query, collection, where, getDocs } from 'firebase/firestore';

const SignUp = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [id, setId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');

  const [isIdChecked, setIsIdChecked] = useState(false);
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);

  const [idCheckMsg, setIdCheckMsg] = useState('');
  const [nicknameCheckMsg, setNicknameCheckMsg] = useState('');

  // Household Modal States
  const [showHouseholdModal, setShowHouseholdModal] = useState(false);
  const [householdSubStep, setHouseholdSubStep] = useState('choice'); // 'choice', 'create', 'join'
  const [generatedCode, setGeneratedCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');

  const checkDuplicateId = async () => {
    if (!id) {
      setIdCheckMsg('아이디를 입력해주세요.');
      setIsIdChecked(false);
      return;
    }
    try {
      const isDup = await checkDuplicateIdInFirebase(id) || id === 'admin';
      if (isDup) {
        setIdCheckMsg('이미 사용 중인 아이디 입니다.');
        setIsIdChecked(false);
      } else {
        setIdCheckMsg('사용 가능한 아이디 입니다.');
        setIsIdChecked(true);
      }
    } catch (e) {
      console.error(e);
      setIdCheckMsg('중복확인 중 오류가 발생했습니다.');
      setIsIdChecked(false);
    }
  };

  const checkDuplicateNickname = async () => {
    if (!nickname) {
      setNicknameCheckMsg('닉네임을 입력해주세요.');
      setIsNicknameChecked(false);
      return;
    }
    try {
      const isDup = await checkDuplicateNicknameInFirebase(nickname) || nickname === '관리자';
      if (isDup) {
        setNicknameCheckMsg('이미 사용 중인 닉네임 입니다.');
        setIsNicknameChecked(false);
      } else {
        setNicknameCheckMsg('사용 가능한 닉네임 입니다.');
        setIsNicknameChecked(true);
      }
    } catch (e) {
      console.error(e);
      setNicknameCheckMsg('중복확인 중 오류가 발생했습니다.');
      setIsNicknameChecked(false);
    }
  };

  const handleNext = async () => {
    if (!isIdChecked) return alert('아이디 중복확인을 해주세요.');
    if (!email) return alert('이메일을 입력해주세요.');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return alert('올바른 이메일 형식을 입력해주세요.');
    if (!password) return alert('비밀번호를 입력해주세요.');
    if (password !== passwordConfirm) return alert('비밀번호가 일치하지 않습니다.');
    if (!isNicknameChecked) return alert('닉네임 중복확인을 해주세요.');

    try {
      // 1. Firebase Auth 및 Firestore 계정 생성
      await signUpUserInFirebase(id, email, password, nickname);

      // Save current user session locally
      localStorage.setItem('currentUser', JSON.stringify({ id, nickname }));

      // Clear local storage data
      localStorage.removeItem('ingredients');
      localStorage.removeItem('shopping-list');
      localStorage.removeItem('member-requests');

      // Update local storage users for backward compatibility
      const usersStr = localStorage.getItem('users');
      const users = usersStr ? JSON.parse(usersStr) : [];
      users.push({
        id,
        nickname,
        householdCode: '',
        householdType: '미정'
      });
      localStorage.setItem('users', JSON.stringify(users));

      // Show Household Modal
      setShowHouseholdModal(true);
      alert('인증 이메일이 발송되었습니다. 이메일을 확인해 주세요!');
    } catch (e) {
      console.error(e);
      alert(`회원가입 오류: ${e.message}`);
    }
  };

  // Generate 6-digit random code
  const generateHouseholdCode = async () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    try {
      // Save to Firestore user profile
      await updateUserHouseholdInFirebase(id, code, '가구 생성');

      // Update local users
      const usersStr = localStorage.getItem('users');
      if (usersStr) {
        const users = JSON.parse(usersStr);
        const updated = users.map(u => u.id === id ? { ...u, householdCode: code, householdType: '가구 생성' } : u);
        localStorage.setItem('users', JSON.stringify(updated));
      }

      setGeneratedCode(code);
      setHouseholdSubStep('create');
    } catch (e) {
      console.error(e);
      alert(`가구 생성 오류: ${e.message}`);
    }
  };

  const handleJoinHousehold = async () => {
    if (enteredCode.length !== 6) {
      return alert('6자리 가구 코드를 입력해주세요.');
    }

    try {
      // Firestore에서 유효한 가구 코드인지 검증
      const q = query(
        collection(db, "users"),
        where("householdCode", "==", enteredCode.toUpperCase()),
        where("householdType", "==", "가구 생성")
      );
      const querySnapshot = await getDocs(q);
      const isCodeValid = !querySnapshot.empty;

      if (!isCodeValid) {
        return alert('존재하지 않는 가구 코드입니다. 다시 확인 후 입력해주세요.');
      }

      // Save to Firestore
      await updateUserHouseholdInFirebase(id, enteredCode.toUpperCase(), '가구 참가');

      // Update local users
      const usersStr = localStorage.getItem('users');
      const users = usersStr ? JSON.parse(usersStr) : [];
      const updated = users.map(u => u.id === id ? { ...u, householdCode: enteredCode.toUpperCase(), householdType: '가구 참가' } : u);
      localStorage.setItem('users', JSON.stringify(updated));

      alert(`코드 [${enteredCode.toUpperCase()}] 가구에 참가하였습니다!`);
      navigate('/setup');
    } catch (e) {
      console.error(e);
      alert(`가구 참가 오류: ${e.message}`);
    }
  };

  const handleCompleteSignUp = () => {
    navigate('/setup');
  };


  return (
    <div className="page-container" style={{ padding: '20px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', marginTop: '20px' }}>
        <button
          onClick={() => navigate('/login')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeft size={24} color="var(--text-black)" />
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>회원가입</h1>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ID input & duplicate check */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="아이디"
              className="input-field"
              style={{ flex: 1, marginBottom: 0 }}
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                setIsIdChecked(false);
                setIdCheckMsg('');
              }}
            />
            <button
              className="btn-primary"
              style={{ width: '80px', fontSize: '14px', padding: '0', height: '48px', marginTop: 0, borderRadius: '8px', flexShrink: 0 }}
              onClick={checkDuplicateId}
            >
              중복확인
            </button>
          </div>
          {idCheckMsg && (
            <span style={{ fontSize: '12px', color: isIdChecked ? '#379271' : '#e53e3e', fontWeight: '500', paddingLeft: '4px' }}>
              {idCheckMsg}
            </span>
          )}
        </div>

        {/* Email input */}
        <input
          type="email"
          placeholder="이메일"
          className="input-field"
          style={{ marginBottom: 0 }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password input */}
        <input
          type="password"
          placeholder="비밀번호 (최소 6자 이상)"
          className="input-field"
          style={{ marginBottom: 0 }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Password Confirmation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <input
            type="password"
            placeholder="비밀번호 확인"
            className="input-field"
            style={{ marginBottom: 0 }}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />
          {passwordConfirm && (
            <span style={{ fontSize: '12px', color: password === passwordConfirm ? '#379271' : '#e53e3e', fontWeight: '500', paddingLeft: '4px' }}>
              {password === passwordConfirm ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
            </span>
          )}
        </div>

        {/* Nickname input & duplicate check */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="닉네임"
              className="input-field"
              style={{ flex: 1, marginBottom: 0 }}
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setIsNicknameChecked(false);
                setNicknameCheckMsg('');
              }}
            />
            <button
              className="btn-primary"
              style={{ width: '80px', fontSize: '14px', padding: '0', height: '48px', marginTop: 0, borderRadius: '8px', flexShrink: 0 }}
              onClick={checkDuplicateNickname}
            >
              중복확인
            </button>
          </div>
          {nicknameCheckMsg && (
            <span style={{ fontSize: '12px', color: isNicknameChecked ? '#379271' : '#e53e3e', fontWeight: '500', paddingLeft: '4px' }}>
              {nicknameCheckMsg}
            </span>
          )}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <button className="btn-primary" onClick={handleNext}>다음</button>
        </div>
      </div>

      {/* Household Creation / Join Modal */}
      {showHouseholdModal && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            width: '100%',
            maxWidth: '360px',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {householdSubStep === 'choice' && (
              <>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'center', margin: 0, color: 'var(--text-black)' }}>
                  회원가입 완료! 🎉
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--gray-500)', textAlign: 'center', margin: 0, lineHeight: 1.4 }}>
                  냉장고 관리를 함께할 가구를<br />생성하거나 다른 가구에 참가해보세요.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    className="btn-primary"
                    style={{ margin: 0 }}
                    onClick={generateHouseholdCode}
                  >
                    가구 생성하기
                  </button>
                  <button
                    className="btn-primary"
                    style={{ margin: 0, background: '#FFFFFF', color: 'var(--primary-color)', border: '1px solid var(--primary-color)' }}
                    onClick={() => setHouseholdSubStep('join')}
                  >
                    가구 참가하기
                  </button>
                </div>
              </>
            )}

            {householdSubStep === 'create' && (
              <>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'center', margin: 0, color: 'var(--text-black)' }}>
                  새로운 가구 생성
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--gray-500)', textAlign: 'center', margin: 0 }}>
                  아래의 6자리 코드를 다른 가구원에게 공유하세요.
                </p>
                <div style={{
                  background: '#f3f4f6',
                  padding: '16px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  letterSpacing: '4px',
                  color: 'var(--primary-color)',
                  border: '1px dashed var(--primary-color)'
                }}>
                  {generatedCode}
                </div>
                <button
                  className="btn-primary"
                  style={{ margin: 0 }}
                  onClick={handleCompleteSignUp}
                >
                  완료
                </button>
              </>
            )}

            {householdSubStep === 'join' && (
              <>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'center', margin: 0, color: 'var(--text-black)' }}>
                  가구 참가하기
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--gray-500)', textAlign: 'center', margin: 0 }}>
                  가구 생성 화면에서 발급된 6자리 가구 코드를 입력해주세요.
                </p>
                <input
                  type="text"
                  placeholder="6자리 가구 코드 입력"
                  maxLength={6}
                  className="input-field"
                  style={{ margin: 0, textAlign: 'center', fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn-primary"
                    style={{ margin: 0, flex: 1, background: '#FFFFFF', color: 'var(--text-black)', border: '1px solid var(--gray-300)' }}
                    onClick={() => setHouseholdSubStep('choice')}
                  >
                    이전
                  </button>
                  <button
                    className="btn-primary"
                    style={{ margin: 0, flex: 2 }}
                    onClick={handleJoinHousehold}
                  >
                    참가하기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SignUp;
