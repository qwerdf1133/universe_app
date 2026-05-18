import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = () => {
    const usersStr = localStorage.getItem('users');
    if (!usersStr) {
      setErrorMsg('아이디 또는 비밀번호가 틀렸습니다');
      return;
    }
    
    const users = JSON.parse(usersStr);
    const user = users.find(u => u.id === id && u.password === password);
    
    if (user) {
      setErrorMsg('');
      navigate('/home');
    } else {
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
