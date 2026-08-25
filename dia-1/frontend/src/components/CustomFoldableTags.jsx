import React, { useState, useEffect, useCallback, useRef } from 'react';
import './CustomFoldableTags.css';

const API_BASE = import.meta.env.DEV ? 'http://localhost:8080' : '';

const subCategories = {
  Jadtar: [
    { id: 6, name: 'Jadtar Register' },
    { id: 7, name: 'Jadtar Halfsets' },
    { id: 8, name: 'Jadtar Bangles / Bracelets' },
    { id: 17, name: 'Only Earrings' },
  ],
  Vilandi: [
    { id: 9, name: 'Vilandi Halfsets' },
    { id: 10, name: 'Vilandi Bangles / Bracelets' },
  ],
  Diamond: [
    { id: 20, name: 'Diamond Rings' },
    { id: 19, name: 'Diamond Earrings' },
    { id: 11, name: 'Diamond Bangles / Bracelets' },
    { id: 12, name: 'Diamond Pendants / Pendant Sets' },
    { id: 13, name: 'Diamond Halfsets' },
  ],
  'Open Setting': [
    { id: 14, name: 'OS Halfsets' },
    { id: 15, name: 'OS Bangles / Bracelets' },
  ],
  'Plain Gold': [
    { id: 18, name: 'Chains' },
    { id: 16, name: 'PG Bangles / Bracelets' },
  ],
};

const detailsMap = {
  1: 'Diamond',
  2: 'Open Setting',
  3: 'Plain Gold',
  4: 'Vilandi',
  5: 'Jadtar',
  6: 'Jadtar Register',
  7: 'Jadtar Halfsets',
  8: 'Jadtar Bangles / Bracelets',
  9: 'Vilandi Halfsets',
  10: 'Vilandi Bangles / Bracelets',
  11: 'Diamond Bangles / Bracelets',
  12: 'Diamond Pendants / Pendant Sets',
  13: 'Diamond Halfsets',
  14: 'OS Halfsets',
  15: 'OS Bangles / Bracelets',
  16: 'PG Bangles / Bracelets',
  17: 'Only Earrings',
  18: 'Chains',
  19: 'Diamond Earrings',
  20: 'Diamond Rings',
};

function formatCurrency(value) {
  if (value == null || value === '') return 'N/A';
  const rounded = Math.round(Number(value));
  if (Number.isNaN(rounded)) return 'N/A';
  return `Rs. ${rounded.toLocaleString('en-IN')}`;
}

function resolveImage(path, fallback = '/uploads/unavailable.jpg') {
  if (!path) return fallback;
  return path.startsWith('/') ? `${API_BASE}${path}` : path;
}

