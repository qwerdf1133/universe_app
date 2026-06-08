import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Copy, Check, LogOut, UserMinus, ShieldAlert, Award, Home } from 'lucide-react';
import { updateUserInFirebase, signOutUser, deleteUserAccount, db, auth } from '../utils/firebase';
import { query, collection, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { updatePassword, signInWithEmailAndPassword } from 'firebase/auth';
import { updateUserHouseholdInFirebase } from '../utils/firebase';

const AVATARS = ['😎', '👩', '👨', '👶', '🦁', '🐯', '🐼', '🐰', '🦊', '🐱'];

const SettingsModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('😎');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'members', 'system'

  // Household members state
  const [householdMembers, setHouseholdMembers] = useState([]);

  // ── 비밀번호 변경 팝업 states ──
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [pwCurrentError, setPwCurrentError] = useState('');
  const [pwChanging, setPwChanging] = useState(false);

  // ── 가구 변경 팝업 states ──
  const [showHouseholdModal, setShowHouseholdModal] = useState(false);
  const [householdSubStep, setHouseholdSubStep] = useState('choice'); // 'choice' | 'create' | 'join'
  const [generatedCode, setGeneratedCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');

  // Load current user details
  useEffect(() => {
    if (isOpen) {
      const session = localStorage.getItem('currentUser');
      if (session) {
        const userSession = JSON.parse(session);
        const usersStr = localStorage.getItem('users');
        const users = usersStr ? JSON.parse(usersStr) : [];
        const fullUser = users.find(u => u.id === userSession.id) || {};

        const mergedUser = { ...userSession, ...fullUser };
        setCurrentUser(mergedUser);
        setNickname(mergedUser.nickname || '');
        setSelectedAvatar(mergedUser.avatar || '😎');

        if (mergedUser.householdCode) {
          setHouseholdMembers(users.filter(u => u.householdCode === mergedUser.householdCode));
        } else {
          setHouseholdMembers([]);
        }
      }
    }
  }, [isOpen]);

  // Dynamically load members from Firestore
  useEffect(() => {
    const fetchMembers = async () => {
      if (isOpen && currentUser && currentUser.householdCode) {
        try {
          const q = query(
            collection(db, "users"),
            where("householdCode", "==", currentUser.householdCode)
          );
          const querySnapshot = await getDocs(q);
          const list = [];
          querySnapshot.forEach(docSnap => { list.push(docSnap.data()); });
          setHouseholdMembers(list);

          const usersStr = localStorage.getItem('users');
          let localUsers = usersStr ? JSON.parse(usersStr) : [];
          list.forEach(m => {
            const idx = localUsers.findIndex(u => u.id === m.id);
            if (idx > -1) localUsers[idx] = { ...localUsers[idx], ...m };
            else localUsers.push(m);
          });
          localStorage.setItem('users', JSON.stringify(localUsers));
        } catch (e) {
          console.error("Error fetching household members from Firestore:", e);
        }
      }
    };
    fetchMembers();
  }, [isOpen, currentUser, activeTab]);

  if (!isOpen || !currentUser) return null;

  // ─── Profile ───────────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!nickname.trim()) { alert('닉네임을 입력해 주세요.'); return; }
    try {
      await updateUserInFirebase(currentUser.id, { nickname, avatar: selectedAvatar });
      const usersStr = localStorage.getItem('users');
      if (usersStr) {
        const users = JSON.parse(usersStr);
        const updated = users.map(u => u.id === currentUser.id ? { ...u, nickname, avatar: selectedAvatar } : u);
        localStorage.setItem('users', JSON.stringify(updated));
      }
      localStorage.setItem('currentUser', JSON.stringify({ id: currentUser.id, nickname, avatar: selectedAvatar }));
      window.dispatchEvent(new Event('profileUpdated'));
      alert('변경이 완료되었습니다!');
    } catch (e) {
      alert(`프로필 저장 오류: ${e.message}`);
    }
  };

  // ─── Copy household code ───────────────────────────────────────────────────
  const handleCopyCode = () => {
    const code = currentUser.householdCode || 'GUEST6';
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ─── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    if (window.confirm('정말 로그아웃 하시겠습니까?')) {
      try {
        await signOutUser();
        localStorage.removeItem('currentUser');
        onClose();
        navigate('/login');
      } catch (e) { alert(`로그아웃 오류: ${e.message}`); }
    }
  };

  // ─── Withdrawal ────────────────────────────────────────────────────────────
  const handleWithdrawal = async () => {
    if (!window.confirm('⚠ 경고: 회원탈퇴 시 가구 매칭 정보 및 등록 정보가 모두 영구 삭제됩니다. 진행하시겠습니까?')) return;
    const confirm2 = window.prompt('탈퇴 처리를 위해 현재 계정의 ID를 정확하게 입력해 주세요.');
    if (confirm2 !== currentUser.id) {
      alert('아이디가 일치하지 않습니다. 회원탈퇴 처리가 취소되었습니다.');
      return;
    }
    try {
      await deleteUserAccount(currentUser.id);
      const usersStr = localStorage.getItem('users');
      if (usersStr) {
        const users = JSON.parse(usersStr);
        localStorage.setItem('users', JSON.stringify(users.filter(u => u.id !== currentUser.id)));
      }
      localStorage.removeItem('currentUser');
      alert('회원탈퇴가 정상적으로 완료되었습니다. 그동안 이용해 주셔서 감사합니다.');
      onClose();
      navigate('/login');
    } catch (e) { alert(`회원탈퇴 오류: ${e.message}`); }
  };

  // ─── Kick member ───────────────────────────────────────────────────────────
  const handleKickMember = async (member) => {
    if (!window.confirm(`정말 ${member.nickname || member.id} 구성원을 강퇴하시겠습니까?`)) return;
    try {
      await updateDoc(doc(db, "users", member.id), { householdCode: "", householdType: "미정" });
      setHouseholdMembers(prev => prev.filter(m => m.id !== member.id));
      const usersStr = localStorage.getItem('users');
      if (usersStr) {
        const users = JSON.parse(usersStr);
        localStorage.setItem('users', JSON.stringify(
          users.map(u => u.id === member.id ? { ...u, householdCode: "", householdType: "미정" } : u)
        ));
      }
      alert(`${member.nickname || member.id} 구성원을 강퇴하였습니다.`);
    } catch (e) { alert(`구성원 강퇴 오류: ${e.message}`); }
  };

  // ─── Password change popup ──────────────────────────────────────────────────
  const openPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setNewPasswordConfirm('');
    setPwCurrentError('');
    setShowPasswordModal(true);
  };

  const pwNewMatch = newPasswordConfirm !== '' && newPassword === newPasswordConfirm;
  const pwNewMismatch = newPasswordConfirm !== '' && newPassword !== newPasswordConfirm;
  const pwFormValid =
    currentPassword.length > 0 &&
    newPassword.length >= 6 &&
    newPassword === newPasswordConfirm &&
    !pwChanging;

  const handleChangePassword = async () => {
    if (!pwFormValid) return;
    setPwChanging(true);
    setPwCurrentError('');

    try {
      // 1) Verify current password against Firestore cache
      const userDocRef = doc(db, "users", currentUser.id);
      const userSnap = await getDoc(userDocRef);
      const userData = userSnap.data();
      if (userData.password !== currentPassword) {
        setPwCurrentError('기존 비밀번호가 올바르지 않습니다.');
        setPwChanging(false);
        return;
      }

      // 2) Re-auth with Firebase Auth (needed for updatePassword)
      try {
        await signInWithEmailAndPassword(auth, userData.email, currentPassword);
      } catch (_) {/* ignore if already signed in */}

      // 3) Update Firebase Auth password
      const firebaseUser = auth.currentUser;
      if (firebaseUser) await updatePassword(firebaseUser, newPassword);

      // 4) Update Firestore
      await updateDoc(userDocRef, { password: newPassword });

      // 5) Update local users cache
      const usersStr = localStorage.getItem('users');
      if (usersStr) {
        const users = JSON.parse(usersStr);
        localStorage.setItem('users', JSON.stringify(
          users.map(u => u.id === currentUser.id ? { ...u, password: newPassword } : u)
        ));
      }

      setShowPasswordModal(false);
      setPwChanging(false);

      // 6) Success alert → login page auto-login
      alert('비밀번호가 성공적으로 변경되었습니다.');
      localStorage.removeItem('currentUser');
      onClose();
      navigate('/login', {
        state: { autoLogin: true, id: currentUser.id, password: newPassword }
      });
    } catch (e) {
      console.error("Change password error:", e);
      setPwCurrentError(`비밀번호 변경 오류: ${e.message}`);
      setPwChanging(false);
    }
  };

  // ─── Household change popup ─────────────────────────────────────────────────
  const openHouseholdModal = () => {
    setHouseholdSubStep('choice');
    setGeneratedCode('');
    setEnteredCode('');
    setShowHouseholdModal(true);
  };

  const generateHouseholdCode = async () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    try {
      await updateUserHouseholdInFirebase(currentUser.id, code, '가구 생성');
      const usersStr = localStorage.getItem('users');
      if (usersStr) {
        const users = JSON.parse(usersStr);
        localStorage.setItem('users', JSON.stringify(
          users.map(u => u.id === currentUser.id ? { ...u, householdCode: code, householdType: '가구 생성' } : u)
        ));
      }
      // Update currentUser in localStorage
      const sessionStr = localStorage.getItem('currentUser');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        localStorage.setItem('currentUser', JSON.stringify({ ...session, householdCode: code, householdType: '가구 생성' }));
      }
      setCurrentUser(prev => ({ ...prev, householdCode: code, householdType: '가구 생성' }));
      setGeneratedCode(code);
      setHouseholdSubStep('create');
    } catch (e) { alert(`가구 생성 오류: ${e.message}`); }
  };

  const handleJoinHousehold = async () => {
    if (enteredCode.length !== 6) return alert('6자리 가구 코드를 입력해주세요.');
    try {
      const q = query(
        collection(db, "users"),
        where("householdCode", "==", enteredCode.toUpperCase()),
        where("householdType", "==", "가구 생성")
      );
      const snap = await getDocs(q);
      if (snap.empty) return alert('존재하지 않는 가구 코드입니다. 다시 확인 후 입력해주세요.');

      await updateUserHouseholdInFirebase(currentUser.id, enteredCode.toUpperCase(), '가구 참가');
      const usersStr = localStorage.getItem('users');
      const users = usersStr ? JSON.parse(usersStr) : [];
      localStorage.setItem('users', JSON.stringify(
        users.map(u => u.id === currentUser.id ? { ...u, householdCode: enteredCode.toUpperCase(), householdType: '가구 참가' } : u)
      ));
      const sessionStr = localStorage.getItem('currentUser');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        localStorage.setItem('currentUser', JSON.stringify({ ...session, householdCode: enteredCode.toUpperCase(), householdType: '가구 참가' }));
      }
      setCurrentUser(prev => ({ ...prev, householdCode: enteredCode.toUpperCase(), householdType: '가구 참가' }));

      alert(`코드 [${enteredCode.toUpperCase()}] 가구에 참가하였습니다!`);
      setShowHouseholdModal(false);
      window.dispatchEvent(new Event('profileUpdated'));
    } catch (e) { alert(`가구 참가 오류: ${e.message}`); }
  };

  // ─── Derived values ─────────────────────────────────────────────────────────
  const householdLabel = currentUser.householdType || '미지정';
  const householdCodeVal = currentUser.householdCode || '없음';

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <>
      {/* ── Main Settings Sheet ──────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '480px', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000,
        display: 'flex', alignItems: 'flex-end', animation: 'fadeIn 0.2s ease-out'
      }}>
        <div style={{
          backgroundColor: '#FFFFFF', width: '100%', maxHeight: '90%',
          borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
          padding: '24px', boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column', gap: '16px',
          overflowY: 'auto', animation: 'slideUp 0.3s ease-out'
        }}>

          {/* Top bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-black)', margin: 0 }}>
              ⚙️ 설정 메뉴
            </h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--gray-400)', padding: '4px', cursor: 'pointer' }}>
              <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '12px', padding: '4px' }}>
            {[['profile', '프로필 설정'], ['members', '구성원 설정'], ['system', '기타/계정']].map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)} style={{
                flex: 1, padding: '10px 8px', fontSize: '13px', fontWeight: 'bold', border: 'none', borderRadius: '8px',
                background: activeTab === key ? '#fff' : 'transparent',
                color: activeTab === key ? 'var(--primary-color)' : 'var(--gray-500)',
                boxShadow: activeTab === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer'
              }}>{label}</button>
            ))}
          </div>

          {/* ── Tab 1: Profile ─────────────────────────────────────────────── */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '8px 0' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-black)', marginBottom: '8px' }}>
                  프로필 사진 선택
                </label>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e0f2ec 0%, #379271 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '36px', boxShadow: '0 4px 10px rgba(55,146,113,0.15)'
                  }}>{selectedAvatar}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', background: '#f9fafb', padding: '12px', borderRadius: '12px', border: '1px solid var(--gray-200)' }}>
                  {AVATARS.map(avatar => {
                    const isSel = selectedAvatar === avatar;
                    return (
                      <button key={avatar} onClick={() => setSelectedAvatar(avatar)} style={{
                        background: isSel ? 'var(--primary-color)' : '#fff',
                        border: isSel ? '1px solid var(--primary-color)' : '1px solid var(--gray-200)',
                        borderRadius: '50%', width: '42px', height: '42px', fontSize: '20px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s', boxShadow: isSel ? '0 2px 5px rgba(55,146,113,0.3)' : 'none'
                      }}>{avatar}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-black)', marginBottom: '8px' }}>닉네임 변경</label>
                <input type="text" className="input-field" value={nickname} onChange={e => setNickname(e.target.value)} maxLength={10} placeholder="새로운 닉네임을 입력하세요" />
              </div>
              <button className="btn-primary" onClick={handleSaveProfile} style={{ marginTop: '8px' }}>프로필 저장하기</button>
            </div>
          )}

          {/* ── Tab 2: Members ─────────────────────────────────────────────── */}
          {activeTab === 'members' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '8px 0' }}>
              {/* Household code card */}
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '1px solid #bbf7d0', borderRadius: '16px', padding: '16px',
                display: 'flex', flexDirection: 'column', gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#166534', fontWeight: 'bold' }}>우리집 가구 코드</span>
                  <span style={{ fontSize: '11px', background: '#86efac', color: '#14532d', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                    {householdLabel}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{
                    flex: 1, background: '#ffffff', border: '1px solid #86efac', borderRadius: '10px',
                    padding: '12px', fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px',
                    color: 'var(--text-black)', textAlign: 'center'
                  }}>{householdCodeVal}</div>
                  <button onClick={handleCopyCode} style={{
                    background: 'var(--primary-color)', border: 'none', borderRadius: '10px',
                    width: '46px', height: '46px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer', color: '#fff',
                    boxShadow: '0 2px 4px rgba(55,146,113,0.2)'
                  }}>
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
                <p style={{ fontSize: '11px', color: '#166534', margin: 0, textAlign: 'center' }}>
                  구성원을 초대하려면 가구 코드를 공유하여 참가하게 하세요.
                </p>
              </div>

              {/* Members list */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-black)', marginBottom: '10px' }}>
                  🏠 참여 중인 구성원 ({householdMembers.length > 0 ? householdMembers.length : 1}명)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {householdMembers.length === 0 ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', border: '1px solid var(--gray-200)', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>{selectedAvatar}</span>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-black)' }}>
                          {nickname} <span style={{ color: 'var(--primary-color)', fontSize: '11px', marginLeft: '4px' }}>(나)</span>
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>ID: {currentUser.id}</span>
                    </div>
                  ) : (
                    householdMembers.map(member => {
                      const isMe = member.id === currentUser.id;
                      const isCreator = currentUser.householdType === '가구 생성';
                      return (
                        <div key={member.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '12px', background: '#f8fafc', border: '1px solid var(--gray-200)', borderRadius: '10px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '20px' }}>{member.avatar || '😎'}</span>
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-black)' }}>
                              {member.nickname}{' '}
                              {isMe && <span style={{ color: 'var(--primary-color)', fontSize: '11px', marginLeft: '4px' }}>(나)</span>}
                              {member.householdType === '가구 생성' && (
                                <span style={{ color: '#e53e3e', fontSize: '10px', marginLeft: '4px', border: '1px solid #feb2b2', padding: '1px 4px', borderRadius: '4px', background: '#fff5f5' }}>방장</span>
                              )}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>ID: {member.id}</span>
                            {!isMe && isCreator && (
                              <button onClick={() => handleKickMember(member)} style={{
                                padding: '4px 8px', backgroundColor: '#ef4444', border: 'none',
                                borderRadius: '4px', color: '#ffffff', cursor: 'pointer',
                                fontSize: '11px', fontWeight: 'bold'
                              }}>강퇴</button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 3: System / Account ────────────────────────────────────── */}
          {activeTab === 'system' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '8px 0' }}>

              {/* Version */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--gray-200)' }}>
                <span style={{ fontSize: '13px', color: 'var(--gray-600)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={18} color="var(--primary-color)" /> 어플리케이션 버전 정보
                </span>
                <span style={{ fontSize: '12px', background: '#e2e8f0', color: 'var(--gray-600)', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold' }}>v1.2.0 (최신버전)</span>
              </div>

              {/* 비밀번호 변경 버튼 */}
              <div style={{ border: '1px solid var(--gray-200)', background: '#f8fafc', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-black)', margin: 0 }}>🔒 비밀번호 변경</h4>
                <p style={{ fontSize: '12px', color: 'var(--gray-500)', margin: 0, lineHeight: 1.4 }}>
                  비밀번호를 변경하려면 아래 버튼을 눌러주세요.
                </p>
                <button className="btn-primary" onClick={openPasswordModal} style={{ margin: 0, padding: '10px', fontSize: '13px' }}>
                  비밀번호 변경하기
                </button>
              </div>

              {/* 가구 변경 버튼 */}
              <div style={{ border: '1px solid var(--gray-200)', background: '#f8fafc', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-black)', margin: 0 }}>🏠 가구 변경</h4>
                <p style={{ fontSize: '12px', color: 'var(--gray-500)', margin: 0, lineHeight: 1.4 }}>
                  다른 가구를 생성하거나 기존 가구 코드로 참가합니다.
                </p>
                <button
                  onClick={openHouseholdModal}
                  style={{
                    padding: '10px', background: '#fff', color: 'var(--primary-color)',
                    border: '1px solid var(--primary-color)', borderRadius: '8px',
                    fontSize: '13px', fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  가구 변경하기
                </button>
              </div>

              {/* Logout */}
              <button onClick={handleLogout} style={{
                width: '100%', padding: '14px', background: '#f1f5f9', color: 'var(--gray-700)',
                border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                cursor: 'pointer', transition: 'all 0.2s'
              }}>
                <LogOut size={18} /> 로그아웃
              </button>

              {/* Danger Zone */}
              <div style={{ border: '1px dashed #fca5a5', background: '#fef2f2', padding: '16px', borderRadius: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#dc2626', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldAlert size={16} /> 위험구역 (Danger Zone)
                </h4>
                <p style={{ fontSize: '11px', color: '#991b1b', lineHeight: '1.4', margin: '0 0 12px 0' }}>
                  회원탈퇴 진행 시 등록된 모든 개인 정보와 냉장고 식재료, 장보기 리스트가 파기되며 복구가 불가능합니다.
                </p>
                <button onClick={handleWithdrawal} style={{
                  width: '100%', padding: '12px', background: '#ef4444', color: '#ffffff',
                  border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  cursor: 'pointer', boxShadow: '0 2px 4px rgba(239,68,68,0.2)'
                }}>
                  <UserMinus size={16} /> 회원탈퇴 설정
                </button>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* ── 비밀번호 변경 팝업 ─────────────────────────────────────────────── */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: '480px', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 3000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: '#fff', width: '100%', maxWidth: '360px', borderRadius: '20px',
            padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            display: 'flex', flexDirection: 'column', gap: '16px',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 'bold', margin: 0, color: 'var(--text-black)' }}>🔒 비밀번호 변경</h3>
              <button onClick={() => setShowPasswordModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: '4px' }}>
                <X size={22} />
              </button>
            </div>

            {/* 기존 비밀번호 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--gray-600)' }}>기존 비밀번호</label>
              <input
                type="password"
                placeholder="기존 비밀번호를 입력하세요"
                className="input-field"
                style={{ margin: 0 }}
                value={currentPassword}
                onChange={e => { setCurrentPassword(e.target.value); setPwCurrentError(''); }}
              />
              {pwCurrentError && (
                <span style={{ fontSize: '12px', color: '#e53e3e', fontWeight: '500', paddingLeft: '4px' }}>
                  {pwCurrentError}
                </span>
              )}
            </div>

            {/* 새 비밀번호 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--gray-600)' }}>새 비밀번호</label>
              <input
                type="password"
                placeholder="새 비밀번호 (최소 6글자 이상)"
                className="input-field"
                style={{ margin: 0 }}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>

            {/* 새 비밀번호 확인 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--gray-600)' }}>새 비밀번호 확인</label>
              <input
                type="password"
                placeholder="새 비밀번호를 다시 입력하세요"
                className="input-field"
                style={{ margin: 0 }}
                value={newPasswordConfirm}
                onChange={e => setNewPasswordConfirm(e.target.value)}
              />
              {pwNewMismatch && (
                <span style={{ fontSize: '12px', color: '#e53e3e', fontWeight: '500', paddingLeft: '4px' }}>
                  새 비밀번호와 새 비밀번호 확인이 일치하지 않습니다.
                </span>
              )}
              {pwNewMatch && (
                <span style={{ fontSize: '12px', color: '#379271', fontWeight: '500', paddingLeft: '4px' }}>
                  비밀번호가 일치합니다.
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                onClick={() => setShowPasswordModal(false)}
                style={{
                  flex: 1, padding: '12px', background: '#f1f5f9', color: 'var(--gray-700)',
                  border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                onClick={handleChangePassword}
                disabled={!pwFormValid}
                style={{
                  flex: 2, padding: '12px',
                  background: pwFormValid ? 'var(--primary-color)' : '#d1d5db',
                  color: '#fff', border: 'none', borderRadius: '10px',
                  fontSize: '14px', fontWeight: 'bold',
                  cursor: pwFormValid ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s'
                }}
              >
                {pwChanging ? '변경 중...' : '변경'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 가구 변경 팝업 ─────────────────────────────────────────────────── */}
      {showHouseholdModal && (
        <div style={{
          position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: '480px', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 3000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: '#fff', width: '100%', maxWidth: '360px', borderRadius: '20px',
            padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            display: 'flex', flexDirection: 'column', gap: '20px',
            animation: 'slideUp 0.3s ease-out'
          }}>

            {/* Choice step */}
            {householdSubStep === 'choice' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: 'bold', margin: 0, color: 'var(--text-black)' }}>🏠 가구 변경</h3>
                  <button onClick={() => setShowHouseholdModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: '4px' }}>
                    <X size={22} />
                  </button>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--gray-500)', margin: 0, textAlign: 'center', lineHeight: 1.4 }}>
                  새로운 가구를 생성하거나<br />기존 가구 코드로 참가하세요.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button className="btn-primary" style={{ margin: 0 }} onClick={generateHouseholdCode}>
                    가구 생성하기
                  </button>
                  <button className="btn-primary" style={{ margin: 0, background: '#fff', color: 'var(--primary-color)', border: '1px solid var(--primary-color)' }} onClick={() => setHouseholdSubStep('join')}>
                    가구 참가하기
                  </button>
                  <button onClick={() => setShowHouseholdModal(false)} style={{ padding: '10px', background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: '13px', cursor: 'pointer' }}>
                    취소
                  </button>
                </div>
              </>
            )}

            {/* Create step */}
            {householdSubStep === 'create' && (
              <>
                <h3 style={{ fontSize: '17px', fontWeight: 'bold', textAlign: 'center', margin: 0, color: 'var(--text-black)' }}>새로운 가구 생성</h3>
                <p style={{ fontSize: '14px', color: 'var(--gray-500)', textAlign: 'center', margin: 0 }}>
                  아래 6자리 코드를 다른 가구원에게 공유하세요.
                </p>
                <div style={{
                  background: '#f3f4f6', padding: '16px', borderRadius: '12px', textAlign: 'center',
                  fontSize: '28px', fontWeight: 'bold', letterSpacing: '4px',
                  color: 'var(--primary-color)', border: '1px dashed var(--primary-color)'
                }}>
                  {generatedCode}
                </div>
                <button className="btn-primary" style={{ margin: 0 }} onClick={() => setShowHouseholdModal(false)}>
                  완료
                </button>
              </>
            )}

            {/* Join step */}
            {householdSubStep === 'join' && (
              <>
                <h3 style={{ fontSize: '17px', fontWeight: 'bold', textAlign: 'center', margin: 0, color: 'var(--text-black)' }}>가구 참가하기</h3>
                <p style={{ fontSize: '14px', color: 'var(--gray-500)', textAlign: 'center', margin: 0 }}>
                  6자리 가구 코드를 입력해주세요.
                </p>
                <input
                  type="text"
                  placeholder="6자리 가구 코드 입력"
                  maxLength={6}
                  className="input-field"
                  style={{ margin: 0, textAlign: 'center', fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}
                  value={enteredCode}
                  onChange={e => setEnteredCode(e.target.value.toUpperCase())}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-primary" style={{ margin: 0, flex: 1, background: '#fff', color: 'var(--text-black)', border: '1px solid var(--gray-300)' }} onClick={() => setHouseholdSubStep('choice')}>
                    이전
                  </button>
                  <button className="btn-primary" style={{ margin: 0, flex: 2 }} onClick={handleJoinHousehold}>
                    참가하기
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
};

export default SettingsModal;
