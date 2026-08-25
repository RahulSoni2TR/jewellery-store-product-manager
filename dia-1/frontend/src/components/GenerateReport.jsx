import React, { useMemo, useState } from 'react';
import pdfMake from 'pdfmake/build/pdfmake.js';
import 'pdfmake/build/vfs_fonts.js';
import './GenerateReport.css';

const API_BASE = import.meta.env.DEV ? 'http://localhost:8080' : '';
const PRODUCTS_PER_PAGE = 10;

const categories = {
  1: 'Diamond',
  2: 'Open Setting',
  3: 'Plain Gold',
  4: 'Vilandi',
  5: 'Jadtar'
};

const details = {
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
  20: 'Diamond Rings'
};

const subCategories = {
  Jadtar: [
    { id: 6, name: 'Jadtar Register' },
    { id: 7, name: 'Jadtar Halfsets' },
    { id: 8, name: 'Jadtar Bangles / Bracelets' },
    { id: 17, name: 'Only Earrings' }
  ],
  Vilandi: [
    { id: 9, name: 'Vilandi Halfsets' },
    { id: 10, name: 'Vilandi Bangles / Bracelets' }
  ],
  Diamond: [
    { id: 20, name: 'Diamond Rings' },
    { id: 19, name: 'Diamond Earrings' },
    { id: 11, name: 'Diamond Bangles / Bracelets' },
    { id: 12, name: 'Diamond Pendants / Pendant Sets' },
    { id: 13, name: 'Diamond Halfsets' }
  ],
  'Open Setting': [
    { id: 14, name: 'OS Halfsets' },
    { id: 15, name: 'OS Bangles / Bracelets' }
  ],
  'Plain Gold': [
    { id: 18, name: 'Chains' },
    { id: 16, name: 'PG Bangles / Bracelets' }
  ]
};

const categoryFields = {
  1: ['S.No', 'Register ID', 'Design No', 'Sub Category', 'Product Image', 'Product Name', 'Karat', 'Price', 'Gross', 'Net', 'Pieces', 'Diamonds (Ct)', 'Diamond Price', 'Labour Charges', 'Remarks', 'Create Date', 'Update Date'],
  2: ['S.No', 'Register ID', 'Design No', 'Sub Category', 'Product Image', 'Product Name', 'Karat', 'Gross', 'Net', 'Vilandi', 'Vilandi Rate', 'Diamonds (Ct)', 'Diamond Price', 'Beads (Ct.)', 'Beads Rate', 'Pearls (gm)', 'Pearls Rate', 'SS Pearls (Ct.)', 'SS Pearls Rate', 'Other Stones', 'Labour Charges', 'Remarks', 'Create Date', 'Update Date'],
  3: ['S.No', 'Register ID', 'Design No', 'Sub Category', 'Product Image', 'Product Name', 'Karat', 'Price', 'Gross', 'Net', 'Labour Charges', 'Remarks', 'Create Date', 'Update Date'],
  4: ['S.No', 'Register ID', 'Design No', 'Sub Category', 'Product Image', 'Product Name', 'Karat', 'Price', 'Gross', 'Net', 'Vilandi', 'Vilandi Rate', 'Stones', 'Stones Rate', 'Beads (Ct.)', 'Beads Rate', 'Pearls (gm)', 'Pearls Rate', 'SS Pearls (Ct.)', 'SS Pearls Rate', 'Real Stones (Ct.)', 'Labour Charges', 'Fitting', 'Remarks', 'Create Date', 'Update Date'],
  5: ['S.No', 'Register ID', 'Design No', 'Sub Category', 'Product Image', 'Product Name', 'Karat', 'Price', 'Gross', 'Net', 'Stones', 'Stones Rate', 'Beads (Ct.)', 'Beads Rate', 'Pearls Weight (gm)', 'Pearls Rate', 'SS Pearls (Ct.)', 'SS Pearls Rate', 'Real Stones (Ct.)', 'Labour Charges', 'Fitting', 'Mozonite', 'Mozonite Rate', 'Remarks', 'Create Date', 'Update Date']
};

