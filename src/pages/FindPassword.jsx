import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FindPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Step 1 state
  const [id, setId] = useState('');
  const [nickname, setNickname] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Step 2 state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleCheckUser = () => {
    const usersStr = localStorage.getItem('users');
    if (!usersStr) {
      setErrorMsg('가입된 유저가 없습니다.');
      return;
    }
    
    const users = JSON.parse(usersStr);
    const user = users.find(u => u.id === id && u.nickname === nickname);
    
    if (user) {
      setErrorMsg('');
      setStep(2);
    } else {
      setErrorMsg('입력하신 정보와 일치하는 계정이 없습니다.');
    }
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      setErrorMsg('비밀번호가 일치하지 않습니다.');
      return;
    }

    const usersStr = localStorage.getItem('users');
    let users = JSON.parse(usersStr);
    
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex !== -1) {
      users[userIndex].password = newPassword;
      localStorage.setItem('users', JSON.stringify(users));
      alert('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
      navigate('/login');
    }
  };

  return (
    <div className="page-container" style={{ padding: '20px', justifyContent: 'center' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>비밀번호 찾기</h1>
      </div>
      
      {step === 1 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <input 
              type="text" 
              placeholder="아이디" 
              className="input-field" 
              value={id}
              onChange={(e) => setId(e.target.value)}
            />
          </div>
          <div>
            <input 
              type="text" 
              placeholder="닉네임" 
              className="input-field" 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
          
          {errorMsg && <div style={{ color: 'red', fontSize: '14px', marginBottom: '8px' }}>{errorMsg}</div>}
          
          <button className="btn-primary" onClick={handleCheckUser}>확인</button>
          
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <span style={{ cursor: 'pointer', color: 'var(--gray-400)', fontSize: '14px' }} onClick={() => navigate('/login')}>로그인으로 돌아가기</span>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <input 
              type="password" 
              placeholder="새 비밀번호" 
              className="input-field" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="새 비밀번호 확인" 
              className="input-field" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          
          {errorMsg && <div style={{ color: 'red', fontSize: '14px', marginBottom: '8px' }}>{errorMsg}</div>}
          
          <button className="btn-primary" onClick={handleChangePassword}>비밀번호 변경</button>
        </div>
      )}
    </div>
  );
};

export default FindPassword;
