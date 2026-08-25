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

function ViewProduct({ onSwitchPage, onOpenModal }) {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isListView, setIsListView] = useState(sessionStorage.getItem('lastView') === 'list');
  const [expandedCats, setExpandedCats] = useState(new Set());
  const [deleteId, setDeleteId] = useState(null);

  // Filters State
  const [filters, setFilters] = useState(() => ({
    category: sessionStorage.getItem('lastCategory') || '',
    searchTerm: sessionStorage.getItem('lastSearchTerm') || '',
    sortBy: sessionStorage.getItem('lastSortBy') || '',
    searchBy: sessionStorage.getItem('lastSearchBy') || 'name',
    verifiedOnly: sessionStorage.getItem('lastVerifiedOnly') === 'true',
    unverifiedOnly: sessionStorage.getItem('lastUnverifiedOnly') === 'true',
    priceWithFields: sessionStorage.getItem('lastPriceWithFields') !== 'false'
  }));

  const fetchProducts = useCallback(async (reset = false) => {
    const currentPage = reset ? 0 : page;
    setLoading(true);

    const params = new URLSearchParams({
      page: String(currentPage),
      size: '12',
      category: filters.category,
      searchTerm: filters.searchTerm,
      sortBy: filters.sortBy,
      searchBy: filters.searchBy,
      verifiedOnly: String(filters.verifiedOnly),
      unverifiedOnly: String(filters.unverifiedOnly)
    });

    try {
      const res = await fetch(`${API_BASE}/product/load?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();

      if (reset) {
        setProducts(data.products || []);
        setPage(1);
      } else {
        setProducts(prev => [...prev, ...(data.products || [])]);
        setPage(prev => prev + 1);
      }
      setHasMore((reset ? 0 : page + 1) * 12 < data.totalCount);
    } catch (err) {
      console.error(err);
      if (reset) setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchProducts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.sortBy, filters.verifiedOnly, filters.unverifiedOnly]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    sessionStorage.setItem(`last${key.charAt(0).toUpperCase() + key.slice(1)}`, value);
  };

  const handleSearch = () => {
    sessionStorage.setItem('lastSearchTerm', filters.searchTerm);
    sessionStorage.setItem('lastSearchBy', filters.searchBy);
    fetchProducts(true);
  };

  const handleCategoryClick = (id, subIds = []) => {
    const value = subIds.length > 0 ? [id, ...subIds].join(',') : String(id);
    // Clear search term and reset to "name" search when changing categories
    // to prevent old searches from filtering out new category results.
    setFilters(prev => ({ ...prev, category: value, searchTerm: '', searchBy: 'name' }));
    
    sessionStorage.setItem('lastCategory', value);
    sessionStorage.setItem('lastSearchTerm', '');
    sessionStorage.setItem('lastSearchBy', 'name');
  };

  const toggleExpand = (catId) => {
    const newSet = new Set(expandedCats);
    newSet.has(catId) ? newSet.delete(catId) : newSet.add(catId);
    setExpandedCats(newSet);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API_BASE}/remove/${deleteId}`, { method: 'POST', credentials: 'include' });
      if (res.ok) {
        onOpenModal('Product deleted successfully');
        fetchProducts(true);
      }
      setDeleteId(null);
    } catch (err) { onOpenModal('Delete failed'); }
  };

  return (
    <div className="view-product-page">
      <header className="header">
        <div className="logo">Product <span>Manager</span></div>
        <div className="logout-container">
          <button className="logout-btn" onClick={() => onSwitchPage('login')}>Logout</button>
        </div>
      </header>

      <section className="filters-bar">
        <div className="filter-group">
          <select value={filters.searchBy} onChange={e => setFilters({...filters, searchBy: e.target.value})}>
            <option value="name">Name</option>
            <option value="design">Design No</option>
            <option value="order">Register ID</option>
          </select>
          <input 
            type="text" 
            placeholder={`Search by ${filters.searchBy}...`} 
            value={filters.searchTerm} 
            onChange={e => setFilters({...filters, searchTerm: e.target.value})}
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
          />
          <button className="action-button" onClick={handleSearch} style={{padding: '8px 15px'}}>Apply</button>
        </div>

        <div className="filter-group">
          <select value={filters.sortBy} onChange={e => updateFilter('sortBy', e.target.value)}>
          <option value="">-- Sort By --</option>
          <option value="recent">Most Recent</option>
          <option value="nameAsc">Name A-Z</option>
          <option value="priceAsc">Price Low-High</option>
          <option value="verifiedFirst">Verified First</option>
        </select>
        </div>

        <button className="action-button secondary" onClick={() => onSwitchPage('home')} style={{padding: '8px 15px'}}>
          ← Back
        </button>

        <label className="checkbox-item" style={{color: '#000'}}>
          <input 
            type="checkbox" 
            checked={filters.priceWithFields} 
            onChange={e => {
              const checked = e.target.checked;
              setFilters(prev => ({ ...prev, priceWithFields: checked }));
              sessionStorage.setItem('lastPriceWithFields', String(checked));
            }} 
          />
          Incl. Addons
        </label>
        <label className="checkbox-item" style={{color: '#000'}}>
          <input 
            type="checkbox" 
            checked={filters.verifiedOnly} 
            onChange={e => {
              const checked = e.target.checked;
              setFilters(prev => {
                const updated = { ...prev, verifiedOnly: checked };
                if (checked) {
                  updated.unverifiedOnly = false;
                  sessionStorage.setItem('lastUnverifiedOnly', 'false');
                }
                return updated;
              });
              sessionStorage.setItem('lastVerifiedOnly', String(checked));
            }} 
          />
          Verified Only
        </label>
        <label className="checkbox-item" style={{color: '#000'}}>
          <input 
            type="checkbox" 
            checked={filters.unverifiedOnly} 
            onChange={e => {
              const checked = e.target.checked;
              setFilters(prev => {
                const updated = { ...prev, unverifiedOnly: checked };
                if (checked) {
                  updated.verifiedOnly = false;
                  sessionStorage.setItem('lastVerifiedOnly', 'false');
                }
                return updated;
              });
              sessionStorage.setItem('lastUnverifiedOnly', String(checked));
            }} 
          />
          Unverified Only
        </label>
      </section>

      <div className="view-content">
        <aside className="view-sidebar">
          <h3>Categories</h3>
          <ul>
            <li className={filters.category === '' ? 'active' : ''} onClick={() => handleCategoryClick('')}>All</li>
            {Object.entries(categoryMap).map(([id, name]) => {
              const currentIds = filters.category.split(',');
              const subIds = subCategoriesMap[name]?.map(s => String(s.id)) || [];
              // Active if parent is selected OR any child is selected
              const isParentActive = currentIds.includes(id) || subIds.some(sid => currentIds.includes(sid));

              return (
                <li key={id} className={`cat-item ${isParentActive ? 'active' : ''}`}>
                  <div className="cat-header" 
                       onClick={() => handleCategoryClick(id, subCategoriesMap[name]?.map(s => s.id))}
                       style={{ cursor: 'pointer' }}>
                    <span>{name}</span>
                    <button onClick={(e) => { 
                      e.stopPropagation(); 
                      toggleExpand(id); 
                    }}>
                      {expandedCats.has(id) ? '−' : '+'}
                    </button>
                  </div>
                {expandedCats.has(id) && (
                  <ul className="subcat-list">
                    {subCategoriesMap[name]?.map(sub => (
                      <li key={sub.id} 
                          className={currentIds.includes(String(sub.id)) ? 'active' : ''} 
                          onClick={(e) => { e.stopPropagation(); handleCategoryClick(sub.id); }}>
                        {sub.name}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )})}
          </ul>
        </aside>

        <main className="view-main">
          <div className="view-controls">
            <button className={!isListView ? 'active' : ''} onClick={() => { setIsListView(false); sessionStorage.setItem('lastView', 'grid'); }}>🔳 Grid</button>
            <button className={isListView ? 'active' : ''} onClick={() => { setIsListView(true); sessionStorage.setItem('lastView', 'list'); }}>📋 List</button>
          </div>

          <div className={isListView ? 'product-list-container' : 'product-grid-container'}>
            {loading && products.length === 0 && <p className="loading-indicator">Loading products...</p>}
            {products.length === 0 ? <p>No products found.</p> : products.map(p => (
              <div key={p.productId} className={`view-card ${p.verificationStatus === 1 ? 'verified' : ''}`}>
                <img src={p.imageUrl?.startsWith('/') ? `${API_BASE}${p.imageUrl}` : p.imageUrl} alt={p.item} />
                <div className="card-info">
                  <p className="card-design">{p.orders?.orderId || 'N/A'}/{p.designNo}</p>
                  <h4>{p.item}</h4>
                  <p className="card-price">₹{Math.round(filters.priceWithFields ? (p.priceWithFields || p.price) : p.price)}</p>
                  <div className="card-actions">
                    <button onClick={() => { sessionStorage.setItem('productId', p.productId); sessionStorage.setItem('isDesignNo', 'false'); onSwitchPage('load-product'); }}>View👁️</button>
                    <button onClick={() => { sessionStorage.setItem('productId', p.productId); sessionStorage.setItem('isDesignNo', 'false'); onSwitchPage('get-estimate'); }}>Estimate📊</button>
                    <button onClick={() => { 
                      sessionStorage.setItem('modifyDesignNo', p.designNo); 
                      sessionStorage.setItem('modifyReferrer', 'view-product');
                      onSwitchPage('modify-product'); 
                    }}>Modify📝</button>
                    <button className="del" onClick={() => setDeleteId(p.designNo)}>Delete🗑️</button>
                  </div>
                </div>
                {p.verificationStatus === 1 && <span className="verified-tag">Verified</span>}
              </div>
            ))}
          </div>

          {hasMore && <button className="load-more-btn" onClick={() => fetchProducts()}>Load More</button>}
          <button className="action-button secondary" onClick={() => onSwitchPage('home')} style={{marginTop: '20px', width: '100%'}}>Back to Dashboard</button>
        </main>
      </div>

      {deleteId && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Confirm Delete</h3>
            <p>Delete product {deleteId}?</p>
            <div className="popup-actions">
              <button className="popup-button primary" onClick={handleDelete}>Delete</button>
              <button className="popup-button secondary" onClick={() => setDeleteId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewProduct;