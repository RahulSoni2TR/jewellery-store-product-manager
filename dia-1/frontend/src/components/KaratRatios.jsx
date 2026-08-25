import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.DEV ? 'http://localhost:8080' : '';

function KaratRatios({ onSwitchPage }) {
  const [ratios, setRatios] = useState({
    '22.00_percent': '91.67',
    '18.00_percent': '76.00',
    '14.00_percent': '60.00',
    '10.00_percent': '40.00'
  });
  const [initialRatios, setInitialRatios] = useState({});
  const [isEditable, setIsEditable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchRatios();
  }, []);

  const fetchRatios = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/rates`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format from server.");
      }

      const ratesData = await res.json();
      
      const loadedRatios = {
        '22.00_percent': getRatioValue(ratesData, '22.00_percent', '91.67'),
        '18.00_percent': getRatioValue(ratesData, '18.00_percent', '76.00'),
        '14.00_percent': getRatioValue(ratesData, '14.00_percent', '60.00'),
        '10.00_percent': getRatioValue(ratesData, '10.00_percent', '40.00')
      };

      setRatios(loadedRatios);
      setInitialRatios(loadedRatios);
      setErrorMsg('');
    } catch (err) {
      console.error('Error fetching ratios:', err);
      setErrorMsg('Failed to load karat percentages. Using default system values.');
    } finally {
      setLoading(false);
    }
  };

  const getRatioValue = (ratesList, commodity, defaultValue) => {
    const rate = ratesList.find(r => r.commodity === commodity);
    if (!rate || !rate.price) return defaultValue;
    // Database stores as decimal (e.g. 0.9167), UI shows as percentage (e.g. 91.67)
    const pct = parseFloat(rate.price) * 100;
    return pct.toFixed(2).replace(/\.00$/, ''); // Format neatly
  };

  const handleRatioChange = (key, val) => {
    setRatios(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    const payload = {};
    let hasChanges = false;

    for (const key of Object.keys(ratios)) {
      if (ratios[key] !== initialRatios[key]) {
        const parsedVal = parseFloat(ratios[key]);
        if (isNaN(parsedVal) || parsedVal < 0 || parsedVal > 100) {
          alert(`Please enter a valid percentage between 0 and 100 for all fields.`);
          return;
        }
        // UI percentage (e.g. 91.67) converted back to database decimal (e.g. 0.9167)
        payload[key] = (parsedVal / 100).toString();
        hasChanges = true;
      }
    }

    if (!hasChanges) {
      setIsEditable(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/updatePrices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Karat ratios updated successfully!');
        setIsEditable(false);
        fetchRatios();
      } else {
        alert('Failed to save ratio changes.');
      }
    } catch (e) {
      alert('Network error occurred while saving.');
    }
  };

  return (
    <>
      <header className="header">
        <div className="logo">Product <span>Manager</span></div>
        <div className="logout-container">
          <button className="logout-btn" onClick={() => onSwitchPage('login')}>Logout</button>
        </div>
      </header>

      <main className="home-main" style={{ color: '#000000', maxWidth: '520px', margin: '30px auto' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Gold Karat Ratios</h1>
        <p className="subtitle" style={{ marginBottom: '24px', fontSize: '14px', color: '#64748b' }}>
          Configure calculation percentages with respect to 24 Karat gold
        </p>

        {errorMsg && (
          <div style={{
            backgroundColor: '#fffbeb',
            color: '#b45309',
            border: '1px solid #fef3c7',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '20px',
            fontWeight: '500'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>
              Gold 24K Reference Rate
            </label>
            <input 
              type="text" 
              value="100.00 % (Base Rate)" 
              disabled 
              style={{ 
                backgroundColor: '#f1f5f9', 
                color: '#64748b', 
                border: '1px solid #cbd5e1',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '14px',
                width: '100%',
                boxSizing: 'border-box'
              }} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>
              Gold 22K Percentage (%)
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type="text" 
                inputMode="decimal"
                value={loading ? 'Loading...' : ratios['22.00_percent']}
                disabled={!isEditable || loading}
                onChange={e => handleRatioChange('22.00_percent', e.target.value)}
                style={{ 
                  backgroundColor: !isEditable || loading ? '#f1f5f9' : '#ffffff', 
                  color: '#000000', 
                  border: '1px solid #cbd5e1',
                  padding: '12px 30px 12px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  width: '100%',
                  boxSizing: 'border-box'
                }} 
              />
              <span style={{ position: 'absolute', right: '12px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>%</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>
              Gold 18K Percentage (%)
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type="text" 
                inputMode="decimal"
                value={loading ? 'Loading...' : ratios['18.00_percent']}
                disabled={!isEditable || loading}
                onChange={e => handleRatioChange('18.00_percent', e.target.value)}
                style={{ 
                  backgroundColor: !isEditable || loading ? '#f1f5f9' : '#ffffff', 
                  color: '#000000', 
                  border: '1px solid #cbd5e1',
                  padding: '12px 30px 12px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  width: '100%',
                  boxSizing: 'border-box'
                }} 
              />
              <span style={{ position: 'absolute', right: '12px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>%</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>
              Gold 14K Percentage (%)
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type="text" 
                inputMode="decimal"
                value={loading ? 'Loading...' : ratios['14.00_percent']}
                disabled={!isEditable || loading}
                onChange={e => handleRatioChange('14.00_percent', e.target.value)}
                style={{ 
                  backgroundColor: !isEditable || loading ? '#f1f5f9' : '#ffffff', 
                  color: '#000000', 
                  border: '1px solid #cbd5e1',
                  padding: '12px 30px 12px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  width: '100%',
                  boxSizing: 'border-box'
                }} 
              />
              <span style={{ position: 'absolute', right: '12px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>%</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>
              Gold 9K Percentage (%)
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type="text" 
                inputMode="decimal"
                value={loading ? 'Loading...' : ratios['10.00_percent']}
                disabled={!isEditable || loading}
                onChange={e => handleRatioChange('10.00_percent', e.target.value)}
                style={{ 
                  backgroundColor: !isEditable || loading ? '#f1f5f9' : '#ffffff', 
                  color: '#000000', 
                  border: '1px solid #cbd5e1',
                  padding: '12px 30px 12px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  width: '100%',
                  boxSizing: 'border-box'
                }} 
              />
              <span style={{ position: 'absolute', right: '12px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>%</span>
            </div>
          </div>

          <div className="auth-link-container" style={{ gap: '12px', marginTop: '16px' }}>
            {!isEditable ? (
              <button 
                className="action-button" 
                style={{ width: '100%' }} 
                disabled={loading} 
                onClick={() => setIsEditable(true)}
              >
                Modify Ratios
              </button>
            ) : (
              <button 
                className="action-button" 
                style={{ width: '100%' }} 
                onClick={handleSave}
              >
                Save Ratios
              </button>
            )}
            <button 
              className="action-button secondary" 
              style={{ width: '100%' }} 
              onClick={() => onSwitchPage('home')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

export default KaratRatios;
