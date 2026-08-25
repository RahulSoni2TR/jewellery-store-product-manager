import React, { useState, useEffect, useCallback } from 'react';
import pdfMake from "pdfmake/build/pdfmake.js";
import "pdfmake/build/vfs_fonts.js"; // Import vfs_fonts directly to populate pdfMake.vfs

const API_BASE = import.meta.env.DEV ? 'http://localhost:8080' : '';

function GetEstimate({ onSwitchPage, onOpenModal }) {
  const [product, setProduct] = useState(null);
  const [rates, setRates] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [includeAddons, setIncludeAddons] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [fontSize, setFontSize] = useState(14);
  const [pageSize, setPageSize] = useState('A4');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [pendingDownloadAction, setPendingAction] = useState(null);
  const [logOptions, setLogOptions] = useState({ enquiry: false, sale: false });
  const [rows, setRows] = useState([]);

  const buildInitialRows = useCallback((p, e, r) => {
    const karat = p.karat ? p.karat.toFixed(2) : "0.00";
    const goldRate = r.find(item => item.commodity === karat)?.price || 0;
    const adjGoldRate = goldRate / 10;

    const labourRows = [];
    if (Number(p.labour || 0) > 0) {
      labourRows.push({ id: 'labour', desc: 'Labour', qty: Number(p.net || 0), rate: Number(p.labour || 0), amt: Number(e.labour || 0), unit: 'gm', categoryIds: [1, 2, 3, 4, 5] });
    } else if (Number(p.labourAll || 0) > 0) {
      labourRows.push({ id: 'labourAmt', desc: 'Labour Amount', qty: null, rate: null, amt: Number(e.labour || 0), unit: '', categoryIds: [1, 2, 3, 4, 5] });
    } else if (Number(p.labourP || 0) > 0) {
      labourRows.push({ id: 'labourPer', desc: 'Labour', qty: null, rate: Number(p.labourP), amt: Number(e.labour || 0), unit: '', categoryIds: [1, 2, 3, 4, 5] });
    } else if (Number(e.labour || 0) > 0) {
      labourRows.push({ id: 'labour', desc: 'Labour', qty: Number(p.net || 0), rate: Number(p.labour || 0), amt: Number(e.labour || 0), unit: 'gm', categoryIds: [1, 2, 3, 4, 5] });
    }

    const allRows = [ // Ensure all quantities and amounts are numbers
      { id: 'gold', desc: `Gold (${(p.karat === 10 || p.karat === '10' || p.karat === '10.00' || String(p.karat).toLowerCase() === '10k') ? '9' : p.karat}KT)`, qty: Number(p.net || 0), rate: Number(adjGoldRate || 0), amt: Number(e.gold || 0), unit: 'gm', categoryIds: [1, 2, 3, 4, 5] },
      ...labourRows,
      { id: 'stones', desc: 'Stones', qty: Number(p.stones || 0), rate: Number(p.stRate || 0), amt: Number(e.stones || 0), unit: 'ct', categoryIds: [2, 4, 5] },
      { id: 'beads', desc: 'Beads', qty: Number(p.beadsCt || 0), rate: Number(p.bdRate || 0), amt: Number(e.beads || 0), unit: 'ct', categoryIds: [2, 4, 5] },
      { id: 'pearls', desc: 'Pearls', qty: Number(p.pearlsGm || 0), rate: Number(p.prlRate || 0), amt: Number(e.pearls || 0), unit: 'gm', categoryIds: [2, 4, 5] },
      { id: 'sspearls', desc: 'SS Pearls', qty: Number(p.ssPearlCt || 0), rate: Number(p.ssRate || 0), amt: Number(e.ssPearls || 0), unit: 'ct', categoryIds: [2, 4, 5] },
      { id: 'diamonds', desc: 'Diamonds', qty: Number(p.diamondsCt || 0), rate: Number(p.diaRt || 0), amt: Number(e.diamonds || 0), unit: 'ct', categoryIds: [1, 2] },
      { id: 'os', desc: 'Other Stones', qty: Number(p.otherStonesCt || 0), rate: Number(p.otherStonesRt || 0), amt: Number(e.otherStones || 0), unit: 'ct', categoryIds: [1, 2] },
      { id: 'vilandi', desc: 'Vilandi', qty: Number(p.vilandiCt || 0), rate: Number(p.vRate || 0), amt: Number(e.vilandi || 0), unit: 'ct', categoryIds: [2, 4, 5] },
      { id: 'moz', desc: 'Mozonite', qty: Number(p.mozonite || 0), rate: Number(p.mRate || 0), amt: Number(e.mozo || 0), unit: 'ct', categoryIds: [4, 5] },
      { id: 'realSt', desc: 'Real St', qty: null, rate: null, amt: Number(p.realStone || 0), unit: '', categoryIds: [4, 5] },
      { id: 'fitting', desc: 'Fitting', qty: null, rate: null, amt: Number(p.fitting || 0), unit: '', categoryIds: [2, 4, 5] },
    ];

    if (p.customFields) {
      try {
        const extras = JSON.parse(p.customFields);
        Object.entries(extras).forEach(([name, val]) => {
          const qty = parseFloat(val.qty || 0);
          const rate = parseFloat(val.rate || 0);
          if (qty > 0 && rate > 0) {
            allRows.push({ id: `addon-${name}`, desc: name, qty, rate, amt: Math.round(qty * rate), unit: '', isAddon: true, categoryIds: [p.categoryId] });
          }
        });
      } catch (e) {}
    }

    return allRows.filter(row => {
      const isVisibleForCat = row.categoryIds.includes(p.categoryId);
      const hasValue = (row.amt && row.amt > 0) || row.isAddon;
      return isVisibleForCat && hasValue;
    });
  }, []);

  const fetchData = useCallback(async () => {
    const productId = sessionStorage.getItem('productId');
    if (!productId) {
      onOpenModal('No product selected.');
      onSwitchPage('view-product');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/getEstimate/${productId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch estimate data');
      const data = await res.json();
      
      setProduct(data.object1);
      setRates(data.object3);
      setRows(buildInitialRows(data.object1, data.object2, data.object3));
    } catch (err) {
      onOpenModal(err.message);
    }
  }, [onSwitchPage, onOpenModal, buildInitialRows]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRowChange = (index, field, value) => {
    const updatedRows = [...rows];
    const row = { ...updatedRows[index] };
    const numericValue = (field === 'qty' || field === 'rate' || field === 'amt') ? (value === '' ? '' : parseFloat(value)) : value;
    row[field] = numericValue;
    if (field === 'amt') row.manual = true;
    
    if (row.id === 'labourPer' && field === 'rate') {
      const rate = parseFloat(row.rate) || 0;
      const goldRow = updatedRows.find(r => r.id === 'gold');
      const goldAmt = goldRow ? parseFloat(goldRow.amt || 0) : 0;
      row.amt = Math.round(goldAmt * rate / 100);
    } else if (field === 'qty' || field === 'rate') {
      const qty = parseFloat(row.qty) || 0;
      const rate = parseFloat(row.rate) || 0;
      row.amt = Math.round(qty * rate);
    } else if (field !== 'amt' && !row.manual && Number(row.qty) && Number(row.rate)) {
      row.amt = Math.round(Number(row.qty) * Number(row.rate));
    }
    updatedRows[index] = row;

    // Propagate gold row changes to labourPer row if it's not manually customized
    if (row.id === 'gold' && (field === 'qty' || field === 'rate' || field === 'amt')) {
      const labourPerIndex = updatedRows.findIndex(r => r.id === 'labourPer');
      if (labourPerIndex !== -1 && !updatedRows[labourPerIndex].manual) {
        const lpRow = { ...updatedRows[labourPerIndex] };
        const lpRate = parseFloat(lpRow.rate) || 0;
        lpRow.amt = Math.round(row.amt * lpRate / 100);
        updatedRows[labourPerIndex] = lpRow;
      }
    }

    setRows(updatedRows);
  };

  const addRow = () => {
    setRows([...rows, {
      id: `custom-${Date.now()}`,
      desc: 'Custom Item',
      qty: 0,
      rate: 0,
      amt: 0,
      unit: '',
      manual: true,
      isAddon: false,
      categoryIds: [product.categoryId]
    }]);
    if (!isEditMode) setIsEditMode(true);
  };

  const handleReset = () => {
    fetchData();
  };

  const calculateTotals = () => {
    const activeRows = rows.filter(r => !r.isAddon || includeAddons);
    const subtotal = activeRows.reduce((sum, r) => sum + (parseFloat(r.amt) || 0), 0);
    const gst = Math.round(subtotal * 0.03);
    const total = Math.round(subtotal + gst);
    return { subtotal, gst, total };
  };

  const { subtotal, gst, total } = calculateTotals();

  const handleDownloadConfirm = async () => {
    const action = pendingDownloadAction || 'download';
    setShowDownloadModal(false);
    const gstRate = rates.find(r => r.commodity === 'gst')?.price || 0;
    const snapshot = {
      item: product.item,
      designNo: product.designNo,
      orderId: product.orders?.orderId || '',
      customerName: customerName || 'Walk-in Customer',
      lines: rows.filter(r => !r.isAddon || includeAddons).map(r => ({
        description: r.desc,
        qty: parseFloat(r.qty) || 0,
        rate: r.id === 'labourPer' ? `${r.rate}%` : (parseFloat(r.rate) || 0),
        amount: Math.round(r.amt) || 0
      })),
      totals: { noGst: Math.round(subtotal), gst: Math.round(gst), grandTotal: Math.round(total) },
      clientTimestamp: new Date().toISOString()
    };

    if (logOptions.enquiry || logOptions.sale) {
      const endpoint = logOptions.sale ? '/logSale' : '/logEnquiry';
      await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.productId,
          designNo: product.designNo,
          orderId: product.orders?.orderId,
          customerName: customerName || 'Walk-in Customer',
          imageUrl: product.imageUrl,
          price: subtotal,
          priceWithFields: total,
          estimateSnapshot: snapshot
        }),
        credentials: 'include'
      });
    }

    const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
    const formatAmount = (value) => Number(value || 0).toLocaleString('en-IN');
    const formatQty = (value) => Number(value) > 0 ? Number(value).toFixed(3) : '';
    const formatRate = (value) => {
      if (typeof value === 'string' && value.endsWith('%')) return value;
      return Number(value) > 0 ? Number(value).toFixed(2) : '';
    };
    const estimateDate = new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    const activeLines = snapshot.lines.filter(line => Number(line.amount || 0) > 0);
    const pdfPageSizes = {
      A0: { width: 2383.94, height: 3370.39 },
      A1: { width: 1683.78, height: 2383.94 },
      A2: { width: 1190.55, height: 1683.78 },
      A3: { width: 841.89, height: 1190.55 },
      A4: { width: 595.28, height: 841.89 },
      A5: { width: 420.94, height: 595.28 },
      A6: { width: 297.64, height: 420.94 },
      Letter: { width: 612, height: 792 }
    };
    const compactPdf = ['A5', 'A6'].includes(pageSize);
    const pdfOrientation = compactPdf ? 'landscape' : 'portrait';
    const selectedPage = pdfPageSizes[pageSize] || pdfPageSizes.A4;
    const pageWidth = pdfOrientation === 'landscape' ? selectedPage.height : selectedPage.width;
    const horizontalMargin = compactPdf ? 24 : 36;
    const contentLineWidth = Math.max(220, pageWidth - horizontalMargin * 2);

    const docDef = {
      pageSize: pageSize,
      pageOrientation: pdfOrientation,
      pageMargins: [horizontalMargin, 34, horizontalMargin, 34],
      content: [
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'Fine Jewellery Estimate', style: 'brand' }
              ]
            },
            {
              width: 'auto',
              table: {
                widths: [78, 118],
                body: [
                  [{ text: 'Estimate Date', style: 'metaLabel' }, { text: estimateDate, style: 'metaValue' }],
                  [{ text: 'Design No', style: 'metaLabel' }, { text: `${product.orders?.orderId || ''}/${product.designNo || ''}`, style: 'metaValue' }],
                  [{ text: 'Customer', style: 'metaLabel' }, { text: customerName || 'Walk-in Customer', style: 'metaValue' }]
                ]
              },
              layout: {
                hLineColor: () => '#d4af37',
                vLineColor: () => '#d4af37',
                hLineWidth: () => 0.6,
                vLineWidth: () => 0.6,
                paddingLeft: () => 6,
                paddingRight: () => 6,
                paddingTop: () => 4,
                paddingBottom: () => 4
              }
            }
          ],
          margin: [0, 0, 0, 18]
        },
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: contentLineWidth, y2: 0, lineWidth: 1, lineColor: '#d4af37' }],
          margin: [0, 0, 0, 14]
        },
        {
          text: product.item || 'Product Estimate',
          style: 'estimateTitle'
        },
        {
          text: `Gold purity and product details are calculated as per current saved rates.`,
          style: 'muted',
          margin: [0, 0, 0, 14]
        },
        {
          style: 'tableExample',
          table: {
            headerRows: 1,
            widths: ['*', 92, 92, 102],
            body: [
              [
                { text: 'Description', style: 'tableHeader' },
                { text: 'Qty', style: 'tableHeader', alignment: 'right' },
                { text: 'Rate', style: 'tableHeader', alignment: 'right' },
                { text: 'Amount', style: 'tableHeader', alignment: 'right' }
              ],
              ...activeLines.map((line, index) => [
                { text: line.description, style: 'tableCell' },
                { text: formatQty(line.qty), style: 'tableCell', alignment: 'right' },
                { text: formatRate(line.rate), style: 'tableCell', alignment: 'right' },
                { text: formatAmount(line.amount), style: 'tableCell', alignment: 'right' }
              ])
            ]
          },
          layout: {
            fillColor: (rowIndex) => rowIndex === 0 ? '#12372f' : (rowIndex % 2 === 0 ? '#f8faf8' : null),
            hLineColor: () => '#d8e1de',
            vLineColor: () => '#d8e1de',
            hLineWidth: (i) => i === 0 || i === 1 ? 0.8 : 0.4,
            vLineWidth: () => 0.4,
            paddingLeft: () => 7,
            paddingRight: () => 7,
            paddingTop: () => 6,
            paddingBottom: () => 6
          },
          margin: [0, 0, 0, 16]
        },
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'Notes', style: 'sectionLabel' },
                { text: 'This estimate is generated from product details and current rates. Final billing may vary after physical verification.', style: 'muted' }
              ],
              margin: [0, 8, 24, 0]
            },
            {
              width: 240,
              table: {
                widths: ['*', 100],
                body: [
                  [{ text: 'Subtotal', style: 'summaryLabel' }, { text: formatCurrency(snapshot.totals.noGst), style: 'summaryValue' }],
                  [{ text: `GST (${gstRate}%)`, style: 'summaryLabel' }, { text: formatCurrency(snapshot.totals.gst), style: 'summaryValue' }],
                  [{ text: 'Grand Total', style: 'grandLabel' }, { text: formatCurrency(snapshot.totals.grandTotal), style: 'grandValue' }]
                ]
              },
              layout: {
                fillColor: (rowIndex) => rowIndex === 2 ? '#12372f' : '#fbfaf4',
                hLineColor: () => '#d4af37',
                vLineColor: () => '#d4af37',
                hLineWidth: () => 0.6,
                vLineWidth: () => 0.6,
                paddingLeft: () => 8,
                paddingRight: () => 8,
                paddingTop: () => 7,
                paddingBottom: () => 7
              }
            }
          ],
          margin: [0, 0, 0, 22]
        },
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: contentLineWidth, y2: 0, lineWidth: 0.7, lineColor: '#d4af37' }],
          margin: [0, 0, 0, 8]
        },
        {
          text: 'Thank you for choosing us. This is a computer-generated estimate.',
          style: 'footerNote',
          alignment: 'center'
        }
      ],
      styles: {
        brand: {
          fontSize: 20,
          bold: true,
          color: '#12372f',
          letterSpacing: 0
        },
        brandSub: {
          fontSize: 10,
          color: '#8a6d1f',
          margin: [0, 3, 0, 0]
        },
        metaLabel: {
          fontSize: Math.max(6, Number(fontSize) - 6),
          bold: true,
          color: '#12372f',
          fillColor: '#fbfaf4'
        },
        metaValue: {
          fontSize: Math.max(6, Number(fontSize) - 6),
          color: '#111827'
        },
        estimateTitle: {
          fontSize: 15,
          bold: true,
          color: '#111827',
          margin: [0, 0, 0, 4]
        },
        muted: {
          fontSize: 8,
          color: '#6b7280'
        },
        tableExample: {
          margin: [0, 5, 0, 15]
        },
        tableHeader: {
          bold: true,
          fontSize: Math.max(8, Number(fontSize) - 2),
          color: '#ffffff'
        },
        tableCell: {
          fontSize: Math.max(8, Number(fontSize) - 3),
          color: '#111827'
        },
        sectionLabel: {
          bold: true,
          fontSize: 10,
          color: '#12372f',
          margin: [0, 0, 0, 4]
        },
        summaryLabel: {
          fontSize: Math.max(7, Number(fontSize) - 5),
          color: '#374151',
          bold: true
        },
        summaryValue: {
          fontSize: Math.max(7, Number(fontSize) - 5),
          color: '#111827',
          bold: true,
          alignment: 'right'
        },
        grandLabel: {
          fontSize: Math.max(8, Number(fontSize) - 3),
          color: '#ffffff',
          bold: true
        },
        grandValue: {
          fontSize: Math.max(8, Number(fontSize) - 3),
          color: '#ffffff',
          bold: true,
          alignment: 'right'
        },
        footerNote: {
          fontSize: 8,
          color: '#6b7280'
        }
      }
    };

    const pdfDoc = pdfMake.createPdf(docDef);
    if (action === 'print') {
      pdfDoc.print();
    } else {
      pdfDoc.download(`Estimate_${product.designNo}_${new Date().toLocaleDateString()}.pdf`);
    }
    setPendingAction(null);
  };

  if (!product) return <div className="home-main">Loading estimate...</div>;

  const gstRate = rates.find(r => r.commodity === 'gst')?.price || 0;

  return (
    <>
      <header className="header">
        <div className="logo">Product <span>Manager</span></div>
        <div className="logout-container">
          <button className="logout-btn" onClick={() => onSwitchPage('login')}>Logout</button>
        </div>
      </header>

      <main 
        className="home-main" 
        style={{ 
          maxWidth: 
            ['A0', 'A1', 'A2', 'A3'].includes(pageSize) ? '1200px' : 
            pageSize === 'A4' ? '900px' : 
            pageSize === 'Letter' ? '920px' : 
            pageSize === 'A5' ? '650px' : 
            '450px', // Default for A6
          textAlign: 'left',
          transition: 'max-width 0.3s ease'
        }}
      >
        <button className="action-button secondary" onClick={() => onSwitchPage('view-product')} style={{ marginBottom: '20px', width: 'fit-content' }}>
          ← Back to List
        </button>

        <h1>Estimate for {product.item}</h1>
        <p>Design No: {product.orders?.orderId}/{product.designNo}</p>

        <div className="estimate-controls-row">
          <label className="checkbox-item" style={{ color: '#000' }}>
            <input type="checkbox" checked={includeAddons} onChange={e => setIncludeAddons(e.target.checked)} />
            Include Addons
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="action-button secondary" onClick={addRow} style={{ width: 'fit-content', padding: '8px 15px' }}>
              + Add Row
            </button>
          <button className="action-button" onClick={() => setIsEditMode(!isEditMode)} style={{ width: 'fit-content', padding: '8px 15px' }}>
            {isEditMode ? 'Exit Edit Mode' : 'Enable Edit Mode'}
          </button>
          </div>
        </div>

        <div className="table-responsive">
          <table 
            className="estimate-table" 
            style={{ 
              fontSize: `${fontSize}px`,
              transition: 'font-size 0.2s ease'
            }}
          >
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.filter(r => !r.isAddon || includeAddons).map((row) => {
                const realIndex = rows.findIndex(r => r.id === row.id);
                return (
                <tr key={row.id}>
                  <td>
                    {isEditMode && row.id.startsWith('custom-') ? (
                      <input 
                        type="text" 
                        value={row.desc} 
                        onChange={e => handleRowChange(realIndex, 'desc', e.target.value)} 
                      />
                    ) : (
                      row.desc
                    )}
                  </td>
                  <td>
                    {isEditMode && row.qty !== null ? (
                      <input pattern="\d*" inputmode="decimal" type="text" value={row.qty} onChange={e => handleRowChange(realIndex, 'qty', e.target.value)} step="0.001" />
                    ) : (
                      row.qty !== null ? Number(row.qty).toFixed(3) : ''
                    )}
                  </td>
                  <td>
                    {isEditMode && row.id === 'labourPer' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <input pattern="\d*" inputmode="decimal" type="text" value={row.rate} onChange={e => handleRowChange(realIndex, 'rate', e.target.value)} step="0.01" style={{ width: '60px' }} />
                        <span style={{ color: '#000' }}>%</span>
                      </div>
                    ) : isEditMode && row.rate !== null ? (
                      <input pattern="\d*" inputmode="decimal" type="text" value={row.rate} onChange={e => handleRowChange(realIndex, 'rate', e.target.value)} step="0.01" />
                    ) : (
                      row.rate !== null ? (row.id === 'labourPer' ? `${row.rate}%` : Number(row.rate).toFixed(2)) : ''
                    )}
                  </td>
                  <td>
                    {isEditMode && row.id.startsWith('custom-') ? (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <input pattern="\d*" inputmode="decimal" type="text" value={row.amt} onChange={e => handleRowChange(realIndex, 'amt', e.target.value)} />
                        <button className="remove-btn" onClick={() => setRows(rows.filter((_, i) => i !== realIndex))}>&times;</button>
                      </div>
                    ) : isEditMode ? (
                      <input pattern="\d*" inputmode="decimal" type="text" value={row.amt} onChange={e => handleRowChange(realIndex, 'amt', e.target.value)} />
                    ) : (
                      Math.round(row.amt || 0).toLocaleString('en-IN')
                    )}
                  </td>
                </tr>
              );})}
              <tr>
                <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>Subtotal</td>
                <td style={{ fontWeight: 'bold' }}>₹{Math.round(subtotal).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>GST ({gstRate}%)</td>
                <td style={{ fontWeight: 'bold' }}>₹{Math.round(gst).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem' }}>Grand Total</td>
                <td style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>₹{Math.round(total).toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="auth-form" style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ marginTop: '0', marginBottom: '15px', textAlign: 'center' }}>PDF Export Settings</h3>
          <div className="inline-fields" style={{ marginTop: '0' }}>
            <div>
              <label>Table Font Size</label>
              <select value={fontSize} onChange={e => setFontSize(e.target.value)}>
                {[8, 10, 12, 14, 16, 18, 20, 22, 24].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Page Size</label>
              <select value={pageSize} onChange={e => setPageSize(e.target.value)}>
                <option value="A0">A0</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="A3">A3</option>
                <option value="A4">A4</option>
                <option value="A5">A5</option>
                <option value="A6">A6</option>
                <option value="Letter">Letter</option>
              </select>
            </div>
          </div>
        </div>

        <div className="auth-link-container" style={{ marginTop: '20px', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="action-button" onClick={() => { setPendingAction('download'); setShowDownloadModal(true); }}>
            <i className="fas fa-file-invoice"></i> Download / Log Estimate
          </button>
          <button className="action-button secondary" onClick={() => { setPendingAction('print'); setShowDownloadModal(true); }}>
            <i className="fas fa-print"></i> Print Estimate
          </button>
          <button className="action-button" style={{ background: '#6c757d' }} onClick={handleReset}>
            <i className="fas fa-sync"></i> Reset
          </button>
          <button className="action-button secondary" style={{ width: '100%' }} onClick={() => onSwitchPage('view-product')}>
            <i className="fas fa-arrow-left"></i> Back to View Products
          </button>
        </div>
      </main>

      {showDownloadModal && (
        <div className="popup-overlay">
          <div className="popup-content" style={{ maxWidth: '500px' }}>
            <h2>Download & Log Options</h2>
            <div className="auth-form" style={{ marginBottom: '20px' }}>
              <label>Customer Name</label>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Optional" />
              <label className="checkbox-item" style={{ color: '#000', marginTop: '10px' }}>
                <input type="checkbox" checked={logOptions.enquiry} onChange={e => setLogOptions(prev => ({ ...prev, enquiry: e.target.checked }))} />
                Log as Enquiry
              </label>
              <label className="checkbox-item" style={{ color: '#000' }}>
                <input type="checkbox" checked={logOptions.sale} onChange={e => setLogOptions(prev => ({ ...prev, sale: e.target.checked }))} />
                Log as Sale (Frees Register ID)
              </label>
            </div>
            <div className="popup-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button className="popup-button primary" onClick={handleDownloadConfirm}>
                {pendingDownloadAction === 'print' ? 'Print Now' : 'Download PDF'}
              </button>
              <button className="popup-button secondary" onClick={() => setShowDownloadModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GetEstimate;
