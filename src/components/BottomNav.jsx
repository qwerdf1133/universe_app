import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Apple, Utensils, ShoppingCart, BookText } from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/home', label: '홈', icon: Home },
    { path: '/ingredients', label: '식재료', icon: Apple },
    { path: '/cooking', label: '요리', icon: Utensils },
    { path: '/shopping', label: '장보기', icon: ShoppingCart },
  ];

  return (
    <div className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <Icon size={24} color={isActive ? 'var(--primary-color)' : 'var(--gray-400)'} />
            <span style={{ color: isActive ? 'var(--primary-color)' : 'var(--gray-400)' }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
