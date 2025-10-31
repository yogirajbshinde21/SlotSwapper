import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

/**
 * HOME/LANDING PAGE
 * 
 * Welcome page with app description and CTAs
 */

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1 className="hero-title">
          🔄 Welcome to <span className="brand">SlotSwapper</span>
        </h1>
        <p className="hero-subtitle">
          Peer-to-peer time slot scheduling made easy
        </p>
        <p className="hero-description">
          Mark your busy calendar slots as swappable and exchange them with others.
          Perfect for managing appointments, meetings, and schedules flexibly.
        </p>

        <div className="cta-buttons">
          {isAuthenticated() ? (
            <>
              <Link to="/dashboard" className="btn btn-primary btn-large">
                Go to Dashboard
              </Link>
              <Link to="/marketplace" className="btn btn-secondary btn-large">
                Browse Marketplace
              </Link>
            </>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-large">
                Get Started
              </Link>
              <Link to="/login" className="btn btn-secondary btn-large">
                Login
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="features-section">
        <h2>How It Works</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Create Your Slots</h3>
            <p>Add your calendar events and mark which ones are busy but swappable.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Browse Marketplace</h3>
            <p>Discover slots from other users that you'd prefer to have instead.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>Request Swaps</h3>
            <p>Send swap requests by offering one of your slots in exchange.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">✅</div>
            <h3>Accept & Swap</h3>
            <p>Review incoming requests and accept swaps that work for you.</p>
          </div>
        </div>
      </div>

      <div className="info-section">
        <h2>Key Features</h2>
        <ul className="features-list">
          <li>✓ Secure authentication with JWT tokens</li>
          <li>✓ Real-time slot availability updates</li>
          <li>✓ Smart swap request management</li>
          <li>✓ Accept or reject swap proposals</li>
          <li>✓ Automatic slot ownership transfer</li>
          <li>✓ Clean and intuitive interface</li>
        </ul>
      </div>
    </div>
  );
};

export default Home;
