import './LandingPage.css'

function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <header className="landing-hero">
        <div className="hero-content">
          <h1 className="hero-title">SpeechPrep</h1>
          <p className="hero-subtitle">Master Public Speaking with AI-Powered Practice</p>
          <p className="hero-description">
            Transform your presentation skills through personalized AI feedback. 
            Practice anytime, anywhere, and get instant insights on your delivery, pacing, and confidence.
          </p>
          <button className="cta-button" onClick={onGetStarted}>
            Start Practicing Now
          </button>
        </div>
      </header>

      {/* Main Aim Section */}
      <section className="landing-section aim-section">
        <div className="container">
          <h2 className="section-title">Our Mission</h2>
          <p className="section-description">
            SpeechPrep empowers individuals to become confident, compelling speakers through 
            structured practice and real-time AI coaching. We believe everyone deserves access 
            to professional-grade feedback that helps them communicate with clarity and impact.
          </p>
        </div>
      </section>

      {/* Target Users Section */}
      <section className="landing-section users-section">
        <div className="container">
          <h2 className="section-title">Perfect For</h2>
          <div className="users-grid">
            <div className="user-card">
              <div className="user-icon">🎓</div>
              <h3>Students</h3>
              <p>
                Ace your presentations and class speeches. Build confidence before 
                that big assignment or thesis defense.
              </p>
            </div>
            <div className="user-card">
              <div className="user-icon">💼</div>
              <h3>Professionals</h3>
              <p>
                Elevate your business presentations, pitches, and team meetings. 
                Make every speaking opportunity count.
              </p>
            </div>
            <div className="user-card">
              <div className="user-icon">🎤</div>
              <h3>Speakers & Presenters</h3>
              <p>
                Refine your delivery, eliminate filler words, and perfect your pacing 
                for conferences, webinars, and keynotes.
              </p>
            </div>
            <div className="user-card">
              <div className="user-icon">🚀</div>
              <h3>Career Changers</h3>
              <p>
                Build essential communication skills for interviews, networking events, 
                and career transitions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="landing-section testimonials-section">
        <div className="container">
          <h2 className="section-title">What Our Users Say</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="stars">★★★★★</div>
              <p className="testimonial-text">
                "SpeechPrep transformed my confidence before my TEDx talk. The AI feedback 
                caught things I never noticed—like my pacing and filler words. I went from 
                nervous to polished in just a few weeks of practice."
              </p>
              <div className="testimonial-author">
                <strong>Sarah Chen</strong>
                <span>Marketing Director</span>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="stars">★★★★★</div>
              <p className="testimonial-text">
                "As a graduate student, I used to dread presentations. SpeechPrep's script 
                drills helped me build fundamentals, and now I can speak confidently in front 
                of my entire department. Game changer!"
              </p>
              <div className="testimonial-author">
                <strong>Marcus Rodriguez</strong>
                <span>PhD Candidate</span>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="stars">★★★★★</div>
              <p className="testimonial-text">
                "The topic-based practice with time limits is exactly what I needed for 
                job interviews. I can now deliver concise, impactful answers under pressure. 
                Highly recommend for anyone preparing for important conversations."
              </p>
              <div className="testimonial-author">
                <strong>Emily Thompson</strong>
                <span>Software Engineer</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-section cta-section">
        <div className="container">
          <h2 className="section-title">Ready to Improve Your Speaking Skills?</h2>
          <p className="section-description">
            Join thousands of users who are building confidence and mastering public speaking.
          </p>
          <button className="cta-button cta-button-large" onClick={onGetStarted}>
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Contact Us</h4>
              <p>Phone: <a href="tel:+1-555-0123">+1 (555) 012-3456</a></p>
              <p>Email: <a href="mailto:support@speechprep.com">support@speechprep.com</a></p>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <p>
                <a href="#terms">Terms & Conditions</a>
              </p>
              <p>
                <a href="#privacy">Privacy Policy</a>
              </p>
            </div>
            <div className="footer-section">
              <h4>SpeechPrep</h4>
              <p>© {new Date().getFullYear()} SpeechPrep. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage

