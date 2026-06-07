import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import InitialSetup from './pages/InitialSetup';
import Home from './pages/Home';
import FindPassword from './pages/FindPassword';
import Ingredients from './pages/Ingredients';
import Cooking from './pages/Cooking';
import Shopping from './pages/Shopping';
import './App.css';

import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './utils/firebase';
import { getCurrentUserFull } from './utils/household';

function App() {
  useEffect(() => {
    let unsubscribe = null;

    const subscribeToHousehold = () => {
      // Clean up previous subscription if any
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }

      const user = getCurrentUserFull();
      if (!user || !user.id) return;

      const code = user.householdCode;
      const syncKey = code || `user_${user.id}`;
      const docRef = doc(db, 'households', syncKey);

      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const prefix = code ? `_${code}` : '';

          if (data.ingredients) {
            localStorage.setItem(`ingredients${prefix}`, JSON.stringify(data.ingredients));
          }
          if (data['shopping-list']) {
            localStorage.setItem(`shopping-list${prefix}`, JSON.stringify(data['shopping-list']));
          }
          if (data['member-requests']) {
            localStorage.setItem(`member-requests${prefix}`, JSON.stringify(data['member-requests']));
          }

          // Trigger custom event so reactive pages refresh their state
          window.dispatchEvent(new Event('fridgeSync'));
        }
      }, (err) => {
        console.error("Firestore onSnapshot error:", err);
      });
    };

    // Initialize subscriber
    subscribeToHousehold();

    // Re-subscribe when profile updates (like household code updates) or logins happen
    window.addEventListener('profileUpdated', subscribeToHousehold);
    window.addEventListener('storage', subscribeToHousehold);

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('profileUpdated', subscribeToHousehold);
      window.removeEventListener('storage', subscribeToHousehold);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/setup" element={<InitialSetup />} />
        <Route path="/find-password" element={<FindPassword />} />
        <Route path="/home" element={<Home />} />
        <Route path="/ingredients" element={<Ingredients />} />
        <Route path="/cooking" element={<Cooking />} />
        <Route path="/shopping" element={<Shopping />} />
      </Routes>
    </Router>
  );
}

export default App;
