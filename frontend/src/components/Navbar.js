import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

/**
 * NAVBAR COMPONENT
 * 
 * Navigation bar with links and logout functionality
 */

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          🔄 SlotSwapper
        </Link>

        {isAuthenticated() ? (
          <div className="navbar-menu">
            <Link to="/dashboard" className="navbar-link">
              My Slots
            </Link>
            <Link to="/marketplace" className="navbar-link">
              Marketplace
            </Link>
            <Link to="/requests" className="navbar-link">
              Requests
            </Link>
            <div className="navbar-user">
              <span className="navbar-username">👤 {user?.name}</span>
              <button onClick={handleLogout} className="btn btn-danger btn-small">
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="navbar-menu">
            <Link to="/login" className="navbar-link">
              Login
            </Link>
            <Link to="/register" className="navbar-link">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
