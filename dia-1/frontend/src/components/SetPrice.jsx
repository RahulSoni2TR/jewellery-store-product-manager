import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.DEV ? 'http://localhost:8080' : '';

function SetPrice({ onSwitchPage }) {
  const [prices, setPrices] = useState({});
  const [initialPrices, setInitialPrices] = useState({});
  const [frequency, setFrequency] = useState('');
  const [isEditable, setIsEditable] = useState(false);
  const [priceLabel, setPriceLabel] = useState('Loading prices...');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ratesRes, freqRes] = await Promise.all([
        fetch(`${API_BASE}/rates`, { credentials: 'include' }),
        fetch(`${API_BASE}/frequency`, { credentials: 'include' })
      ]);
      
      // Check HTTP status first
      if (!ratesRes.ok) {
        const errorText = await ratesRes.text();
        console.error('Failed to fetch /rates (HTTP error):', ratesRes.status, errorText);
        throw new Error(`Failed to fetch rates: Server responded with status ${ratesRes.status}.`);
      }
      if (!freqRes.ok) {
        const errorText = await freqRes.text();
        console.error('Failed to fetch /frequency (HTTP error):', freqRes.status, errorText);
        throw new Error(`Failed to fetch frequency: Server responded with status ${freqRes.status}.`);
      }

      // Then, check Content-Type to ensure it's JSON
      const ratesContentType = ratesRes.headers.get("content-type");
      const freqContentType = freqRes.headers.get("content-type");

      if (!ratesContentType || !ratesContentType.includes("application/json")) {
        throw new Error("Server returned non-JSON for /rates. Please try logging in again.");
      }
      if (!freqContentType || !freqContentType.includes("application/json")) {
        throw new Error("Server returned non-JSON for /frequency. Please try logging in again.");
      }

      const ratesData = await ratesRes.json();
      const freqData = await freqRes.json();

      const frequencyValue = typeof freqData === 'number'
        ? freqData
        : (freqData?.frequency ?? freqData);

      const pricesObj = {};
      ratesData.forEach(rate => {
        pricesObj[rate.commodity] = rate.price;
      });

      setPrices(pricesObj);
      setInitialPrices(pricesObj);
      setFrequency(frequencyValue?.toString?.() ?? '');
      
      const getP = (c) => ratesData.find(i => i.commodity === c)?.price || 'N/A';
      setPriceLabel(`Gold 9k: ₹${getP('10.00')} | Gold 14k: ₹${getP('14.00')} | Gold 18k: ₹${getP('18.00')} | Gold 22k: ₹${getP('22.00')} | Gold 24k: ₹${getP('24.00')} | Silver: ₹${getP('silver')} | Diamond: ₹${getP('diamond')} | GST: ${getP('gst')}%`);
    } catch (error) {
      console.error('Error fetching data:', error);
      setPriceLabel(`Error loading prices: ${error.message || 'Unknown error'}`);
    }
  };

  const handlePriceChange = (commodity, value) => {
    const updated = { ...prices, [commodity]: value };
    
    // If 24K price changes, automatically calculate other karats (unless overridden/modified afterwards)
    if (commodity === '24.00') {
      const base24 = parseFloat(value);
      if (!isNaN(base24) && base24 > 0) {
        const ratios = {
          '22.00': parseFloat(prices['22.00_percent']) || 0.9167,
          '18.00': parseFloat(prices['18.00_percent']) || 0.76,
          '14.00': parseFloat(prices['14.00_percent']) || 0.60,
          '10.00': parseFloat(prices['10.00_percent']) || 0.40
        };
        Object.entries(ratios).forEach(([k, ratio]) => {
          const calculatedVal = Math.round((base24 * ratio) / 10) * 10;
          updated[k] = calculatedVal.toString();
        });
      }
    }
    setPrices(updated);
  };

  const handleSave = async () => {
    const changedPrices = {};
    let hasPriceChanges = false;

    Object.keys(prices).forEach(key => {
      if (key !== 'prod_freq') {
        const val = prices[key];
        const initialVal = initialPrices[key];
        if (val !== initialVal) {
          changedPrices[key] = val;
          hasPriceChanges = true;
        }
      }
    });

    try {
      const requests = [];
      if (hasPriceChanges) {
        requests.push(
          fetch(`${API_BASE}/updatePrices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(changedPrices)
          })
        );
      }

      requests.push(
        fetch(`${API_BASE}/frequency`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ frequency: parseInt(frequency, 10) })
        })
      );

      const responses = await Promise.all(requests);

      if (responses.every(r => r.ok)) {
        localStorage.setItem("pricesUpdatedToday", new Date().toDateString());
        alert('Prices and frequency updated successfully!');
        setIsEditable(false);
        fetchData();
      } else {
        alert('Failed to save changes.');
      }
    } catch (e) {
      alert('Network error occurred.');
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

      <div className="scrolling-prices-container">
        <div className="scrolling-prices">
          <span className="scrolling-text">{priceLabel}</span>
        </div>
      </div>

      <main className="home-main" style={{ color: '#000000' }}>
        <h1>Set Market Prices</h1>
        <div className="auth-form">
          <label>Gold 24K/10gm</label>
          <input type="text" inputMode="decimal" style={{ color: '#000000', backgroundColor: isEditable ? '#e9ecef' : '#ffffff' }} value={prices['24.00'] || ''} disabled={!isEditable} onChange={e => handlePriceChange('24.00', e.target.value)} />
          <label>Gold 22K/10gm</label>
          <input type="text" inputMode="decimal" style={{ color: '#000000', backgroundColor: isEditable ? '#e9ecef' : '#ffffff' }} value={prices['22.00'] || ''} disabled={!isEditable} onChange={e => handlePriceChange('22.00', e.target.value)} />
          <label>Gold 18K/10gm</label>
          <input type="text" inputMode="decimal" style={{ color: '#000000', backgroundColor: isEditable ? '#e9ecef' : '#ffffff' }} value={prices['18.00'] || ''} disabled={!isEditable} onChange={e => handlePriceChange('18.00', e.target.value)} />
          <label>Gold 14K/10gm</label>
          <input type="text" inputMode="decimal" style={{ color: '#000000', backgroundColor: isEditable ? '#e9ecef' : '#ffffff' }} value={prices['14.00'] || ''} disabled={!isEditable} onChange={e => handlePriceChange('14.00', e.target.value)} />
          <label>Gold 9K/10gm</label>
          <input type="text" inputMode="decimal" style={{ color: '#000000', backgroundColor: isEditable ? '#e9ecef' : '#ffffff' }} value={prices['10.00'] || ''} disabled={!isEditable} onChange={e => handlePriceChange('10.00', e.target.value)} />
          <label>Silver</label>
          <input type="text" inputMode="decimal" style={{ color: '#000000', backgroundColor: isEditable ? '#e9ecef' : '#ffffff' }} value={prices['silver'] || ''} disabled={!isEditable} onChange={e => setPrices({...prices, 'silver': e.target.value})} />
          <label>Diamond</label>
          <input type="text" inputMode="decimal" style={{ color: '#000000', backgroundColor: isEditable ? '#e9ecef' : '#ffffff' }} value={prices['diamond'] || ''} disabled={!isEditable} onChange={e => setPrices({...prices, 'diamond': e.target.value})} />
          <label>GST (%)</label>
          <input type="text" inputMode="decimal" style={{ color: '#000000', backgroundColor: isEditable ? '#e9ecef' : '#ffffff' }} value={prices['gst'] || ''} disabled={!isEditable} onChange={e => setPrices({...prices, 'gst': e.target.value})} />
          <label>Verification Frequency (Days)</label>
          <input type="text" inputMode="numeric" style={{ color: '#000000', backgroundColor: isEditable ? '#e9ecef' : '#ffffff' }} value={frequency} disabled={!isEditable} onChange={e => setFrequency(e.target.value)} />

          <div className="auth-link-container" style={{gap: '12px'}}>
            {!isEditable ? (
              <button className="action-button" style={{width:'100%'}} onClick={() => setIsEditable(true)}>Edit Prices</button>
            ) : (
              <button className="action-button" style={{width:'100%'}} onClick={handleSave}>Save Changes</button>
            )}
            <button className="action-button secondary" style={{width:'100%'}} onClick={() => onSwitchPage('price-history')}>Price History</button>
            <button className="action-button secondary" style={{width:'100%'}} onClick={() => onSwitchPage('home')}>Back to Dashboard</button>
          </div>
        </div>
      </main>
    </>
  );
}

export default SetPrice;