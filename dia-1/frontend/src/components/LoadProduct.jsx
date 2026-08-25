import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.DEV ? 'http://localhost:8080' : '';

const categoryMap = {
  1: 'Diamond', 2: 'Open Setting', 3: 'Plain Gold', 4: 'Vilandi', 5: 'Jadtar',
  6: 'Jadtar Register', 7: 'Jadtar Halfsets', 8: 'Jadtar Bangles / Bracelets',
  9: 'Vilandi Halfsets', 10: 'Vilandi Bangles / Bracelets', 11: 'Diamond Bangles / Bracelets',
  12: 'Diamond Pendants / Pendant Sets', 13: 'Diamond Halfsets', 14: 'OS Halfsets',
  15: 'OS Bangles / Bracelets', 16: 'PG Bangles / Bracelets', 17: 'Only Earrings',
  18: 'Chains', 19: 'Diamond Earrings', 20: 'Diamond Rings'
};

function LoadProduct({ onSwitchPage, onOpenModal }) {
  const [product, setProduct] = useState(null);
  const [includeAddons, setIncludeAddons] = useState(true);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    let productId = null;
    try {
      productId = sessionStorage.getItem('productId');
    } catch (e) {
      console.warn('Cannot read sessionStorage:', e);
    }
    if (!productId) {
      onOpenModal('No product selected.');
      onSwitchPage('view-product');
      return;
    }
    fetchProduct(productId);
  }, []);

  const fetchProduct = async (id) => {
    try {
      const isDesignNo = sessionStorage.getItem('isDesignNo') === 'true';
      const isNumeric = !isDesignNo && /^\d+$/.test(id);
      const endpoint = isNumeric 
        ? `${API_BASE}/loadProductDetail/${encodeURIComponent(id)}`
        : `${API_BASE}/loadProduct/${encodeURIComponent(id)}`;
      const res = await fetch(endpoint, { credentials: 'include' });
      if (!res.ok) throw new Error('Product not found');
      setProduct(await res.json());
    } catch (err) {
      onOpenModal(err.message);
    }
  };

  const handleAction = async (endpoint, method = 'POST') => {
    if (!customerName && (endpoint === 'logSale' || endpoint === 'logEnquiry')) {
      alert('Please enter a customer name.');
      return;
    }

    try {
      const payload = {
        productId: product.productId,
        designNo: product.designNo,
        orderId: product.orders?.orderId || null,
        customerName: customerName || 'System Admin',
        imageUrl: product.imageUrl,
        price: product.price,
        priceWithFields: product.priceWithFields,
        estimateSnapshot: { total: product.priceWithFields || product.price }
      };

      const url = endpoint === 'verify' ? `${API_BASE}/verify/${encodeURIComponent(product.designNo)}` : `${API_BASE}/${endpoint}`;
      const body = endpoint === 'verify' ? { verificationStatus: 1 } : payload;

      const res = await fetch(url, {
        method: endpoint === 'verify' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include'
      });

      if (res.ok) {
        onOpenModal(`Action ${endpoint} successful!`);
        if (endpoint !== 'logEnquiry') onSwitchPage('view-product');
      }
    } catch (err) {
      onOpenModal('Action failed.');
    }
  };

  if (!product) return <div className="home-main">Loading details...</div>;

  const currentPrice = includeAddons ? (product.priceWithFields || product.price) : product.price;
  const extras = product.customFields ? JSON.parse(product.customFields) : {};

  const renderCategorySpecs = () => {
    const cat = Number(product.categoryId);

    const renderText = (value, suffix = '') => {
      if (value === null || value === undefined || value === '') {
        return <span className="empty-label">No value</span>;
      }
      return `${value}${suffix}`;
    };

    const renderWeight = (value) => {
      if (value === null || value === undefined || value === '') {
        return <span className="empty-label">No value</span>;
      }
      const num = Number(value);
      return `${isNaN(num) ? value : num.toFixed(3)} gm`;
    };

    const renderCurrency = (value) => {
      if (value === null || value === undefined || value === '') {
        return <span className="empty-label">No value</span>;
      }
      return `₹${value}`;
    };

    switch (cat) {
      case 1:
      case 11:
      case 12:
      case 13:
      case 19:
      case 20:
        return (
          <>
            <p><strong>Gross Weight:</strong> {renderWeight(product.gross)}</p>
            <p><strong>Net Weight:</strong> {renderWeight(product.net)}</p>
            <p><strong>Pcs:</strong> {renderText(product.pcs)}</p>
            <p><strong>Diamonds:</strong> {renderText(product.diamondsCt, ' ct')}</p>
            <p><strong>Other Stones:</strong> {renderText(product.otherStonesCt, ' ct')}</p>
          </>
        );
      case 2:
      case 14:
      case 15:
        return (
          <>
            <p><strong>Gross Weight:</strong> {renderWeight(product.gross)}</p>
            <p><strong>Net Weight:</strong> {renderWeight(product.net)}</p>
            <p><strong>Vilandi:</strong> {renderText(product.vilandiCt, ' ct')}</p>
            <p><strong>Diamonds:</strong> {renderText(product.diamondsCt, ' ct')}</p>
            <p><strong>Beads:</strong> {renderText(product.beadsCt, ' ct')}</p>
            <p><strong>Pearls:</strong> {renderWeight(product.pearlsGm)}</p>
            <p><strong>SS Pearl:</strong> {renderText(product.ssPearlCt, ' ct')}</p>
            <p><strong>Other Stones:</strong> {renderText(product.otherStonesCt, ' ct')}</p>
          </>
        );
      case 3:
      case 16:
      case 18:
        return (
          <>
            <p><strong>Gross Weight:</strong> {renderWeight(product.gross)}</p>
            <p><strong>Net Weight:</strong> {renderWeight(product.net)}</p>
          </>
        );
      case 4:
      case 9:
      case 10:
        return (
          <>
            <p><strong>Vilandi:</strong> {renderText(product.vilandiCt, ' ct')}</p>
            <p><strong>Gross Weight:</strong> {renderWeight(product.gross)}</p>
            <p><strong>Net Weight:</strong> {renderWeight(product.net)}</p>
            <p><strong>Stones:</strong> {renderText(product.stones)}</p>
            <p><strong>Beads:</strong> {renderText(product.beadsCt, ' ct')}</p>
            <p><strong>Pearls:</strong> {renderWeight(product.pearlsGm)}</p>
            <p><strong>SS Pearl:</strong> {renderText(product.ssPearlCt, ' ct')}</p>
            <p><strong>Real Stone:</strong> {renderCurrency(product.realStone)}</p>
            <p><strong>Fitting:</strong> {renderCurrency(product.fitting)}</p>
          </>
        );
      case 5:
      case 6:
      case 7:
      case 8:
      case 17:
        return (
          <>
            <p><strong>Gross Weight:</strong> {renderWeight(product.gross)}</p>
            <p><strong>Net Weight:</strong> {renderWeight(product.net)}</p>
            <p><strong>Stones:</strong> {renderText(product.stones)}</p>
            <p><strong>Beads:</strong> {renderText(product.beadsCt, ' ct')}</p>
            <p><strong>Pearls:</strong> {renderWeight(product.pearlsGm)}</p>
            <p><strong>SS Pearl:</strong> {renderText(product.ssPearlCt, ' ct')}</p>
            <p><strong>Real Stone:</strong> {renderCurrency(product.realStone)}</p>
            <p><strong>Vilandi:</strong> {renderText(product.vilandiCt, ' ct')}</p>
            <p><strong>Mozonite:</strong> {renderText(product.mozonite)}</p>
            <p><strong>Fitting:</strong> {renderCurrency(product.fitting)}</p>
          </>
        );
      default:
        return <p>Category not recognized.</p>;
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

      <main className="home-main" style={{ maxWidth: '800px', textAlign: 'left' }}>
        <button className="action-button secondary" onClick={() => onSwitchPage('view-product')} style={{ marginBottom: '20px' }}>
          ← Back to List
        </button>

        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', marginBottom: '30px' }}>
          <img src={product.imageUrl?.startsWith('/') ? `${API_BASE}${product.imageUrl}` : product.imageUrl} 
               alt={product.item} style={{ width: '250px', borderRadius: '12px', border: '1px solid #ddd' }} />
          <div>
            <img src={product.qrCodePath?.startsWith('/') ? `${API_BASE}${product.qrCodePath}` : product.qrCodePath} 
                 alt="QR" style={{ width: '150px', border: '1px dashed #ccc' }} />
            <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="action-button" onClick={() => setShowVerifyModal(true)}>Verify / Actions</button>
              <button className="action-button secondary" onClick={() => { sessionStorage.setItem('productId', product.productId); sessionStorage.setItem('isDesignNo', 'false'); onSwitchPage('get-estimate'); }}>📊 Get Estimate</button>
            </div>
          </div>
        </div>

        <div className="product-details">
          <h1 style={{ textAlign: 'left', margin: 0 }}>{product.item}</h1>
          <p style={{ color: product.verificationStatus === 1 ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
            {product.verificationStatus === 1 ? '✔ Verified' : '✘ Unverified'}
          </p>
          <p><strong>Category:</strong> {categoryMap[product.categoryId] || 'Unknown'}</p>
          <p><strong>Sub Category:</strong> {categoryMap[product.subCategoryId] || 'Unknown'}</p>
          <p><strong>Design No:</strong> {product.orders?.orderId || 'N/A'}/{product.designNo}</p>
          <p><strong>Gold:</strong> {(product.karat === 10 || product.karat === '10' || product.karat === '10.00' || String(product.karat).toLowerCase() === '10k') ? '9' : product.karat} Karat</p>
          
          <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', margin: '20px 0' }}>
            <label className="checkbox-item" style={{ color: '#000' }}>
              <input type="checkbox" checked={includeAddons} onChange={e => setIncludeAddons(e.target.checked)} />
              Include Addons in Price
            </label>
            <p style={{ fontSize: '1.8rem', fontWeight: '800', color: '#b8860b', margin: '10px 0' }}>
              ₹{Math.round(currentPrice).toLocaleString('en-IN')}
            </p>
          </div>

          <h3>Technical Specs</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {renderCategorySpecs()}
          </div>

          {Object.keys(extras).length > 0 && (
            <>
              <h3>Additional Fields</h3>
              <ul>
                {Object.entries(extras).map(([name, obj]) => (
                  <li key={name}><strong>{name}:</strong> {obj.qty}</li>
                ))}
              </ul>
            </>
          )}
          {product.remarks && <p><strong>Remarks:</strong> {product.remarks}</p>}
        </div>
      </main>

      {showVerifyModal && (
        <div className="popup-overlay">
          <div className="popup-content" style={{ maxWidth: '500px' }}>
            <h2>Product Actions</h2>
            <div className="auth-form" style={{ marginBottom: '20px' }}>
              <label>Customer Name *</label>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Required for Sale/Enquiry" />
            </div>
            <div className="popup-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button className="popup-button primary" onClick={() => handleAction('verify')}>Mark Verified</button>
              <button className="popup-button secondary" onClick={() => handleAction('logEnquiry')}>Log Enquiry</button>
              <button className="popup-button secondary" style={{ background: '#000' }} onClick={() => handleAction('logSale')}>Mark Sold</button>
              <button className="popup-button" style={{ background: '#ffc107', color: '#000' }} 
                      onClick={() => { 
                        sessionStorage.setItem('modifyDesignNo', product.designNo); 
                        sessionStorage.setItem('modifyReferrer', 'load-product');
                        onSwitchPage('modify-product'); 
                      }}>
                Modify
              </button>
            </div>
            <button className="close-btn" style={{ marginTop: '20px', position: 'static' }} onClick={() => setShowVerifyModal(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}

export default LoadProduct;