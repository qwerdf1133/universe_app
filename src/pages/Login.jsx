import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInUserInFirebase, getHouseholdDataFromFirebase } from '../utils/firebase';

const Login = () => {
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!id || !password) {
      setErrorMsg('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setErrorMsg('');
      // 1. Firebase로 로그인
      const userData = await signInUserInFirebase(id, password);

      // Save currentUser locally
      localStorage.setItem('currentUser', JSON.stringify({ id: userData.id, nickname: userData.nickname }));

      // Update local storage users list cache
      const usersStr = localStorage.getItem('users');
      const users = usersStr ? JSON.parse(usersStr) : [];
      if (!users.some(u => u.id === userData.id)) {
        users.push(userData);
        localStorage.setItem('users', JSON.stringify(users));
      } else {
        const updated = users.map(u => u.id === userData.id ? userData : u);
        localStorage.setItem('users', JSON.stringify(updated));
      }

      // 2. 가구 냉장고 정보 로드 및 동기화
      const code = userData.householdCode;
      const syncKey = code || `user_${userData.id}`;
      const householdData = await getHouseholdDataFromFirebase(syncKey);
      
      if (householdData) {
        const prefix = code ? `_${code}` : '';
        if (householdData.ingredients) {
          localStorage.setItem(`ingredients${prefix}`, JSON.stringify(householdData.ingredients));
        }
        if (householdData['shopping-list']) {
          localStorage.setItem(`shopping-list${prefix}`, JSON.stringify(householdData['shopping-list']));
        }
        if (householdData['member-requests']) {
          localStorage.setItem(`member-requests${prefix}`, JSON.stringify(householdData['member-requests']));
        }
      }

      navigate('/home');
    } catch (e) {
      console.error(e);
      setErrorMsg('아이디 또는 비밀번호가 틀렸습니다');
    }
  };

  return (
    <div className="page-container" style={{ padding: '20px', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <img src="/favicon.svg" alt="우리집 냉장고 로고" width="80" height="80" />
        <h1 style={{ color: 'var(--primary-color)', fontSize: '24px', marginTop: '16px', fontWeight: 'bold' }}>우리집 냉장고</h1>
      </div>
      
      <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input 
          type="text" 
          placeholder="아이디" 
          className="input-field" 
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
        <input 
          type="password" 
          placeholder="비밀번호" 
          className="input-field" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errorMsg && <div style={{ color: 'red', fontSize: '14px' }}>{errorMsg}</div>}
      </div>
      
      <button className="btn-primary" onClick={handleLogin}>로그인</button>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '20px', color: 'var(--gray-400)', fontSize: '14px' }}>
        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/signup')}>회원가입</span>
        <span>|</span>
        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/find-password')}>비밀번호 찾기</span>
      </div>
    </div>
  );
};

export default Login;