const tagFields = [
  { key: 'beadsCt', label: 'Beads', rateKey: 'bdRate', unit: ' ct' },
  { key: 'pearlsGm', label: 'Pearls', rateKey: 'prlRate', unit: ' gm' },
  { key: 'ssPearlCt', label: 'SS Pearls', rateKey: 'ssRate', unit: ' ct' },
  { key: 'otherStonesCt', label: 'Other', rateKey: 'otherStonesRt', unit: ' ct' },
  { key: 'realStone', label: 'Real St', unit: '' },
  { key: 'fitting', label: 'Fitting', unit: '' },
  { key: 'diamondsCt', label: 'Diamonds', rateKey: 'diaRt', unit: ' ct' },
  { key: 'vilandiCt', label: 'Vilandi', rateKey: 'vRate', unit: ' ct' }
];

const pageSizes = {
  A0: { width: 2383.94, height: 3370.39 },
  A1: { width: 1683.78, height: 2383.94 },
  A2: { width: 1190.55, height: 1683.78 },
  A3: { width: 841.89, height: 1190.55 },
  A4: { width: 595.28, height: 841.89 },
  A5: { width: 420.94, height: 595.28 },
  A6: { width: 297.64, height: 420.94 },
  Letter: { width: 612, height: 792 }
};

const inputDateValue = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const formatDateForApi = (value) => value ? value.replace('T', ' ') + ':00' : '';
const money = (value) => value || value === 0 ? `Rs. ${value}` : '-';
const fileSafeTimestamp = () => new Date().toISOString().replace(/[-T:.Z]/g, '');
const withApiBase = (url) => url?.startsWith('/') ? `${API_BASE}${url}` : url;

function productValue(product, field, serial) {
  switch (field) {
    case 'S.No': return serial;
    case 'Register ID': return product.orders?.orderId || '-';
    case 'Design No': return product.designNo || '-';
    case 'Sub Category': return details[product.subCategoryId] || '-';
    case 'Product Image': return product.imageUrl || '';
    case 'Product Name': return product.item || '-';
    case 'Karat': return (product.karat === 10 || product.karat === '10' || product.karat === '10.00' || String(product.karat).toLowerCase() === '10k') ? '9' : (product.karat || '-');
    case 'Price': return money(product.price);
    case 'Net': return product.net || '-';
    case 'Gross': return product.gross || '-';
    case 'Pieces': return product.pcs || '-';
    case 'Vilandi': return product.vilandiCt || '-';
    case 'Vilandi Rate': return money(product.vRate);
    case 'Diamonds (Ct)': return product.diamondsCt || product.diaWeight || '-';
    case 'Diamond Price': return money(product.diaRt);
    case 'Beads (Ct.)': return product.beadsCt || '-';
    case 'Beads Rate': return money(product.bdRate);
    case 'Pearls (gm)':
    case 'Pearls Weight (gm)': return product.pearlsGm || '-';
    case 'Pearls Rate': return money(product.prlRate);
    case 'Other Stones': return product.otherStonesCt || '-';
    case 'SS Pearls (Ct.)': return product.ssPearlCt || '-';
    case 'SS Pearls Rate': return money(product.ssRate);
    case 'Real Stones (Ct.)': return money(product.realStone);
    case 'Fitting': return money(product.fitting);
    case 'Mozonite': return product.mozonite || '-';
    case 'Mozonite Rate': return money(product.mRate);
    case 'Labour Charges': return product.labour ? money(product.labour) : product.labourAll ? money(product.labourAll) : product.labourP ? money(product.labourP) : '-';
    case 'Remarks': return product.remarks || '-';
    case 'Stones': return product.stones || '-';
    case 'Stones Rate': return money(product.stRate);
    case 'Create Date': return product.createDateTime || '-';
    case 'Update Date': return product.updateDateTime || '-';
    default: return '-';
  }
}

function absoluteUrl(raw) {
  if (!raw) return '';
  try {
    return new URL(withApiBase(raw), window.location.origin).toString();
  } catch {
    return raw;
  }
}

function proxiedImageUrl(raw) {
  const abs = absoluteUrl(raw);
  if (!abs) return '';
  if (abs.includes('/proxy-image?')) return abs;
  return `${API_BASE}/proxy-image?url=${encodeURIComponent(abs)}&t=${Date.now()}`;
}

function imageToBase64(rawUrl, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const src = proxiedImageUrl(rawUrl);
    if (!src) reject(new Error('Missing image URL'));

    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => reject(new Error('Image load timeout')), timeoutMs);
    img.onload = function onLoad() {
      clearTimeout(timer);
      const canvas = document.createElement('canvas');
      canvas.width = this.naturalWidth;
      canvas.height = this.naturalHeight;
      canvas.getContext('2d').drawImage(this, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = function onError(err) {
      clearTimeout(timer);
      reject(err);
    };
    img.src = src;
  });
}