function CustomFoldableTags({ onSwitchPage }) {
  const [allProducts, setAllProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [allProductsCache] = useState(new Map());
  const [selectedIdsSet, setSelectedIdsSet] = useState(new Set());

  const [category, setCategory] = useState('All');
  const [subCategory, setSubCategory] = useState('All');
  const [searchType, setSearchType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [startSlot, setStartSlot] = useState(1);
  const [tagFontSize, setTagFontSize] = useState(localStorage.getItem('tagFontSize') || '5.5');
  const [isListView, setIsListView] = useState(false);
  const [showPriceWithFields, setShowPriceWithFields] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [modalWithFields, setModalWithFields] = useState(true);

  const searchDebounce = useRef(null);

  const loadProducts = useCallback(async () => {
    const categoryMap = {
      Diamond: 1,
      'Open Setting': 2,
      'Plain Gold': 3,
      Vilandi: 4,
      Jadtar: 5,
    };

    const baseCategoryId = category !== 'All' ? String(categoryMap[category]) : '';
    const categoryParam = subCategory && subCategory !== 'All' ? subCategory : baseCategoryId;

    const params = new URLSearchParams();
    params.set('page', '0');
    params.set('size', '1000');
    if (categoryParam) params.set('category', categoryParam);
    if (searchTerm) params.set('searchTerm', searchTerm);
    params.set('searchBy', searchType);

    try {
      const res = await fetch(`${API_BASE}/product/load?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await res.json();

      const fetched = (data.products || [])
        .map((p) => ({
          id: p.productId,
          name: p.item,
          image: p.imageUrl || '/uploads/unavailable.jpg',
          orderId: p.orders?.orderId,
          designNo: p.designNo,
          createdAt: p.createDateTime,
          updatedAt: p.updateDateTime,
          ...p,
        }))
        .filter((p) => p.designNo && p.orderId);

      fetched.sort((a, b) => {
        const sortKey = sortBy === 'modified' ? 'updatedAt' : 'createdAt';
        const dateA = new Date(a[sortKey]);
        const dateB = new Date(b[sortKey]);
        return sortBy === 'oldest' ? dateA - dateB : dateB - dateA;
      });

      fetched.forEach((p) => allProductsCache.set(p.id, p));
      setAllProducts(fetched);
    } catch (err) {
      console.error('Failed to load products', err);
    }
  }, [category, subCategory, searchTerm, searchType, sortBy, allProductsCache]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const selected = Array.from(selectedIdsSet)
      .map((id) => allProductsCache.get(id))
      .filter(Boolean);
    const available = allProducts.filter((p) => !selectedIdsSet.has(p.id));

    setAvailableProducts(available);
    setSelectedProducts(selected);
  }, [allProducts, selectedIdsSet, allProductsCache]);

  useEffect(() => () => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
  }, []);

  const toggleProduct = (productId) => {
    setSelectedIdsSet((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const openProductModal = (product) => {
    setModalWithFields(true);
    setModalProduct(product);
  };

  const handleSearchChange = (val) => {
    setSearchTerm(val);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(loadProducts, 300);
  };

  const generateTagsPdf = async (action) => {
    if (!startSlot || startSlot < 1) {
      alert('Please enter a valid Start Tag Position (>= 1)');
      return;
    }

    if (selectedProducts.length === 0) {
      alert('Please select at least one product for tagging');
      return;
    }

    const payload = {
      startSlot: parseInt(startSlot, 10),
      fontSize: parseFloat(tagFontSize),
      designNos: selectedProducts.map((p) => p.designNo),
    };

    try {
      const res = await fetch(`${API_BASE}/tags/custom/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Failed to generate tags (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (action === 'print') {
        const win = window.open(url, '_blank');
        if (win) {
          win.onload = () => win.print();
        }
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = 'custom-foldable-tags.pdf';
        a.click();
      }

      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error('Failed to generate tags', err);
      alert('Failed to generate tags.');
    }
  };

  const renderModalDetails = (product) => {
    const categoryId = Number(product.categoryId);
    let extras = [];

    if (product.customFields && product.customFields !== '{}') {
      try {
        const parsed = JSON.parse(product.customFields);
        extras = Object.entries(parsed).map(([key, value]) => ({
          name: key,
          qty: value?.qty ?? value?.Qty ?? value?.value ?? 'N/A',
        }));
      } catch (error) {
        console.error('Failed to parse custom fields', error);
      }
    }

    const price = modalWithFields ? product.priceWithFields ?? product.price : product.price;

    return (
      <div className="product-details-content">
        <div className="product-top">
          <div className="product-image">
            <img src={resolveImage(product.image)} alt={product.name || 'Product'} />
          </div>
          <div className="product-qr">
            <img
              className="qr-code"
              src={resolveImage(product.qrCodePath, 'https://placehold.co/160?text=QR')}
              alt="QR code"
            />
          </div>
        </div>

        <div className="product-info-block">
          <h2>{product.item || 'Unnamed item'}</h2>
          <p><strong>Category:</strong> {detailsMap[product.categoryId] || 'Unknown'}</p>
          <p><strong>Sub Category:</strong> {detailsMap[product.subCategoryId] || 'Unknown'}</p>
          <p><strong>Design No:</strong> {product.orderId || 'N/A'}/{product.designNo || 'N/A'}</p>
          <p><strong>Gold:</strong> {(product.karat === 10 || product.karat === '10' || product.karat === '10.00' || String(product.karat).toLowerCase() === '10k') ? '9' : (product.karat || 'N/A')} Karat</p>

          <label className="price-toggle-row">
            <input
              type="checkbox"
              checked={modalWithFields}
              onChange={(e) => setModalWithFields(e.target.checked)}
            />
            Price with additional fields
          </label>

          <div className="modal-price-card">
            <span>Tag Price</span>
            <strong>{formatCurrency(price)}</strong>
          </div>

          <h3>Additional Details</h3>

          {[1, 11, 12, 13].includes(categoryId) && (
            <>
              <p><strong>Gross:</strong> {product.gross ?? 'N/A'} gm</p>
              <p><strong>Net:</strong> {product.net ?? 'N/A'} gm</p>
              <p><strong>Pcs:</strong> {product.pcs ?? 'N/A'}</p>
              <p><strong>Diamonds:</strong> {product.diamondsCt ?? 'N/A'} ct</p>
              <p><strong>Other Stones:</strong> {product.otherStonesCt ?? 'N/A'} ct</p>
            </>
          )}

          {[2, 14, 15].includes(categoryId) && (
            <>
              <p><strong>Gross:</strong> {product.gross ?? 'N/A'} gm</p>
              <p><strong>Net:</strong> {product.net ?? 'N/A'} gm</p>
              <p><strong>Vilandi:</strong> {product.vilandiCt ?? 'N/A'} ct</p>
              <p><strong>Diamonds:</strong> {product.diamondsCt ?? 'N/A'} ct</p>
              <p><strong>Beads:</strong> {product.beadsCt ?? 'N/A'} ct</p>
              <p><strong>Pearls:</strong> {product.pearlsGm ?? 'N/A'} gm</p>
              <p><strong>SS Pearl:</strong> {product.ssPearlCt ?? 'N/A'} ct</p>
            </>
          )}

          {[3, 16, 18].includes(categoryId) && (
            <>
              <p><strong>Gross:</strong> {product.gross ?? 'N/A'} gm</p>
              <p><strong>Net:</strong> {product.net ?? 'N/A'} gm</p>
            </>
          )}

          {[4, 9, 10].includes(categoryId) && (
            <>
              <p><strong>Vilandi:</strong> {product.vilandiCt ?? 'N/A'} ct</p>
              <p><strong>Gross:</strong> {product.gross ?? 'N/A'} gm</p>
              <p><strong>Net:</strong> {product.net ?? 'N/A'} gm</p>
              <p><strong>Stones:</strong> {product.stones ?? 'N/A'}</p>
              <p><strong>Beads:</strong> {product.beadsCt ?? 'N/A'} ct</p>
              <p><strong>Pearls:</strong> {product.pearlsGm ?? 'N/A'} gm</p>
              <p><strong>SS Pearl:</strong> {product.ssPearlCt ?? 'N/A'} ct</p>
              <p><strong>Real Stone:</strong> {formatCurrency(product.realStone)}</p>
              <p><strong>Fitting:</strong> {formatCurrency(product.fitting)}</p>
            </>
          )}

          {[5, 6, 7, 8, 17].includes(categoryId) && (
            <>
              <p><strong>Gross:</strong> {product.gross ?? 'N/A'} gm</p>
              <p><strong>Net:</strong> {product.net ?? 'N/A'} gm</p>
              <p><strong>Stones:</strong> {product.stones ?? 'N/A'} ct</p>
              <p><strong>Beads:</strong> {product.beadsCt ?? 'N/A'} ct</p>
              <p><strong>Pearls:</strong> {product.pearlsGm ?? 'N/A'} gm</p>
              <p><strong>SS Pearl:</strong> {product.ssPearlCt ?? 'N/A'} ct</p>
              <p><strong>Real Stone:</strong> {formatCurrency(product.realStone)}</p>
              <p><strong>Mozonite:</strong> {product.mozonite ?? 'N/A'}</p>
              <p><strong>Fitting:</strong> {formatCurrency(product.fitting)}</p>
            </>
          )}

          {extras.length > 0 && (
            <>
              <h4>Additional Fields</h4>
              <ul>
                {extras.map((extra) => (
                  <li key={extra.name}>
                    <strong>{extra.name}:</strong> {extra.qty}
                  </li>
                ))}
              </ul>
            </>
          )}

          <p><strong>Remarks:</strong> {product.remarks ?? 'N/A'}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="commercial-tags-wrapper">
      <div className="tags-main-container">
        <header className="tags-hero">
          <div className="tags-hero-main">
            <button
              className="icon-back-btn"
              onClick={() => onSwitchPage('generate-report')}
              aria-label="Back to Generate Report"
            >
              <i className="fas fa-arrow-left"></i>
            </button>

            <div className="hero-copy">
              <p className="hero-kicker">Tag Printing Workspace</p>
              <h1 className="nav-title">Custom Foldable Tags</h1>
              <p className="hero-subtitle">
                Curate the exact products you want, adjust tag position and font size, and
                generate polished folded tags for the showroom counter.
              </p>
            </div>
          </div>

          <div className="hero-metrics">
            <div className="hero-stat">
              <strong>{availableProducts.length}</strong>
              <span>Available</span>
            </div>
            <div className="hero-stat">
              <strong>{selectedProducts.length}</strong>
              <span>Selected</span>
            </div>
            <div className="hero-stat">
              <strong>{startSlot || 1}</strong>
              <span>Start Slot</span>
            </div>
          </div>
        </header>

        <div className="tags-toolbar">
          <section className="toolbar-card">
            <div className="toolbar-heading">
              <div>
                <h2>Find Products</h2>
                <p>Filter, search, and sort the catalogue before tagging.</p>
              </div>
            </div>

            <div className="toolbar-grid filters-grid">
              <div className="field-stack">
                <label>Category</label>
                <select
                  className="commercial-select"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setSubCategory('All');
                  }}
                >
                  {['All Categories', 'Diamond', 'Open Setting', 'Plain Gold', 'Vilandi', 'Jadtar']
                    .map((value) => (
                      <option key={value} value={value === 'All Categories' ? 'All' : value}>
                        {value}
                      </option>
                    ))}
                </select>
              </div>

              <div className="field-stack">
                <label>Subcategory</label>
                <select
                  className="commercial-select"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  disabled={!subCategories[category]}
                >
                  <option value="All">All Subcategories</option>
                  {(subCategories[category] || []).map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-stack">
                <label>Search By</label>
                <select
                  className="commercial-select"
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                >
                  <option value="all">Design No or Product Name</option>
                  <option value="design">Design No</option>
                  <option value="name">Product Name</option>
                  <option value="order">Register Id</option>
                </select>
              </div>

              <div className="field-stack">
                <label>Sort By</label>
                <select
                  className="commercial-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="recent">Most Recent First</option>
                  <option value="modified">Recently Modified</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

              <div className="field-stack full-span">
                <label>Search</label>
                <div className="commercial-search-input">
                  <i className="fas fa-search search-icon"></i>
                  <input
                    type="text"
                    placeholder="Design no, product name, or register id"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="toolbar-card">
            <div className="toolbar-heading">
              <div>
                <h2>Tag Settings</h2>
                <p>Control placement, layout, and pricing view.</p>
              </div>
            </div>

            <div className="toolbar-grid settings-grid">
              <div className="setting-item">
                <span>Start Tag Position</span>
                <input pattern="\d*" inputmode="decimal"
                  type="text"
                  min="1"
                  value={startSlot}
                  onChange={(e) => setStartSlot(e.target.value)}
                />
              </div>

              <div className="setting-item">
                <span>Tag Font Size</span>
                <select
                  value={tagFontSize}
                  onChange={(e) => {
                    setTagFontSize(e.target.value);
                    localStorage.setItem('tagFontSize', e.target.value);
                  }}
                >
                  {[5.5, 6, 6.5, 7, 7.5, 8, 8.5].map((size) => (
                    <option key={size} value={size}>
                      {size}px
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="view-and-price-row">
              <div className="commercial-toggle-group">
                <button
                  className={!isListView ? 'active' : ''}
                  onClick={() => setIsListView(false)}
                  type="button"
                >
                  Grid View
                </button>
                <button
                  className={isListView ? 'active' : ''}
                  onClick={() => setIsListView(true)}
                  type="button"
                >
                  List View
                </button>
              </div>

              <label className="commercial-checkbox">
                <input
                  type="checkbox"
                  checked={showPriceWithFields}
                  onChange={(e) => setShowPriceWithFields(e.target.checked)}
                />
                <span>Show price with additional fields</span>
              </label>
            </div>
          </section>

          <section className="toolbar-card actions-card">
            <div className="toolbar-heading">
              <div>
                <h2>Output</h2>
                <p>Print now or keep a PDF copy for the counter.</p>
              </div>
            </div>

            <div className="actions-top">
              <div className="action-button-group">
                <button className="btn-commercial secondary" onClick={() => generateTagsPdf('download')}>
                  Download PDF
                </button>
                <button className="btn-commercial primary" onClick={() => generateTagsPdf('print')}>
                  Print Tags
                </button>
              </div>
            </div>

            <div className="view-and-price-row">
              <div className="hero-stat">
                <strong>{tagFontSize}px</strong>
                <span>Selected Font</span>
              </div>
              <div className="hero-stat">
                <strong>{selectedProducts.length}</strong>
                <span>Items Queued</span>
              </div>
            </div>
          </section>
        </div>

        <div className="tags-content-body">
          <section className="product-panel">
            <div className="panel-header">
              <div className="panel-heading">
                <h2>Available Products <span>({availableProducts.length})</span></h2>
                <p>Browse the filtered catalogue and add pieces to the tag queue.</p>
              </div>
            </div>

            <div className={`product-viewport ${isListView ? 'list' : 'grid'}`}>
              {availableProducts.length > 0 ? (
                availableProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isSelected={false}
                    showPriceWithFields={showPriceWithFields}
                    onView={() => openProductModal(product)}
                    onToggle={() => toggleProduct(product.id)}
                  />
                ))
              ) : (
                <div className="empty-state">No products found for the current filters.</div>
              )}
            </div>
          </section>

          <section className="product-panel selected">
            <div className="panel-header">
              <div className="panel-heading">
                <h2>Selected For Tagging <span>({selectedProducts.length})</span></h2>
                <p>These products will be included in the next folded-tag print run.</p>
              </div>
              {selectedProducts.length > 0 && (
                <button className="text-btn-danger" onClick={() => setSelectedIdsSet(new Set())}>
                  Clear All
                </button>
              )}
            </div>

            <div className={`product-viewport ${isListView ? 'list' : 'grid'}`}>
              {selectedProducts.length > 0 ? (
                selectedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isSelected={true}
                    showPriceWithFields={showPriceWithFields}
                    onView={() => openProductModal(product)}
                    onToggle={() => toggleProduct(product.id)}
                  />
                ))
              ) : (
                <div className="empty-state">
                  No products selected yet. Add items from the left panel to build your tag sheet.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {modalProduct && (
        <div className="modal show" onClick={() => setModalProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Product Details</h2>
                <p>Review the item before sending it to the folded-tag queue.</p>
              </div>
              <button
                className="modal-close-icon"
                onClick={() => setModalProduct(null)}
                aria-label="Close modal"
              >
                X
              </button>
            </div>

            <div id="productDetailsContainer">
              {renderModalDetails(modalProduct)}
            </div>

            <div className="modal-buttons">
              <button
                className="modify-btn"
                onClick={() => {
                  sessionStorage.setItem('modifyDesignNo', modalProduct.designNo);
                  sessionStorage.setItem('returnToPage', 'custom-foldable-tags');
                  onSwitchPage('modify-product');
                }}
              >
                Modify Product
              </button>
              <button
                className="verify-final-btn"
                onClick={() => {
                  toggleProduct(modalProduct.id);
                  setModalProduct(null);
                }}
              >
                {selectedIdsSet.has(modalProduct.id) ? 'Remove' : 'Add for Tagging'}
              </button>
            </div>

            <div className="modal-footer">
              <button className="close-btn" onClick={() => setModalProduct(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, isSelected, showPriceWithFields, onView, onToggle }) {
  const price = showPriceWithFields ? product.priceWithFields : product.price;
  const displayCategory =
    detailsMap[product.subCategoryId] || detailsMap[product.categoryId] || 'Jewellery Item';

  return (
    <div className="product-card">
      <div className="product-card-media">
        <img src={resolveImage(product.image)} alt={product.name || 'Product'} />
        <div className="product-badge">{isSelected ? 'Selected' : 'Available'}</div>
      </div>

      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="product-subline">{displayCategory}</p>

        <div className="product-meta-list">
          <div className="product-meta-row">
            <span className="product-meta-label">Register ID</span>
            <span className="product-meta-value">{product.orderId || 'N/A'}</span>
          </div>
          <div className="product-meta-row">
            <span className="product-meta-label">Design No</span>
            <span className="product-meta-value">{product.designNo || 'N/A'}</span>
          </div>
        </div>

        <div className="tag-card-price">
          <span className="tag-card-price-label">
            {showPriceWithFields ? 'Price With Addons' : 'Base Price'}
          </span>
          <strong>{formatCurrency(price)}</strong>
        </div>

        <div className="product-button">
          <button className="reverify-btn" onClick={onView}>View</button>
          <button className="verify-btn" onClick={onToggle}>
            {isSelected ? 'Remove' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomFoldableTags;
