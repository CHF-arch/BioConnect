import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../api/AuthService';
import styles from './Auth.module.css';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hasAccount, setHasAccount] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignUp = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      
      const { user, error } = await authService.signUp({
        email,
        password,
        username,
        displayName: username,
      });

      if (error) {
        setErrorMessage(error.message || 'Sign up failed. Please try again.');
        return;
      }

      if (user) {
        alert('Sign up successful! Please check your email to verify your account.');
        setEmail('');
        setPassword('');
        setUsername('');
      }

    } catch (error: any) {
      setErrorMessage(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const { user, session, error } = await authService.signIn({
        email,
        password,
      });

      if (error) {
        // Handle specific error cases
        let message = error.message || 'Sign in failed. Please try again.';
        
        if (error.status === 400) {
          if (error.message?.includes('Invalid login credentials')) {
            message = 'Invalid email or password. Please check your credentials.';
          } else if (error.message?.includes('Email not confirmed')) {
            message = 'Please verify your email address before signing in.';
          } else {
            message = `Sign in failed: ${error.message}`;
          }
        }
        
        setErrorMessage(message);
        console.error('Sign in error:', error);
        return;
      }

      if (session) {
        console.log('Sign in successful:', { user, session });
        navigate('/');
      } else {
        setErrorMessage('Sign in failed: No session created');
      }

    } catch (error: any) {
      setErrorMessage(error.message || 'An unexpected error occurred');
      console.error('Sign in exception:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (hasAccount) {
      handleSignIn();
    } else {
      handleSignUp();
    }
  };

  return (
    <div className={styles.authContainer}>
      <form onSubmit={handleSubmit} className={styles.authCard}>
        <h3 className={styles.authTitle}>{hasAccount ? 'Login Form' : 'Sign Up Form'}</h3>
        
        {errorMessage && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            backgroundColor: 'var(--danger)',
            color: 'white',
            borderRadius: '8px',
            fontSize: '0.9rem',
          }}>
            {errorMessage}
          </div>
        )}
        
        {!hasAccount && (
          <input 
            className={styles.authInput} 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required
            disabled={loading}
          />
        )}
        
        <input 
          className={styles.authInput} 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required
          disabled={loading}
        />
        
        <input 
          className={styles.authInput} 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required
          disabled={loading}
        />
        
        <button 
          type="submit"
          className={styles.authButton} 
          disabled={loading}
        >
          {loading ? 'Loading...' : (hasAccount ? 'Sign In' : 'Sign Up')}
        </button>
        
        <button 
          type="button"
          className={`${styles.authButton} ${styles.secondary}`} 
          onClick={() => {
            setHasAccount(!hasAccount);
            setEmail('');
            setPassword('');
            setUsername('');
            setErrorMessage(null);
          }}
          disabled={loading}
        >
          {hasAccount ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
        </button>
      </form>
    </div>
  );
}