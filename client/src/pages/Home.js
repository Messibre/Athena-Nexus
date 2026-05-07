import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import { fetchPublicStats } from "../redux/thunks/weeksThunks";
import {
  selectPublicStats,
  selectWeeksLoading,
} from "../redux/selectors/weeksSelectors";
import { selectTheme } from "../redux/selectors/themeSelectors";
import "./Home.css";

const Home = () => {
  const dispatch = useDispatch();
  const stats = useSelector(selectPublicStats);
  const loading = useSelector(selectWeeksLoading);
  const theme = useSelector(selectTheme);

  const [isVisible, setIsVisible] = useState(false);
  const statsRef = useRef(null);
  const [countersAnimated, setCountersAnimated] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    dispatch(fetchPublicStats());
  }, [dispatch]);

  useEffect(() => {
    const currentRef = statsRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !countersAnimated && !loading) {
            setCountersAnimated(true);
            setTimeout(() => {
              animateCounters();
            }, 100);
          }
        });
      },
      { threshold: 0.5 },
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [countersAnimated, loading]);

  const animateCounters = () => {
    const statNumbers = document.querySelectorAll(".stat-number");
    statNumbers.forEach((stat) => {
      const target = parseInt(stat.getAttribute("data-target")) || 0;
      if (target === 0) {
        stat.textContent = "0";
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

  const displayStats = {
    totalUsers: stats?.totalUsers || 0,
    totalWeeks: stats?.totalWeeks || 0,
    totalSubmissions: stats?.totalSubmissions || 0,
  };

  return (
    <div data-theme={theme}>
      <Navbar />

      <div className="bg-image-layer" />

      <main className="home-container">
        <section
          className={`hero-section ${isVisible ? "visible-state" : "hidden-state"}`}
        >
          <div className="hero-badge">
            <span>Where Excellence Meets Discipline</span>
          </div>

          <h1 className="hero-title">
            <span className="athena-text">Athena</span>
            <span className="title-gradient">Nexus</span>
          </h1>

          <div className="quote-container">
            <span className="quote-mark left">"</span>
            <p className="quote-text">Discipline is the motivation</p>
            <span className="quote-mark right">"</span>
          </div>

          <p className="hero-desc">
            Weekly project challenges for teams of 3. Submit your GitHub repos,
            showcase your work, and grow through disciplined practice.
          </p>

          <div className="btn-group">
            <Link to="/challenges" className="btn-primary">
              View Challenges
            </Link>
            <Link to="/signup" className="btn-primary">
              Register Now
            </Link>
          </div>
        </section>

        <section
          className={`feature-grid ${isVisible ? "visible-state" : "hidden-state"}`}
        >
          {[
            {
              title: "Weekly Challenges",
              desc: "Fresh prompts every week to sharpen your full-stack skills.",
            },
            {
              title: "Milestones",
              desc: "Unlock levels and categories as your team masters new tech.",
            },
            {
              title: "Public Gallery",
              desc: "Display your repos to the community and get inspired.",
            },
          ].map((feature, idx) => (
            <div key={idx} className="feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </section>

        <section
          ref={statsRef}
          className={`stats-section ${isVisible ? "visible-state" : "hidden-state"}`}
        >
          <div className="stats-grid">
            {[
              { label: "Active Teams", target: displayStats.totalUsers },
              { label: "Challenges", target: displayStats.totalWeeks },
              { label: "Submissions", target: displayStats.totalSubmissions },
            ].map((stat, idx) => (
              <div key={idx} className="stat-item">
                <span className="stat-number" data-target={stat.target}>
                  0
                </span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
