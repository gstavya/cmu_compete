import React, { useState } from "react";
import { auth, googleAuthProvider } from "../firebase";
import { signInWithPopup } from "firebase/auth";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateCMUEmail = (email) => {
    return email && email.endsWith('@andrew.cmu.edu');
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting to sign in with Google...');
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;
      
      console.log('User signed in:', user.email);
      
      // Validate CMU email
      if (!validateCMUEmail(user.email)) {
        console.error('Invalid email domain:', user.email);
        await auth.signOut(); // Sign out non-CMU users
        setError('Please use your CMU AndrewID email (@andrew.cmu.edu)');
        return;
      }
      
      console.log('CMU email validated successfully');
      
    } catch (err) {
      console.error("Login failed:", err);
      
      // Handle specific error types
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelled. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked. Please allow popups for this site.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection.');
      } else {
        setError(`Login failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '100px',
        height: '100px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite'
      }}></div>
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '15%',
        width: '60px',
        height: '60px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '50%',
        animation: 'float 4s ease-in-out infinite reverse'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '20%',
        width: '80px',
        height: '80px',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite'
      }}></div>

      {/* Main Login Card */}
      <div style={{
        backgroundColor: 'white',
        padding: '50px 40px',
        borderRadius: '30px',
        boxShadow: '0 30px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
        textAlign: 'center',
        width: '450px',
        maxWidth: '90vw',
        position: 'relative',
        transform: 'scale(1)',
        transition: 'all 0.3s ease-in-out',
        backdropFilter: 'blur(10px)'
      }}
      onMouseOver={(e) => {
        e.target.style.transform = 'scale(1.02)';
        e.target.style.boxShadow = '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.2)';
      }}
      onMouseOut={(e) => {
        e.target.style.transform = 'scale(1)';
        e.target.style.boxShadow = '0 30px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)';
      }}>
        
        {/* Logo/Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          borderRadius: '50%',
          margin: '0 auto 30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(220,38,38,0.3)',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          <span style={{
            color: 'white',
            fontSize: '36px',
            fontWeight: 'bold'
          }}>C</span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '42px',
          fontWeight: '900',
          marginBottom: '15px',
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-1px'
        }}>CMU Compete</h1>

        {/* Subtitle */}
        <p style={{
          marginBottom: '35px',
          color: '#666',
          fontSize: '18px',
          fontWeight: '500',
          lineHeight: '1.5'
        }}>Join the ultimate sports competition at CMU!</p>

        {/* Error Message */}
        {error && (
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            color: '#991b1b',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '18px 30px',
            fontSize: '18px',
            fontWeight: 'bold',
            borderRadius: '50px',
            background: loading ? '#9ca3af' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
            color: 'white',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 8px 25px rgba(220,38,38,0.4)',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            opacity: loading ? 0.7 : 1
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 12px 35px rgba(220,38,38,0.6)';
            }
          }}
          onMouseOut={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 25px rgba(220,38,38,0.4)';
            }
          }}
        >
          <span style={{ position: 'relative', zIndex: 1 }}>
            {loading ? '🔄 Signing in...' : '🏓 Login with AndrewID'}
          </span>
        </button>

        {/* Info Text */}
        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#fef2f2',
          borderRadius: '15px',
          border: '1px solid #fecaca'
        }}>
          <p style={{
            margin: '0',
            fontSize: '14px',
            color: '#991b1b',
            fontWeight: '500'
          }}>
            🔐 Use your CMU AndrewID email to access the platform
          </p>
        </div>

        {/* Features */}
        <div style={{
          marginTop: '25px',
          display: 'flex',
          justifyContent: 'space-around',
          fontSize: '12px',
          color: '#666'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', marginBottom: '5px' }}>🏆</div>
            <div>ELO Rankings</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', marginBottom: '5px' }}>⚔️</div>
            <div>Challenges</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', marginBottom: '5px' }}>📊</div>
            <div>Statistics</div>
          </div>
        </div>
      </div>

    </div>
  );
}
