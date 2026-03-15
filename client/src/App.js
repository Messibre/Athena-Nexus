import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import { fetchMe } from './store/authSlice';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Submit from './pages/Submit';
import Settings from './pages/Settings';
import Challenges from './pages/Challenges';
import Gallery from './pages/Gallery';
import AdminPanel from './pages/AdminPanel';
import About from './pages/About';

import './App.css';

function App() {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme.theme);
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchMe());
    }
  }, [token, user, dispatch]);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/gallery/:weekId" element={<Gallery />} />
          <Route path="/about" element={<About />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/submit"
            element={
              <PrivateRoute>
                <Submit />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
