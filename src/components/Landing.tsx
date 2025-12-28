import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './Landing.css'
import '../App.css'

export default function Landing() {
  const headerRef = useRef<HTMLDivElement>(null)
  const card1Ref = useRef<HTMLDivElement>(null)
  const card2Ref = useRef<HTMLDivElement>(null)
  const card3Ref = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLElement>(null)

  const [visible, setVisible] = useState<Set<string>>(new Set())

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-fade-id')
            if (id) {
              setVisible((prev) => new Set(prev).add(id))
            }
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    const elements = [headerRef, card1Ref, card2Ref, card3Ref, footerRef]
    elements.forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current)
      }
    })

    return () => {
      elements.forEach((ref) => {
        if (ref.current) {
          observer.unobserve(ref.current)
        }
      })
    }
  }, [])

  return (
    <div className="landing-page">
      <section className="landing">
        <header
          ref={headerRef}
          data-fade-id="header"
          className={`landing-header ${visible.has('header') ? 'fade-in' : ''}`}
        >
          <div>
            <h1 className="landing-title">SpeechPrep</h1>
            <p className="landing-tagline">
              Practise real presentations with AI that listens, scores, and coaches you to improve.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to="/auth" className="link-button" style={{ fontSize: '0.9rem' }}>
              Log in
            </Link>
            <Link to="/practice" className="primary landing-cta">
              Start practising now
            </Link>
          </div>
        </header>

        <div className="landing-cards-vertical">
          <div
            ref={card1Ref}
            data-fade-id="card1"
            className={`landing-card ${visible.has('card1') ? 'fade-in' : ''}`}
            style={{ animationDelay: '0.1s' }}
          >
            <h2>Why SpeechPrep?</h2>
            <p>
              Most people rehearse alone and never get honest feedback. SpeechPrep turns any spare
              five minutes into focused, camera-on practice with an AI speaking coach.
            </p>
            <ul className="landing-list">
              <li>Record with your real camera and mic, just like going on stage.</li>
              <li>Get instant scores on clarity, pacing, confidence, and structure.</li>
              <li>See how your performance trends over multiple sessions.</li>
            </ul>
          </div>

          <div
            ref={card2Ref}
            data-fade-id="card2"
            className={`landing-card ${visible.has('card2') ? 'fade-in' : ''}`}
            style={{ animationDelay: '0.2s' }}
          >
            <h2>Built for</h2>
            <ul className="user-types">
              <li>
                <strong>Students &amp; job seekers</strong>
                <span>Practice class presentations, project demos, and interview answers.</span>
              </li>
              <li>
                <strong>Founders &amp; creators</strong>
                <span>Refine pitches, investor updates, and short-form video scripts.</span>
              </li>
              <li>
                <strong>Professionals &amp; leaders</strong>
                <span>Rehearse keynotes, team updates, and tough conversations safely.</span>
              </li>
            </ul>
          </div>

          <div
            ref={card3Ref}
            data-fade-id="card3"
            className={`landing-card landing-testimonials ${visible.has('card3') ? 'fade-in' : ''}`}
            style={{ animationDelay: '0.3s' }}
          >
            <h2>What people say</h2>
            <div className="testimonial">
              <div className="stars">★★★★★</div>
              <p>
                "After a week with SpeechPrep my slides didn't change—but the way I delivered
                them did. I finally sound confident instead of rushed."
              </p>
              <span className="testimonial-name">— Maya, product designer</span>
            </div>
            <div className="testimonial">
              <div className="stars">★★★★★</div>
              <p>
                "As a founder I pitch constantly. Having an AI coach that tracks my scores over
                time has made every investor meeting feel smoother."
              </p>
              <span className="testimonial-name">— Leo, startup founder</span>
            </div>
            <div className="testimonial">
              <div className="stars">★★★★★</div>
              <p>
                "I use SpeechPrep before big team meetings. It's like a mirror that actually
                tells you what to fix."
              </p>
              <span className="testimonial-name">— Amina, engineering manager</span>
            </div>
          </div>
        </div>
      </section>

      <footer
        ref={footerRef}
        data-fade-id="footer"
        className={`footer ${visible.has('footer') ? 'fade-in' : ''}`}
        style={{ animationDelay: '0.4s' }}
      >
        <div className="footer-inner">
          <div className="footer-left">
            <span className="footer-brand">SpeechPrep</span>
            <span className="footer-copy">
              © {new Date().getFullYear()} SpeechPrep. All rights reserved.
            </span>
            <p className="footer-terms">
              SpeechPrep is a practice tool and does not replace professional coaching. By using the
              app you agree to use recordings responsibly and to keep your own content backed up.
            </p>
          </div>
          <div className="footer-right">
            <h3>Contact us</h3>
            <p className="footer-contact">
              Phone: <a href="tel:+15550001234">+1 (555) 000‑1234</a>
              <br />
              Email:{' '}
              <a href="mailto:hello@speechprep.app">
                hello@speechprep.app
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

