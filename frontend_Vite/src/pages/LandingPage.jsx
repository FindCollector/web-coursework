import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css'; // We will create this CSS file next

function LandingPage() {
  const navigate = useNavigate();

  const handleJoinUsClick = () => {
    navigate('/login'); // Assuming '/login' is the path to the login page
  };

  return (
    <div className="landing-page">
      <header className="landing-header">
        <h1>Welcome to Your Fitness Journey!</h1>
        <p>Achieve your goals with us through personalized training.</p>
        <button className="join-us-button" onClick={handleJoinUsClick}>
          Join Us
        </button>
      </header>

      {/* Features Section */}
      <section className="features-section">
        <div className="feature-card">
          <img
            src="https://images.unsplash.com/photo-1549476464-37392f717541?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" // Another image: Graph and equipment
            alt="Personalized Plans Tracking"
            className="card-image"
          />
          <div className="card-content">
            <h3>Personalized Plans</h3>
            <p>Tailored workout routines designed specifically for your goals and tracked progress.</p>
          </div>
        </div>
        <div className="feature-card">
          <img
            src="https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80" // Dumbbells image
            alt="Expert Guidance"
            className="card-image"
          />
          <div className="card-content">
            <h3>Expert Guidance</h3>
            <p>One-on-one sessions with certified personal trainers focusing on technique and motivation.</p>
          </div>
        </div>
        <div className="feature-card">
          <img
            src="https://images.unsplash.com/photo-1576678927484-cc907957088c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80" // Equipment/Space image
            alt="Modern Equipment"
            className="card-image"
          />
          <div className="card-content">
            <h3>Quality Equipment</h3>
            <p>Access to state-of-the-art fitness equipment in a supportive environment.</p>
          </div>
        </div>
      </section>

    </div>
  );
}

export default LandingPage; 