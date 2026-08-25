import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.DEV ? 'http://localhost:8080' : '';

const subCategoriesMap = {
  "Jadtar": [
    { id: 6, name: "Jadtar Register" }, { id: 7, name: "Jadtar Halfsets" },
    { id: 8, name: "Jadtar Bangles / Bracelets" }, { id: 17, name: "Only Earrings" }
  ],
  "Vilandi": [
    { id: 9, name: "Vilandi Halfsets" }, { id: 10, name: "Vilandi Bangles / Bracelets" }
  ],
  "Diamond": [
    { id: 20, name: "Diamond Rings" }, { id: 19, name: "Diamond Earrings" },
    { id: 11, name: "Diamond Bangles / Bracelets" }, { id: 12, name: "Diamond Pendants / Pendant Sets" },
    { id: 13, name: "Diamond Halfsets" }
  ],
  "Open Setting": [
    { id: 14, name: "OS Halfsets" }, { id: 15, name: "OS Bangles / Bracelets" }
  ],
  "Plain Gold": [
    { id: 18, name: "Chains" }, { id: 16, name: "PG Bangles / Bracelets" }
  ]
};

const categoryMap = { 1: "Diamond", 2: "Open Setting", 3: "Plain Gold", 4: "Vilandi", 5: "Jadtar" };