function downloadHtmlExcel(headers, rows, filename) {
  const escape = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = `
    <html><head><meta charset="UTF-8"></head><body>
      <table>
        <thead><tr>${headers.map(h => `<th>${escape(h)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${escape(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </body></html>`;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function GenerateReport({ onSwitchPage }) {
  const [mode, setMode] = useState(null);
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [startDate, setStartDate] = useState(inputDateValue());
  const [endDate, setEndDate] = useState(inputDateValue());
  const [pageSize, setPageSize] = useState('A4');
  const [tagSize, setTagSize] = useState('72x144');
  const [tagFontSize, setTagFontSize] = useState('4');
  const [foldStartSlot, setFoldStartSlot] = useState('1');
  const [foldProductCount, setFoldProductCount] = useState('');
  const [foldFontSize, setFoldFontSize] = useState(localStorage.getItem('foldFontSize') || '5.5');
  const [selectedFields, setSelectedFields] = useState([]);
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const availableSubCategories = useMemo(() => subCategories[categories[categoryId]] || [], [categoryId]);
  const availableFields = useMemo(() => categoryFields[categoryId] || [], [categoryId]);

  const visibleFields = selectedFields.length ? selectedFields : availableFields;

  const selectMode = (nextMode) => {
    setMode(nextMode);
    setMessage('');
    setProducts([]);
    setCurrentPage(0);
    setTotalPages(0);
    if (nextMode === 'CUSTOM-FOLD') {
      onSwitchPage('custom-foldable-tags');
    }
  };

  const handleCategoryChange = (value) => {
    setCategoryId(value);
    setSubCategoryId('');
    setProducts([]);
    setMessage('');
    setSelectedFields(categoryFields[value] || []);
  };

  const toggleField = (field) => {
    setSelectedFields(prev => prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]);
  };

  const validateCategory = () => {
    if (!categoryId) {
      setMessage('Please select a category.');
      return false;
    }
    return true;
  };

  const loadFilteredProducts = async (page = 0) => {
    if (!validateCategory()) return;
    if (!startDate || !endDate) {
      setMessage('Please select both start and end dates.');
      return;
    }

    setLoading(true);
    setMessage('');
    const params = new URLSearchParams({
      startDate: formatDateForApi(startDate),
      endDate: formatDateForApi(endDate),
      page: String(page),
      size: String(PRODUCTS_PER_PAGE)
    });
    if (subCategoryId) params.append('subCategoryId', subCategoryId);

    try {
      const res = await fetch(`${API_BASE}/getReport/${categoryId}?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('No products found in selected date range.');
      const data = await res.json();
      if (!data.content?.length) {
        setProducts([]);
        setMessage('No products found.');
        return;
      }
      setProducts(data.content);
      setCurrentPage(data.number || page);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setProducts([]);
      setMessage(err.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    if (!validateCategory()) return [];
    setLoading(true);
    setMessage('');
    const url = `${API_BASE}/getReportAll/${categoryId}${subCategoryId ? `?subCategoryId=${subCategoryId}` : ''}`;
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('No products found.');
      const data = await res.json();
      if (!data.length) setMessage('No products found.');
      return data;
    } catch (err) {
      setMessage(err.message || 'Failed to fetch products.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const buildReportDoc = async (reportProducts, serialOffset = 0) => {
    const headers = visibleFields.map(field => ({ text: field, style: 'tableHeader' }));
    const rows = [];

    for (let i = 0; i < reportProducts.length; i += 1) {
      const product = reportProducts[i];
      const row = [];
      for (const field of visibleFields) {
        if (field === 'Product Image') {
          try {
            const image = await imageToBase64(product.imageUrl);
            row.push({ image, fit: [55, 55] });
          } catch {
            row.push({ text: 'Image Error', style: 'tableCell' });
          }
        } else {
          row.push({ text: String(productValue(product, field, serialOffset + i + 1)), style: 'tableCell' });
        }
      }
      rows.push(row);
    }

    return {
      pageSize,
      pageOrientation: 'landscape',
      pageMargins: [20, 20, 20, 20],
      content: [
        { text: 'Product Report', style: 'title' },
        {
          table: {
            headerRows: 1,
            widths: visibleFields.map(field => field === 'Product Image' ? 70 : 'auto'),
            body: [headers, ...rows],
            dontBreakRows: true
          },
          layout: 'lightHorizontalLines'
        }
      ],
      styles: {
        title: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
        tableHeader: { bold: true, fillColor: '#f2f2f2', alignment: 'center', fontSize: 9 },
        tableCell: { fontSize: 8, margin: [2, 2, 2, 2] }
      }
    };
  };

  const downloadReportPdf = async (all = false) => {
    const data = all ? await fetchAllProducts() : products;
    if (!data.length) return;
    setLoading(true);
    try {
      const doc = await buildReportDoc(data, all ? 0 : currentPage * PRODUCTS_PER_PAGE);
      pdfMake.createPdf(doc).download(`${all ? 'Full_' : ''}Product_Report_${fileSafeTimestamp()}.pdf`);
    } finally {
      setLoading(false);
    }
  };

  const printReportPdf = async (all = false) => {
    const data = all ? await fetchAllProducts() : products;
    if (!data.length) return;
    setLoading(true);
    try {
      const doc = await buildReportDoc(data, all ? 0 : currentPage * PRODUCTS_PER_PAGE);
      pdfMake.createPdf(doc).print();
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async (all = false) => {
    const data = all ? await fetchAllProducts() : products;
    if (!data.length) return;
    const fields = visibleFields.filter(field => field !== 'Product Image');
    const rows = data.map((product, index) => fields.map(field => productValue(product, field, (all ? 0 : currentPage * PRODUCTS_PER_PAGE) + index + 1)));
    downloadHtmlExcel(fields, rows, `${all ? 'Full_' : ''}Product_Report_${Date.now()}.xls`);
  };

  const buildTagsDoc = async (tagProducts) => {
    const [tagWidthPx, tagHeightPx] = tagSize.split('x').map(Number);
    const pxToPt = (px) => px * 72 / 96;
    const tagWidthPt = pxToPt(tagWidthPx);
    const tagHeightPt = pxToPt(tagHeightPx);
    const size = pageSizes[pageSize] || pageSizes.A4;
    const margin = 18;
    const usableWidth = size.width - margin * 2;
    const usableHeight = size.height - margin * 2;
    const tagsPerRow = Math.max(1, Math.floor(usableWidth / tagWidthPt));
    const tagsPerColumn = Math.max(1, Math.floor(usableHeight / tagHeightPt));
    const tagsPerPage = tagsPerRow * tagsPerColumn;
    const content = [];

    for (let i = 0; i < tagProducts.length; i += tagsPerPage) {
      const pageProducts = tagProducts.slice(i, i + tagsPerPage);
      for (let rowIndex = 0; rowIndex < tagsPerColumn; rowIndex += 1) {
        const columns = [];
        for (let col = 0; col < tagsPerRow; col += 1) {
          const product = pageProducts[rowIndex * tagsPerRow + col];
          if (!product) {
            columns.push({ table: { widths: [tagWidthPt], body: [[{ text: ' ', height: tagHeightPt }]] }, layout: 'noBorders' });
            continue;
          }

          let qrImage = null;
          try {
            qrImage = await imageToBase64(product.qrCodePath);
          } catch {
            qrImage = null;
          }

          const filledFields = tagFields
            .filter(field => product[field.key])
            .map(field => {
              const rate = field.rateKey ? product[field.rateKey] : null;
              const rateText = rate ? ` - Rs. ${rate}` : '';
              return { text: `${field.label}: ${product[field.key]}${field.unit}${rateText}`, margin: [2, 1, 0, 0] };
            });

          const stack = [
            { text: `${product.orders?.orderId || product.orderNo || ''}/${product.designNo || '-'}`, margin: [2, 2, 0, 0] },
            { text: `G-${product.gross || ''}gm N-${product.net || ''}gm(${(product.karat === 10 || product.karat === '10' || product.karat === '10.00' || String(product.karat).toLowerCase() === '10k') ? '9' : (product.karat || '')}K)`, noWrap: true, margin: [2, 1, 0, 0] },
            ...filledFields,
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: tagWidthPt - 4, y2: 0, lineWidth: 0.5, lineColor: '#aaa' }], margin: [2, 2, 2, 2] },
            qrImage ? { image: qrImage, width: Math.min(tagWidthPt, tagHeightPt), alignment: 'center', margin: [0, 3, 0, 0] } : { text: 'QR Not Found', alignment: 'center', color: 'red', margin: [0, 3, 0, 0] }
          ];

          columns.push({
            table: { widths: [tagWidthPt], body: [[{ stack, height: tagHeightPt, width: tagWidthPt }]] },
            layout: {
              hLineWidth: () => 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => '#bbb',
              vLineColor: () => '#bbb',
              paddingTop: () => 2,
              paddingBottom: () => 2,
              paddingLeft: () => 2,
              paddingRight: () => 2
            }
          });
        }
        content.push({ columns });
      }
      if (i + tagsPerPage < tagProducts.length) content.push({ text: '', pageBreak: 'after' });
    }

    return {
      pageSize,
      pageOrientation: 'portrait',
      pageMargins: [margin, margin, margin, margin],
      content,
      defaultStyle: { fontSize: Number(tagFontSize) || 4 }
    };
  };

  const downloadTagsPdf = async () => {
    const data = await fetchAllProducts();
    if (!data.length) return;
    setLoading(true);
    try {
      const doc = await buildTagsDoc(data);
      pdfMake.createPdf(doc).download(`Product_Tags_${categoryId}_${Date.now()}.pdf`);
    } finally {
      setLoading(false);
    }
  };

  const printTagsPdf = async () => {
    const data = await fetchAllProducts();
    if (!data.length) return;
    setLoading(true);
    try {
      const doc = await buildTagsDoc(data);
      pdfMake.createPdf(doc).print();
    } finally {
      setLoading(false);
    }
  };

  const foldedTagsUrl = () => {
    const params = new URLSearchParams({
      startSlot: foldStartSlot || '1',
      fontSize: foldFontSize || '5.5'
    });
    if (subCategoryId) params.append('subCategoryId', subCategoryId);
    if (foldProductCount) params.append('count', foldProductCount);
    return `${API_BASE}/getTagsPdf/${categoryId}?${params.toString()}`;
  };

  const downloadFoldedTags = () => {
    if (!validateCategory()) return;
    localStorage.setItem('foldFontSize', foldFontSize);
    window.open(foldedTagsUrl(), '_blank');
  };

  const printFoldedTags = () => {
    if (!validateCategory()) return;
    localStorage.setItem('foldFontSize', foldFontSize);
    const win = window.open(foldedTagsUrl(), '_blank');
    if (win) win.onload = () => win.print();
  };

  return (
    <div className="generate-report-page">
      <header className="header">
        <div className="logo">Product <span>Manager</span></div>
        <div className="logout-container">
          <button className="logout-btn" onClick={() => onSwitchPage('login')}>Logout</button>
        </div>
      </header>

      <main className="report-shell">
        <div className="report-mode-bar">
          {[
            ['ALL', 'All Products / Category Report'],
            ['FILTER', 'Product Filter Report'],
            ['TAGS', 'Tags'],
            ['FOLD', 'Foldable Tags'],
            ['CUSTOM-FOLD', 'Custom Foldable Tags']
          ].map(([value, label]) => (
            <button key={value} className={mode === value ? 'active' : ''} onClick={() => selectMode(value)}>
              {label}
            </button>
          ))}
        </div>

        {mode && mode !== 'CUSTOM-FOLD' && (
          <>
            <section className="report-controls">
              <label>
                Category
                <select value={categoryId} onChange={(e) => handleCategoryChange(e.target.value)}>
                  <option value="">Select Category</option>
                  {Object.entries(categories).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
              </label>

              {availableSubCategories.length > 0 && (
                <label>
                  Sub Category
                  <select value={subCategoryId} onChange={(e) => setSubCategoryId(e.target.value)}>
                    <option value="">All Sub Categories</option>
                    {availableSubCategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                  </select>
                </label>
              )}

              {(mode === 'ALL' || mode === 'FILTER' || mode === 'TAGS') && (
                <label>
                  Page Size
                  <select value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
                    {Object.keys(pageSizes).map(size => <option key={size} value={size}>{size}</option>)}
                  </select>
                </label>
              )}

              {mode === 'FILTER' && (
                <>
                  <label>
                    Start Date
                    <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </label>
                  <label>
                    End Date
                    <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </label>
                </>
              )}

              {mode === 'TAGS' && (
                <>
                  <label>
                    Tag Size
                    <select value={tagSize} onChange={(e) => setTagSize(e.target.value)}>
                      <option value="72x144">1 x 2 inch</option>
                      <option value="100x150">1.4 x 2.1 inch</option>
                      <option value="144x144">2 x 2 inch</option>
                      <option value="51x198">0.71 x 2.76 inch</option>
                    </select>
                  </label>
                  <label>
                    Font Size
                    <select value={tagFontSize} onChange={(e) => setTagFontSize(e.target.value)}>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">Small</option>
                      <option value="7">Medium</option>
                      <option value="8">Large</option>
                    </select>
                  </label>
                </>
              )}

              {mode === 'FOLD' && (
                <>
                  <label>
                    Tag Position (1-40)
                    <input pattern="\d*" inputmode="decimal" type="text" min="1" max="40" value={foldStartSlot} onChange={(e) => setFoldStartSlot(e.target.value)} />
                  </label>
                  <label>
                    Total Products to Print
                    <input pattern="\d*" inputmode="decimal" type="text" min="1" placeholder="All" value={foldProductCount} onChange={(e) => setFoldProductCount(e.target.value)} />
                  </label>
                  <label>
                    Font Size
                    <select value={foldFontSize} onChange={(e) => setFoldFontSize(e.target.value)}>
                      <option value="4">4 (Very Small)</option>
                      <option value="5">5</option>
                      <option value="5.5">5.5 (Default)</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                      <option value="8">8</option>
                    </select>
                  </label>
                </>
              )}
            </section>

            {(mode === 'ALL' || mode === 'FILTER') && availableFields.length > 0 && (
              <section className="field-panel">
                <div className="field-panel-header">
                  <span>Select Fields to Display</span>
                  <button type="button" onClick={() => setSelectedFields(availableFields)}>Select All</button>
                  <button type="button" onClick={() => setSelectedFields([])}>Clear</button>
                </div>
                <div className="field-grid">
                  {availableFields.map(field => (
                    <label key={field}>
                      <input type="checkbox" checked={selectedFields.includes(field)} onChange={() => toggleField(field)} />
                      {field}
                    </label>
                  ))}
                </div>
              </section>
            )}

            <section className="report-actions">
              {mode === 'FILTER' && <button onClick={() => loadFilteredProducts(0)}>Submit</button>}
              {mode === 'FILTER' && products.length > 0 && (
                <>
                  <button onClick={() => downloadReportPdf(false)}>Generate PDF</button>
                  <button onClick={() => printReportPdf(false)}>Print PDF</button>
                  <button onClick={() => exportExcel(false)}>Export to Excel</button>
                </>
              )}
              {mode === 'ALL' && (
                <>
                  <button onClick={() => downloadReportPdf(true)}>Download All</button>
                  <button onClick={() => printReportPdf(true)}>Print All</button>
                  <button onClick={() => exportExcel(true)}>Export All</button>
                </>
              )}
              {mode === 'TAGS' && (
                <>
                  <button onClick={downloadTagsPdf}>Download Tags</button>
                  <button onClick={printTagsPdf}>Print Tags</button>
                </>
              )}
              {mode === 'FOLD' && (
                <>
                  <button onClick={downloadFoldedTags}>Download Folded Tags</button>
                  <button onClick={printFoldedTags}>Print Folded Tags</button>
                </>
              )}
            </section>

            {loading && <div className="report-loading">Generating report, please wait...</div>}
            {message && <div className="report-message">{message}</div>}

            {mode === 'FILTER' && products.length > 0 && (
              <>
                <div className="report-table-wrap">
                  <table className="report-table">
                    <thead>
                      <tr>{visibleFields.map(field => <th key={field}>{field}</th>)}</tr>
                    </thead>
                    <tbody>
                      {products.map((product, index) => (
                        <tr key={product.productId || `${product.designNo}-${index}`}>
                          {visibleFields.map(field => (
                            <td key={field}>
                              {field === 'Product Image' && product.imageUrl ? (
                                <img src={withApiBase(product.imageUrl)} alt={product.item || 'Product'} />
                              ) : (
                                productValue(product, field, currentPage * PRODUCTS_PER_PAGE + index + 1)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="report-pagination">
                    <button disabled={currentPage === 0} onClick={() => loadFilteredProducts(currentPage - 1)}>Previous</button>
                    <span>Page {currentPage + 1} of {totalPages}</span>
                    <button disabled={currentPage >= totalPages - 1} onClick={() => loadFilteredProducts(currentPage + 1)}>Next</button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        <div className="report-back">
          <button onClick={() => onSwitchPage('home')}>Back</button>
        </div>
      </main>
    </div>
  );
}

export default GenerateReport;
