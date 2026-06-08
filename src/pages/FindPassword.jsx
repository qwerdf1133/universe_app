import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../utils/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const FindPassword = () => {
  const navigate = useNavigate();
  
  const [id, setId] = useState('');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [generatedTempPw, setGeneratedTempPw] = useState('');

  const generateTempPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let temp = '';
    for (let i = 0; i < 6; i++) {
      temp += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return temp;
  };

  const handleCheckUser = async () => {
    if (!id || !email) {
      setErrorMsg('아이디와 이메일을 모두 입력해주세요.');
      return;
    }
    
    try {
      setErrorMsg('');
      const userDocRef = doc(db, "users", id);
      const userSnap = await getDoc(userDocRef);
      
      if (!userSnap.exists()) {
        setErrorMsg('입력하신 정보와 일치하는 계정이 없습니다.');
        return;
      }
      
      const userData = userSnap.data();
      if (userData.email !== email) {
        setErrorMsg('입력하신 정보와 일치하는 계정이 없습니다.');
        return;
      }
      
      // Generate temporary password
      const tempPw = generateTempPassword();
      
      // Save temp password in Firestore user doc
      await updateDoc(userDocRef, {
        tempPassword: tempPw
      });
      
      setGeneratedTempPw(tempPw);
      setShowModal(true);
    } catch (e) {
      console.error(e);
      setErrorMsg('비밀번호 찾기 처리 중 오류가 발생했습니다.');
    }
  };

  const handleConfirmModal = () => {
    setShowModal(false);
    // Navigate to login page with autoLogin state
    navigate('/login', {
      state: {
        autoLogin: true,
        id: id,
        password: generatedTempPw
      }
    });
  };

  return (
    <div className="page-container" style={{ padding: '20px', justifyContent: 'center', position: 'relative' }}>
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>비밀번호 찾기</h1>
      </div>
      
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
            type="email" 
            placeholder="이메일" 
            className="input-field" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        {errorMsg && <div style={{ color: 'red', fontSize: '14px', marginBottom: '8px' }}>{errorMsg}</div>}
        
        <button className="btn-primary" onClick={handleCheckUser}>확인</button>
        
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <span style={{ cursor: 'pointer', color: 'var(--gray-400)', fontSize: '14px' }} onClick={() => navigate('/login')}>로그인으로 돌아가기</span>
        </div>
      </div>

      {/* Temp Password Issued Modal */}
      {showModal && (
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
            animation: 'slideUp 0.3s ease-out',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--text-black)' }}>
              임시 비밀번호 발급 완료
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--gray-500)', margin: 0, lineHeight: 1.4 }}>
              회원님의 임시 비밀번호가 아래와 같이 발급되었습니다.
            </p>
            <div style={{
              background: '#f3f4f6',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '22px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              color: 'var(--primary-color)',
              border: '1px dashed var(--primary-color)'
            }}>
              {generatedTempPw}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--gray-400)', margin: 0 }}>
              확인을 누르면 로그인 화면으로 이동하여<br />자동으로 로그인이 진행됩니다.
            </p>
            <button
              className="btn-primary"
              style={{ margin: 0 }}
              onClick={handleConfirmModal}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindPassword;