function VerifyProducts({ onSwitchPage, onOpenModal }) {
  const [unverified, setUnverified] = useState([]);
  const [verified, setVerified] = useState([]);
  const [frequency, setFrequency] = useState(1);
  const [isListView, setIsListView] = useState(true);
  const [filters, setFilters] = useState({ category: '', subCategory: '', searchTerm: '' });
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [freqRes, prodRes] = await Promise.all([
        fetch(`${API_BASE}/frequency`, { credentials: 'include' }),
        fetch(`${API_BASE}/product/load?page=0&size=1000&category=${filters.subCategory || filters.category}&searchTerm=${filters.searchTerm}&searchBy=all`, { credentials: 'include' })
      ]);

      if (freqRes.ok) {
        const freqData = await freqRes.json();
        setFrequency(freqData.frequency);
      }

      if (prodRes.ok) {
        const data = await prodRes.json();
        const products = data.products || [];
        
        // Classification Logic
        const v = products.filter(p => p.verificationStatus === 1);
        const uv = products.filter(p => p.verificationStatus !== 1);
        
        setVerified(v);
        setUnverified(uv);
      } else {
        setVerified([]);
        setUnverified([]);
      }
    } catch (err) {
      console.error("Load failed", err);
      setVerified([]);
      setUnverified([]);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVerify = async (designNo) => {
    try {
      const res = await fetch(`${API_BASE}/verify/${encodeURIComponent(designNo)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationStatus: 1 }),
        credentials: 'include'
      });
      if (res.ok) {
        onOpenModal('Product verified successfully');
        setSelectedProduct(null);
        fetchData();
      } else {
        const errText = await res.text().catch(() => '');
        onOpenModal(`Verification failed: Status ${res.status} - ${errText}`);
      }
    } catch (err) {
      onOpenModal(`Verification failed: ${err.message}`);
    }
  };

  const handleUpdateFrequency = async () => {
    try {
      const res = await fetch(`${API_BASE}/frequency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frequency: parseInt(frequency) }),
        credentials: 'include'
      });
      if (res.ok) {
        onOpenModal('Frequency updated');
        fetchData();
      }
    } catch (err) { onOpenModal('Update failed'); }
  };

  const ProductCard = ({ p }) => (
    <div className={`verify-product-card ${p.verificationStatus === 1 ? 'verified' : ''}`} onClick={() => setSelectedProduct(p)}>
      <img src={p.imageUrl?.startsWith('/') ? `${API_BASE}${p.imageUrl}` : p.imageUrl} alt={p.item} />
      <div className="product-info">
        <h3>{p.item}</h3>
        <p>ID: {p.orders?.orderId || 'N/A'} | Design: {p.designNo}</p>
        <p className="product-price">₹{Math.round(p.priceWithFields || p.price).toLocaleString('en-IN')}</p>
        {p.verificationDate && (
           <p className="last-verified" style={{fontSize: '0.8rem', color: '#666'}}>
             Last: {new Date(p.verificationDate).toLocaleDateString()}
           </p>
        )}
      </div>
      {p.verificationStatus === 1 && <div className="verified-badge">Verified</div>}
    </div>
  );

  return (
    <div className="view-product-page">
      <header className="header">
        <div className="logo" onClick={() => onSwitchPage('home')} style={{cursor:'pointer'}}>
          Product <span>Manager</span>
        </div>
        <div className="logout-container">
          <button className="logout-btn" onClick={() => onSwitchPage('login')}>Logout</button>
        </div>
      </header>

      <section className="filters-bar">
        <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value, subCategory: '' })}>
          <option value="">All Categories</option>
          {Object.entries(categoryMap).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>

        {filters.category && (
          <select value={filters.subCategory} onChange={e => setFilters({ ...filters, subCategory: e.target.value })}>
            <option value="">All Subcategories</option>
            {subCategoriesMap[categoryMap[filters.category]]?.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        )}

        <input type="text" placeholder="Search..." value={filters.searchTerm} onChange={e => setFilters({ ...filters, searchTerm: e.target.value })} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <label style={{ fontSize: '0.8rem', color: '#000', fontWeight: 'bold' }}>Freq (Days):</label>
          <input pattern="\d*" inputmode="decimal" type="text" value={frequency} onChange={e => setFrequency(e.target.value)} style={{ width: '60px', padding: '5px' }} />
          <button className="action-button" onClick={handleUpdateFrequency} style={{ padding: '5px 12px' }}>Set</button>
        </div>

        <div className="view-toggle" style={{marginLeft: '15px'}}>
          <button className={isListView ? 'active' : ''} onClick={() => setIsListView(true)}>List</button>
          <button className={!isListView ? 'active' : ''} onClick={() => setIsListView(false)}>Grid</button>
        </div>
      </section>

      <div className="verify-main-content">
        <div className="verify-panel unverified-panel">
          <h2>Unverified ({unverified.length})</h2>
          <div className={isListView ? 'verify-list-view' : 'verify-grid-view'}>
            {unverified.map(p => <ProductCard key={p.productId} p={p} />)}
          </div>
        </div>

        <div className="verify-panel verified-panel">
          <h2>Verified ({verified.length})</h2>
          <div className={isListView ? 'verify-list-view' : 'verify-grid-view'}>
            {verified.map(p => <ProductCard key={p.productId} p={p} />)}
          </div>
        </div>
      </div>

      {selectedProduct && (
        <div className="popup-overlay">
          <div className="popup-content" style={{ maxWidth: '600px', textAlign: 'left' }}>
            <h2 style={{ color: '#000', marginBottom: '20px' }}>Product Details</h2>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <img src={selectedProduct.imageUrl?.startsWith('/') ? `${API_BASE}${selectedProduct.imageUrl}` : selectedProduct.imageUrl} 
                   style={{ width: '180px', borderRadius: '8px' }} alt="Product" />
              <div className="product-details">
                <p><strong>Item:</strong> {selectedProduct.item}</p>
                <p><strong>Design:</strong> {selectedProduct.designNo}</p>
                <p><strong>Price:</strong> ₹{Math.round(selectedProduct.priceWithFields || selectedProduct.price).toLocaleString('en-IN')}</p>
                <p><strong>Net:</strong> {selectedProduct.net} gm</p>
              </div>
            </div>
            <div className="popup-actions">
              <button className="popup-button primary" onClick={() => handleVerify(selectedProduct.designNo)}>
                {selectedProduct.verificationStatus === 1 ? 'Reverify' : 'Mark Verified'}
              </button>
              <button className="popup-button secondary" onClick={() => {
                sessionStorage.setItem('modifyDesignNo', selectedProduct.designNo);
                onSwitchPage('modify-product');
              }}>Modify</button>
              <button className="popup-button" style={{background: '#ccc'}} onClick={() => setSelectedProduct(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: 'fixed', bottom: '80px', right: '30px' }}>
        <button className="action-button secondary" onClick={() => onSwitchPage('home')}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default VerifyProducts;