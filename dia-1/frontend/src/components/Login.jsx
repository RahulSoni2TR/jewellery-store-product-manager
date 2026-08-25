import { useState } from 'react';

const API_BASE = import.meta.env.DEV ? 'http://localhost:8080' : '';

function Login({ onSwitchPage, onOpenModal, onLoginSuccess, licenseStatus, licenseDetails, onLicenseActivated }) {
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [copied, setCopied] = useState(false);
  const [activationKey, setActivationKey] = useState('');
  const [activating, setActivating] = useState(false);

  const handleCopyMachineId = () => {
    const id = licenseDetails?.machineId || '';
    if (id) {
      navigator.clipboard.writeText(id).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/process-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(loginData).toString(),
        credentials: 'include', // Include cookies
      });

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const body = isJson ? await response.json() : await response.text();

      if (response.ok && isJson && body.success) {
        const userData = { username: body.username, roles: body.roles || [] };
        onLoginSuccess(userData);
        onSwitchPage('home');
      } else {
        if (response.status === 402 || (isJson && (body?.error === 'TRIAL_EXPIRED' || body?.status === 'EXPIRED'))) {
          if (onLicenseActivated) {
            onLicenseActivated();
          }
        } else {
          const errorMessage =
            (isJson && body?.message) ||
            (typeof body === 'string' && body) ||
            'Login failed. Please check your credentials.';
          onOpenModal(errorMessage);
        }
      }
    } catch (error) {
      onOpenModal('Network error. Please try again.');
    }
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    setActivating(true);
    try {
      const response = await fetch(`${API_BASE}/api/license/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ licenseKey: activationKey }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        onOpenModal('License activated successfully! App is now unlocked.');
        if (onLicenseActivated) {
          onLicenseActivated();
        }
      } else {
        onOpenModal(data.message || 'Invalid activation key.');
      }
    } catch (error) {
      onOpenModal('Activation failed. Connection error.');
    } finally {
      setActivating(false);
    }
  };

  const isLocked = licenseStatus === 'EXPIRED' || licenseStatus === 'TAMPERED';

  if (isLocked) {
    return (
      <div className="auth-container" style={{ 
        maxWidth: '460px', 
        padding: '10px 5px',
        margin: '10px auto',
        textAlign: 'center'
      }}>
        {/* Branded Teal Lock Icon */}
        <div style={{
          background: '#e6f4f1',
          borderRadius: '50%',
          padding: '16px',
          display: 'inline-flex',
          marginBottom: '20px',
          border: '1px solid #ccebe5'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="#009579" strokeWidth="2" strokeLinejoin="round" />
            <path d="M12 17V15" stroke="#009579" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="#009579" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: '#1e293b', 
          marginBottom: '10px',
          letterSpacing: '-0.3px'
        }}>
          Activation Required
        </h1>

        <p style={{
          fontSize: '14px',
          color: '#64748b',
          marginBottom: '24px',
          lineHeight: '1.45'
        }}>
          Your trial period has ended. Please enter your license key to restore access to the application.
        </p>

        {/* Warning Alert Banner */}
        <div style={{
          backgroundColor: licenseStatus === 'TAMPERED' ? '#fff1f2' : '#fffbeb',
          color: licenseStatus === 'TAMPERED' ? '#991b1b' : '#b45309',
          border: licenseStatus === 'TAMPERED' ? '1px solid #fecdd3' : '1px solid #fef3c7',
          padding: '14px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          lineHeight: '1.5',
          textAlign: 'left',
          fontWeight: '500',
          marginBottom: '24px',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start'
        }}>
          <span style={{ fontSize: '16px', lineHeight: '1' }}>⚠️</span>
          <span>
            {licenseStatus === 'TAMPERED'
              ? 'System tampering or clock rollback detected. Please reach out to the system administrator to restore access.'
              : 'Your trial has expired. Please reach out to the system administrator to get the full version.'}
          </span>
        </div>

        {/* Machine ID Box */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '24px',
          textAlign: 'left'
        }}>
          <span style={{ 
            fontSize: '11px', 
            textTransform: 'uppercase', 
            color: '#64748b', 
            fontWeight: '600', 
            letterSpacing: '0.7px', 
            marginBottom: '8px', 
            display: 'block' 
          }}>
            Your Machine ID
          </span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <code style={{
              fontFamily: 'SFMono-Regular, Consolas, Monaco, monospace',
              fontSize: '15px',
              color: '#0f172a',
              fontWeight: '700',
              letterSpacing: '1px',
              flex: '1'
            }}>
              {licenseDetails?.machineId || 'Retrieving Machine ID...'}
            </code>
            <button 
              type="button"
              onClick={handleCopyMachineId}
              style={{
                background: copied ? '#dcfce7' : '#f1f5f9',
                color: copied ? '#15803d' : '#475569',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                whiteSpace: 'nowrap'
              }}
            >
              {copied ? '✓ Copied' : 'Copy ID'}
            </button>
          </div>
          <span style={{ 
            fontSize: '11px', 
            color: '#94a3b8', 
            display: 'block', 
            marginTop: '8px',
            lineHeight: '1.4'
          }}>
            Provide this ID to your administrator to obtain your license activation key.
          </span>
        </div>

        {/* Activation Form */}
        <form className="auth-form" onSubmit={handleActivate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>
              Activation Key
            </label>
            <textarea
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontFamily: 'SFMono-Regular, Consolas, monospace',
                fontSize: '12px',
                lineHeight: '1.5',
                resize: 'none',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'all 0.2s',
                backgroundColor: '#fff',
                color: '#334155'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#009579';
                e.target.style.boxShadow = '0 0 0 3px rgba(0, 149, 121, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="Paste the Base64 activation key here..."
              required
              value={activationKey}
              onChange={(e) => setActivationKey(e.target.value)}
              disabled={activating}
            />
          </div>
          <input
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#fff',
              background: 'linear-gradient(90deg, #009579, #007bff)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 6px 12px rgba(0, 149, 121, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
            }}
            value={activating ? "Verifying..." : "Activate License"}
            disabled={activating}
          />
        </form>
      </div>
    );
  }

  const showTrialBanner = licenseStatus === 'TRIAL';

  return (
    <div className="auth-container">
      {showTrialBanner && (
        <div style={{
          backgroundColor: '#e6f4ea',
          color: '#137333',
          padding: '10px 15px',
          borderRadius: '6px',
          marginBottom: '20px',
          border: '1px solid #ceead6',
          fontSize: '13px',
          textAlign: 'center',
          fontWeight: '500',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          Running in Trial Mode. <strong>{licenseDetails?.daysRemaining} days remaining</strong>.
        </div>
      )}
      <h1>Login</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Enter your email"
          required
          value={loginData.username}
          onChange={(event) => setLoginData({ ...loginData, username: event.target.value })}
        />
        <input
          type="password"
          name="password"
          placeholder="Enter your password"
          required
          value={loginData.password}
          onChange={(event) => setLoginData({ ...loginData, password: event.target.value })}
        />
        <input type="submit" className="action-button" value="Login" />
      </form>
      <div className="auth-link-container">
        <button type="button" className="dropdown-item" onClick={() => onSwitchPage('forgot')}>
          Forgot password?
        </button>
        <button type="button" className="dropdown-item" onClick={() => onSwitchPage('reset')}>
          Reset password?
        </button>
        <button type="button" className="action-button secondary" style={{ marginTop: '10px', width: '100%' }} onClick={() => onSwitchPage('signup')}>
          Signup
        </button>
        <button type="button" className="action-button secondary" style={{ marginTop: '10px', width: '100%' }} onClick={() => onSwitchPage('view-rates')}>
          View Public Rates
        </button>
      </div>
    </div>
  );
}

export default Login;