import React from 'react';
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

function App() {
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
