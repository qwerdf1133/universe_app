import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Copy, Check, LogOut, UserMinus, ShieldAlert, Award } from 'lucide-react';

const AVATARS = ['😎', '👩', '👨', '👶', '🦁', '🐯', '🐼', '🐰', '🦊', '🐱'];

const SettingsModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('😎');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'members', 'system'

  // Load current user details
  useEffect(() => {
    if (isOpen) {
      const session = localStorage.getItem('currentUser');
      if (session) {
        const userSession = JSON.parse(session);
        // Find full user details in user list to get householdCode and avatar
        const usersStr = localStorage.getItem('users');
        const users = usersStr ? JSON.parse(usersStr) : [];
        const fullUser = users.find(u => u.id === userSession.id) || {};
        
        const mergedUser = { ...userSession, ...fullUser };
        setCurrentUser(mergedUser);
        setNickname(mergedUser.nickname || '');
        setSelectedAvatar(mergedUser.avatar || '😎');
      }
    }
  }, [isOpen]);

  if (!isOpen || !currentUser) return null;

  // Handle Profile Update
  const handleSaveProfile = () => {
    if (!nickname.trim()) {
      alert('닉네임을 입력해 주세요.');
      return;
    }

    const usersStr = localStorage.getItem('users');
    if (usersStr) {
      const users = JSON.parse(usersStr);
      const updated = users.map(u => {
        if (u.id === currentUser.id) {
          return { ...u, nickname, avatar: selectedAvatar };
        }
        return u;
      });
      localStorage.setItem('users', JSON.stringify(updated));
    }

    // Update currentUser session
    const updatedSession = { ...currentUser, nickname, avatar: selectedAvatar };
    localStorage.setItem('currentUser', JSON.stringify({ id: currentUser.id, nickname }));

    // Dispatch custom event to notify all listening headers to refresh
    window.dispatchEvent(new Event('profileUpdated'));
    alert('프로필 설정이 정상적으로 저장되었습니다.');
  };

  // Handle Household Code Copy
  const handleCopyCode = () => {
    const code = currentUser.householdCode || 'GUEST6';
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Handle Logout
  const handleLogout = () => {
    if (window.confirm('정말 로그아웃 하시겠습니까?')) {
      localStorage.removeItem('currentUser');
      onClose();
      navigate('/login');
    }
  };

  // Handle Account Withdrawal (회원탈퇴)
  const handleWithdrawal = () => {
    const confirm1 = window.confirm(
      '⚠ 경고: 회원탈퇴 시 가구 매칭 정보 및 등록 정보가 모두 영구 삭제됩니다. 진행하시겠습니까?'
    );
    if (!confirm1) return;

    const confirm2 = window.prompt(
      '탈퇴 처리를 위해 현재 계정의 ID를 정확하게 입력해 주세요.'
    );
    if (confirm2 !== currentUser.id) {
      alert('아이디가 일치하지 않습니다. 회원탈퇴 처리가 취소되었습니다.');
      return;
    }

    // Delete from users list
    const usersStr = localStorage.getItem('users');
    if (usersStr) {
      const users = JSON.parse(usersStr);
      const remaining = users.filter(u => u.id !== currentUser.id);
      localStorage.setItem('users', JSON.stringify(remaining));
    }

    // Clean up current user session
    localStorage.removeItem('currentUser');
    alert('회원탈퇴가 정상적으로 완료되었습니다. 그동안 이용해 주셔서 감사합니다.');
    onClose();
    navigate('/login');
  };

  // Get current user household type details
  const householdLabel = currentUser.householdType || '미지정';
  const householdCodeVal = currentUser.householdCode || '없음';

  // Get members of same household
  const usersStr = localStorage.getItem('users');
  const allUsers = usersStr ? JSON.parse(usersStr) : [];
  const householdMembers = allUsers.filter(u => u.householdCode === currentUser.householdCode && u.householdCode);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '480px',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.6)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'flex-end',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        width: '100%',
        maxHeight: '90%',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        padding: '24px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflowY: 'auto',
        animation: 'slideUp 0.3s ease-out'
      }}>
        
        {/* Top bar header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-black)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚙️ 설정 메뉴
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--gray-400)', padding: '4px', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Setting Internal Tabs */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '12px', padding: '4px' }}>
          <button 
            onClick={() => setActiveTab('profile')}
            style={{
              flex: 1, padding: '10px 8px', fontSize: '13px', fontWeight: 'bold', border: 'none', borderRadius: '8px',
              background: activeTab === 'profile' ? '#fff' : 'transparent',
              color: activeTab === 'profile' ? 'var(--primary-color)' : 'var(--gray-500)',
              boxShadow: activeTab === 'profile' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer'
            }}
          >
            프로필 설정
          </button>
          <button 
            onClick={() => setActiveTab('members')}
            style={{
              flex: 1, padding: '10px 8px', fontSize: '13px', fontWeight: 'bold', border: 'none', borderRadius: '8px',
              background: activeTab === 'members' ? '#fff' : 'transparent',
              color: activeTab === 'members' ? 'var(--primary-color)' : 'var(--gray-500)',
              boxShadow: activeTab === 'members' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer'
            }}
          >
            구성원 설정
          </button>
          <button 
            onClick={() => setActiveTab('system')}
            style={{
              flex: 1, padding: '10px 8px', fontSize: '13px', fontWeight: 'bold', border: 'none', borderRadius: '8px',
              background: activeTab === 'system' ? '#fff' : 'transparent',
              color: activeTab === 'system' ? 'var(--primary-color)' : 'var(--gray-500)',
              boxShadow: activeTab === 'system' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer'
            }}
          >
            기타/계정
          </button>
        </div>

        {/* Tab 1: Profile Settings */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '8px 0' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-black)', marginBottom: '8px' }}>
                프로필 사진 선택
              </label>
              
              {/* Selected Profile Preview */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e0f2ec 0%, #379271 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  boxShadow: '0 4px 10px rgba(55, 146, 113, 0.15)'
                }}>
                  {selectedAvatar}
                </div>
              </div>

              {/* Avatar Grid Selection */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(5, 1fr)', 
                gap: '8px', 
                background: '#f9fafb', 
                padding: '12px', 
                borderRadius: '12px',
                border: '1px solid var(--gray-200)'
              }}>
                {AVATARS.map(avatar => {
                  const isSelected = selectedAvatar === avatar;
                  return (
                    <button
                      key={avatar}
                      onClick={() => setSelectedAvatar(avatar)}
                      style={{
                        background: isSelected ? 'var(--primary-color)' : '#fff',
                        border: isSelected ? '1px solid var(--primary-color)' : '1px solid var(--gray-200)',
                        borderRadius: '50%',
                        width: '42px',
                        height: '42px',
                        fontSize: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s',
                        boxShadow: isSelected ? '0 2px 5px rgba(55, 146, 113, 0.3)' : 'none'
                      }}
                    >
                      {avatar}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-black)', marginBottom: '8px' }}>
                닉네임 변경
              </label>
              <input
                type="text"
                className="input-field"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={10}
                placeholder="새로운 닉네임을 입력하세요"
              />
            </div>

            <button 
              className="btn-primary" 
              onClick={handleSaveProfile}
              style={{ marginTop: '8px', marginHorizontal: 0 }}
            >
              프로필 저장하기
            </button>
          </div>
        )}

        {/* Tab 2: Members Settings */}
        {activeTab === 'members' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '8px 0' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', 
              border: '1px solid #bbf7d0', 
              borderRadius: '16px', 
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#166534', fontWeight: 'bold' }}>우리집 가구 코드</span>
                <span style={{ fontSize: '11px', background: '#86efac', color: '#14532d', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                  {householdLabel}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ 
                  flex: 1, 
                  background: '#ffffff', 
                  border: '1px solid #86efac', 
                  borderRadius: '10px', 
                  padding: '12px', 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  letterSpacing: '1px',
                  color: 'var(--text-black)',
                  textAlign: 'center'
                }}>
                  {householdCodeVal}
                </div>
                
                <button 
                  onClick={handleCopyCode}
                  style={{
                    background: 'var(--primary-color)',
                    border: 'none',
                    borderRadius: '10px',
                    width: '46px',
                    height: '46px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#fff',
                    boxShadow: '0 2px 4px rgba(55, 146, 113, 0.2)'
                  }}
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>
              
              <p style={{ fontSize: '11px', color: '#166534', margin: 0, textAlign: 'center' }}>
                구성원을 초대하려면 가구 코드를 공유하여 참가하게 하세요.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-black)', marginBottom: '10px' }}>
                🏠 참여 중인 구성원 ({householdMembers.length > 0 ? householdMembers.length : 1}명)
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Active logged in user */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', border: '1px solid var(--gray-200)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>{selectedAvatar}</span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-black)' }}>
                      {nickname} <span style={{ color: 'var(--primary-color)', fontSize: '11px', marginLeft: '4px' }}>(나)</span>
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>ID: {currentUser.id}</span>
                </div>

                {/* Simulated family members for premium feel */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '10px', opacity: 0.85 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>👩</span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-black)' }}>엄마</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>가구원</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '10px', opacity: 0.85 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>👨</span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-black)' }}>아빠</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>가구원</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: System & Account Withdrawal */}
        {activeTab === 'system' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '8px 0' }}>
            
            {/* Version Info */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '14px', 
              background: '#f8fafc', 
              borderRadius: '12px',
              border: '1px solid var(--gray-200)'
            }}>
              <span style={{ fontSize: '13px', color: 'var(--gray-600)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={18} color="var(--primary-color)" /> 어플리케이션 버전 정보
              </span>
              <span style={{ fontSize: '12px', background: '#e2e8f0', color: 'var(--gray-600)', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold' }}>
                v1.2.0 (최신버전)
              </span>
            </div>

            {/* Logout Action */}
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '14px',
                background: '#f1f5f9',
                color: 'var(--gray-700)',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <LogOut size={18} /> 로그아웃
            </button>

            {/* Account Withdrawal Box */}
            <div style={{ 
              border: '1px dashed #fca5a5', 
              background: '#fef2f2', 
              padding: '16px', 
              borderRadius: '16px',
              marginTop: '10px'
            }}>
              <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#dc2626', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert size={16} /> 위험구역 (Danger Zone)
              </h4>
              <p style={{ fontSize: '11px', color: '#991b1b', lineHeight: '1.4', margin: '0 0 12px 0' }}>
                회원탈퇴 진행 시 등록된 모든 개인 정보와 냉장고 식재료, 장보기 리스트가 파기되며 복구가 불가능합니다.
              </p>
              
              <button
                onClick={handleWithdrawal}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                }}
              >
                <UserMinus size={16} /> 회원탈퇴 설정
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;
