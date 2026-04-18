import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  Shield, User, ArrowRight, Zap, Activity,
  AlertCircle, BarChart3, Users, MapPin, Clock
} from 'lucide-react';

export const LoginSelect = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const staffCardRef = useRef<HTMLAnchorElement>(null);
  const customerCardRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 });
    if (staffCardRef.current) {
      tl.fromTo(staffCardRef.current,
        { opacity: 0, y: 40, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6 },
        '-=0.2'
      );
    }
    if (customerCardRef.current) {
      tl.fromTo(customerCardRef.current,
        { opacity: 0, y: 40, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6 },
        '-=0.4'
      );
    }
  }, []);

  return (
    <div ref={containerRef} className="login-select-page">
      {/* Ambient background effects */}
      <div className="ls-bg-glow ls-bg-glow-1" />
      <div className="ls-bg-glow ls-bg-glow-2" />
      <div className="ls-bg-glow ls-bg-glow-3" />

      {/* Floating grid lines */}
      <div className="ls-grid-overlay" />

      {/* Top nav */}
      <nav className="ls-nav">
        <Link to="/" className="ls-nav-brand">
          <Shield className="w-5 h-5" />
          <span>Rapid Crisis</span>
        </Link>
      </nav>

      {/* Main content */}
      <div className="ls-content">
        <div className="ls-header">
          <div className="ls-badge">
            <span className="ls-badge-dot" />
            SECURE ACCESS PORTAL
          </div>
          <h1 className="ls-title">Choose Your Portal</h1>
          <p className="ls-subtitle">
            Select your role to access the appropriate dashboard
          </p>
        </div>

        <div className="ls-cards">
          {/* Staff Card */}
          <Link
            ref={staffCardRef}
            to="/login?role=staff"
            className="ls-card ls-card-staff"
            id="login-select-staff"
          >
            <div className="ls-card-glow" />
            <div className="ls-card-shine" />

            <div className="ls-card-icon-wrap ls-icon-staff">
              <Shield className="w-10 h-10" />
            </div>

            <h2 className="ls-card-title">Staff Portal</h2>
            <p className="ls-card-desc">
              Access the command center to manage incidents, dispatch help, and coordinate response teams.
            </p>

            <div className="ls-card-features">
              <div className="ls-card-feature">
                <AlertCircle className="w-4 h-4" />
                <span>Show Issues</span>
              </div>
              <div className="ls-card-feature">
                <Zap className="w-4 h-4" />
                <span>Send Help</span>
              </div>
              <div className="ls-card-feature">
                <Users className="w-4 h-4" />
                <span>Manage Staff</span>
              </div>
              <div className="ls-card-feature">
                <Activity className="w-4 h-4" />
                <span>Mask / CAT</span>
              </div>
            </div>

            <div className="ls-card-cta">
              <span>Enter Staff Portal</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Customer Card */}
          <Link
            ref={customerCardRef}
            to="/login?role=customer"
            className="ls-card ls-card-customer"
            id="login-select-customer"
          >
            <div className="ls-card-glow" />
            <div className="ls-card-shine" />

            <div className="ls-card-icon-wrap ls-icon-customer">
              <User className="w-10 h-10" />
            </div>

            <h2 className="ls-card-title">Customer Portal</h2>
            <p className="ls-card-desc">
              Report emergencies, track issue status, view history and severity analytics in real-time.
            </p>

            <div className="ls-card-features">
              <div className="ls-card-feature">
                <AlertCircle className="w-4 h-4" />
                <span>Raise Issue</span>
              </div>
              <div className="ls-card-feature">
                <Clock className="w-4 h-4" />
                <span>Status Check</span>
              </div>
              <div className="ls-card-feature">
                <BarChart3 className="w-4 h-4" />
                <span>Heat Maps</span>
              </div>
              <div className="ls-card-feature">
                <MapPin className="w-4 h-4" />
                <span>Severity %</span>
              </div>
            </div>

            <div className="ls-card-cta">
              <span>Enter Customer Portal</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        <p className="ls-footer-text">
          Don't have an account? <Link to="/register" className="ls-register-link">Create one</Link>
        </p>
      </div>
    </div>
  );
};
