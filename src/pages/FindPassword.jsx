import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmailByUsername } from '../utils/firebase';

const FindPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Step 1 state
  const [id, setId] = useState('');
  const [nickname, setNickname] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [sentEmail, setSentEmail] = useState('');

  const handleCheckUser = async () => {
    if (!id || !nickname) {
      setErrorMsg('아이디와 닉네임을 모두 입력해주세요.');
      return;
    }
    
    try {
      setErrorMsg('');
      const email = await sendPasswordResetEmailByUsername(id, nickname);
      setSentEmail(email);
      setStep(2);
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message || '입력하신 정보와 일치하는 계정이 없습니다.');
    }
  };

  return (
    <div className="page-container" style={{ padding: '20px', justifyContent: 'center' }}>
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>✉️</div>
          <p style={{ fontSize: '16px', color: 'var(--text-black)', lineHeight: '1.6', fontWeight: '500' }}>
            등록된 이메일 주소로<br />
            <strong style={{ color: 'var(--primary-color)' }}>비밀번호 재설정 메일</strong>이 발송되었습니다.
          </p>
          {sentEmail && (
            <p style={{ fontSize: '13px', background: '#f3f4f6', padding: '8px 12px', borderRadius: '8px', color: 'var(--gray-600)', wordBreak: 'break-all' }}>
              수신 이메일: {sentEmail}
            </p>
          )}
          <p style={{ fontSize: '13px', color: 'var(--gray-500)', lineHeight: '1.5' }}>
            메일함의 링크를 클릭하여 비밀번호를 재설정하신 후,<br />
            아래 버튼을 눌러 다시 로그인해 주세요.
          </p>
          
          <button className="btn-primary" onClick={() => navigate('/login')} style={{ marginTop: '10px' }}>로그인으로 이동</button>
        </div>
      )}
    </div>
  );
};

export default FindPassword;
