import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './About.css';

const About = () => {
  return (
    <>
      <Navbar />
      <div className="about-container">
        <div className="container about-content">
          <div className="about-hero">
            <h1 className="about-title">About Athena Nexus</h1>
            <p className="about-tagline">
              "Discipline is the motivation"
            </p>
          </div>

          <div className="about-section">
            <div className="section-icon">🎯</div>
            <h2 className="section-title">What We Do</h2>
            <p className="section-text">
              Athena Nexus is a platform designed for teams of 3 students to participate 
              in weekly coding challenges. Each team can create their own account and submit 
              their projects with GitHub repositories and live demos. We believe that 
              discipline and consistent practice lead to excellence.
            </p>
          </div>

          <div className="about-section">
            <div className="section-icon">⚙️</div>
            <h2 className="section-title">How It Works</h2>
            <ol className="how-it-works-list">
              <li>
                <span className="list-number">1</span>
                <div>
                  <strong>Create Your Account</strong>
                  <p>Register your team and set up your profile with team member information.</p>
                </div>
              </li>
              <li>
                <span className="list-number">2</span>
                <div>
                  <strong>Explore Challenges</strong>
                  <p>Browse weekly challenges created by administrators with descriptions and deadlines.</p>
                </div>
              </li>
              <li>
                <span className="list-number">3</span>
                <div>
                  <strong>Build & Submit</strong>
                  <p>Work on your project and submit it with your GitHub repository and live demo links.</p>
                </div>
              </li>
              <li>
                <span className="list-number">4</span>
                <div>
                  <strong>Get Reviewed</strong>
                  <p>Administrators review and approve submissions based on quality and requirements.</p>
                </div>
              </li>
              <li>
                <span className="list-number">5</span>
                <div>
                  <strong>Showcase Your Work</strong>
                  <p>Approved submissions appear in the public gallery for everyone to see and learn from.</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="about-section highlight-section">
            <div className="section-icon">🚀</div>
            <h2 className="section-title">Join Us</h2>
            <p className="section-text">
              Ready to start your journey? Create your team account today and begin participating 
              in weekly challenges. No need to contact an administrator—you can register directly 
              and start building amazing projects!
            </p>
            <div className="cta-buttons">
              <Link to="/signup" className="btn btn-primary btn-large">
                Create Account
              </Link>
              <Link to="/challenges" className="btn btn-outline btn-large">
                View Challenges
              </Link>
            </div>
          </div>

          <div className="about-section">
            <div className="section-icon">💡</div>
            <h2 className="section-title">Our Philosophy</h2>
            <p className="section-text">
              At Athena Nexus, we believe that discipline is the foundation of motivation. 
              Through consistent practice, weekly challenges, and peer learning, teams develop 
              not just technical skills, but also the discipline needed to excel in their careers. 
              Every submission, every challenge, and every week of practice builds towards excellence.
            </p>
          </div>

          <div className="about-section">
            <div className="section-icon">📧</div>
            <h2 className="section-title">Contact & Support</h2>
            <p className="section-text">
              For questions, technical support, or feedback, please reach out to us through our Telegram channel. 
              We're here to help you succeed in your coding journey.
            </p>
            <div className="contact-link-container">
              <a 
                href="https://t.me/+lykUjnKsSHc5ZDk0" 
                target="_blank" 
                rel="noopener noreferrer"
                className="contact-link"
              >
              >
              >
                <span className="contact-icon">💬</span>
                <span>Join Our Telegram Channel</span>
                <span className="contact-arrow">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;




