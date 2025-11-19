import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import Navbar from '../components/Navbar';
import './Home.css';

const Home = () => {
  const [isVisible, setIsVisible] = useState(false);
  const statsRef = useRef(null);
  const [countersAnimated, setCountersAnimated] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWeeks: 0,
    totalSubmissions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/weeks/stats/public');
      setStats({
        totalUsers: response.data.totalUsers || 0,
        totalWeeks: response.data.totalWeeks || 0,
        totalSubmissions: response.data.totalSubmissions || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Keep default values of 0 on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentRef = statsRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !countersAnimated && !loading) {
            setCountersAnimated(true);
            // Small delay to ensure stats are set
            setTimeout(() => {
              animateCounters();
            }, 100);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(currentRef);

    return () => {
      observer.unobserve(currentRef);
    };
  }, [countersAnimated, loading]);

  const animateCounters = () => {
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach((stat) => {
      const target = parseInt(stat.getAttribute('data-target')) || 0;
      if (target === 0) {
        stat.textContent = '0';
        return;
      }
      const duration = 2000;
      const increment = target / (duration / 16);
      let current = 0;

      const updateCounter = () => {
        current += increment;
        if (current < target) {
          stat.textContent = Math.floor(current);
          requestAnimationFrame(updateCounter);
        } else {
          stat.textContent = target;
        }
      };

      updateCounter();
    });
  };

  return (
    <>
      <Navbar />
      <div className="home-container">
        {/* Animated Background */}
        <div className="animated-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
          <div className="particles">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="particle" style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}></div>
            ))}
          </div>
        </div>

        <div className="container">
          {/* Hero Section */}
          <div className={`hero-section ${isVisible ? 'fade-in' : ''}`}>
            <div className="hero-content">
              <div className="hero-badge">
                <span className="badge-text">⚡ Where Excellence Meets Discipline</span>
              </div>
              <h1 className="hero-title">
                <span className="title-line">Athena</span>
                <span className="title-line highlight">Nexus</span>
              </h1>
              <div className="quote-container">
                <div className="quote-mark quote-mark-left">"</div>
                <p className="hero-quote">
                  Discipline is the motivation
                </p>
                <div className="quote-mark quote-mark-right">"</div>
              </div>
              <p className="hero-description">
                Weekly project challenges for teams of 3. Submit your GitHub repos and live demos, 
                showcase your work, and grow together through disciplined practice.
              </p>
              <div className="hero-buttons">
                <Link to="/challenges" className="btn btn-primary btn-animated">
                  <span>View Challenges</span>
                  <span className="btn-icon">→</span>
                </Link>
                <Link to="/gallery" className="btn btn-outline btn-animated">
                  <span>View Gallery</span>
                  <span className="btn-icon">🎨</span>
                </Link>
                <Link to="/signup" className="btn btn-success btn-animated">
                  <span>Register Team</span>
                  <span className="btn-icon">🚀</span>
                </Link>
                <Link to="/login" className="btn btn-secondary btn-animated">
                  <span>Login</span>
                  <span className="btn-icon">🔐</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className={`features-section ${isVisible ? 'slide-up' : ''}`}>
            <div className="features-grid">
              <div className="feature-card card-hover">
                <div className="feature-icon">📅</div>
                <h3 className="feature-title">Weekly Challenges</h3>
                <p className="feature-description">
                  Each week brings a new challenge. Build projects, learn new skills, and push your boundaries.
                </p>
                <div className="feature-shine"></div>
              </div>
              <div className="feature-card card-hover">
                <div className="feature-icon">💻</div>
                <h3 className="feature-title">Team Submissions</h3>
                <p className="feature-description">
                  Submit your GitHub repository and live demo. Show the world what your team can build.
                </p>
                <div className="feature-shine"></div>
              </div>
              <div className="feature-card card-hover">
                <div className="feature-icon">🖼️</div>
                <h3 className="feature-title">Public Gallery</h3>
                <p className="feature-description">
                  Browse approved submissions from all teams. Get inspired and see what others are building.
                </p>
                <div className="feature-shine"></div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div ref={statsRef} className={`stats-section ${isVisible ? 'fade-in-delay' : ''}`}>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number" data-target={stats.totalUsers}>0</div>
                <div className="stat-label">Active Teams</div>
              </div>
              <div className="stat-item">
                <div className="stat-number" data-target={stats.totalWeeks}>0</div>
                <div className="stat-label">Challenges</div>
              </div>
              <div className="stat-item">
                <div className="stat-number" data-target={stats.totalSubmissions}>0</div>
                <div className="stat-label">Submissions</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;

