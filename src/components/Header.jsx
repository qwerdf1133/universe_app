import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import SettingsModal from './SettingsModal';

const Header = ({ title }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('😎');

  const loadProfile = () => {
    const session = localStorage.getItem('currentUser');
    if (session) {
      const userSession = JSON.parse(session);
      
      // Load current details from users database
      const usersStr = localStorage.getItem('users');
      const users = usersStr ? JSON.parse(usersStr) : [];
      const fullUser = users.find(u => u.id === userSession.id) || {};
      
      setNickname(fullUser.nickname || userSession.nickname || '사용자');
      setAvatar(fullUser.avatar || '😎');
    }
  };

  useEffect(() => {
    loadProfile();

    // Listen for custom profile updated event to refresh immediately
    window.addEventListener('profileUpdated', loadProfile);
    return () => {
      window.removeEventListener('profileUpdated', loadProfile);
    };
  }, []);

  return (
    <>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        height: '60px',
        boxSizing: 'border-box'
      }}>
        {/* Left Side: Title */}
        <h1 style={{ 
          fontSize: '17px', 
          fontWeight: '800', 
          color: 'var(--text-black)', 
          margin: 0,
          background: 'linear-gradient(135deg, var(--text-black) 0%, #4a5568 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {title}
        </h1>

        {/* Right Side: Profile & Settings Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Dynamic Profile Avatar Picture */}
          <div 
            onClick={() => setIsSettingsOpen(true)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #e0f2ec 0%, #379271 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(55, 146, 113, 0.15)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            title={`${nickname}님의 프로필`}
          >
            {avatar}
          </div>

          {/* Settings gear icon */}
          <button 
            onClick={() => setIsSettingsOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--gray-500)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(30deg)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(0)'}
            title="설정 메뉴 열기"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
};

export default Header;
