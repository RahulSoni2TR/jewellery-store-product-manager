import React, { useEffect, useState } from 'react';
import pdfMake from "pdfmake/build/pdfmake.js";
import "pdfmake/build/vfs_fonts.js";
import './Modal.css';

const API_BASE = import.meta.env.DEV ? 'http://localhost:8080' : '';

const reconstructEstimateFromProduct = (product, parsedEstimate) => {
  if (!product) return parsedEstimate || {};
  
  const subtotal = product.price || parsedEstimate?.price || 0;
  const grandTotal = product.priceWithFields || parsedEstimate?.priceWithFields || subtotal;
  
  // Determine if prices are GST-inclusive
  const isGstExclusive = subtotal > 0 && Math.abs(grandTotal - subtotal * 1.03) < 5;
  const isGstInclusive = !isGstExclusive;
  
  let subtotalExclGst = subtotal;
  let grandTotalExclGst = subtotal;
  let calculatedGst = grandTotal - subtotal;
  
  if (isGstInclusive) {
    subtotalExclGst = subtotal / 1.03;
    grandTotalExclGst = grandTotal / 1.03;
    calculatedGst = grandTotal - grandTotalExclGst;
  }
  
  const lines = [];
  const getAmt = (qty, rate) => (Number(qty || 0) * Number(rate || 0));
  
  let stonesAmt = getAmt(product.stones, product.stRate);
  let beadsAmt = getAmt(product.beadsCt, product.bdRate);
  let pearlsAmt = getAmt(product.pearlsGm, product.prlRate);
  let ssPearlsAmt = getAmt(product.ssPearlCt, product.ssRate);
  let diamondsAmt = getAmt(product.diamondsCt, product.diaRt);
  let otherStonesAmt = getAmt(product.otherStonesCt, product.otherStonesRt);
  let vilandiAmt = getAmt(product.vilandiCt, product.vRate);
  let mozAmt = getAmt(product.mozonite, product.mRate);
  let realStAmt = Number(product.realStone || 0);
  let fittingAmt = Number(product.fitting || 0);
  
  let customFieldsAmt = 0;
  const customLines = [];
  if (product.customFields) {
    try {
      const extras = JSON.parse(product.customFields);
      Object.entries(extras).forEach(([name, val]) => {
        const qty = parseFloat(val.qty || 0);
        const rate = parseFloat(val.rate || 0);
        if (qty > 0 && rate > 0) {
          const amt = Math.round(qty * rate);
          customFieldsAmt += amt;
          customLines.push({
            description: name,
            qty: qty,
            rate: rate,
            amount: amt
          });
        }
      });
    } catch (e) {}
  }
  
  let labourAmt = 0;
  let labourDesc = 'Labour';
  let labourQty = null;
  let labourRate = null;
  
  const nonGoldExclLabour = stonesAmt + beadsAmt + pearlsAmt + ssPearlsAmt + diamondsAmt + 
                            otherStonesAmt + vilandiAmt + mozAmt + realStAmt + fittingAmt + 
                            customFieldsAmt;
                            
  if (Number(product.labour || 0) > 0) {
    labourQty = Number(product.net || 0);
    labourRate = Number(product.labour || 0);
    labourAmt = labourQty * labourRate;
  } else if (Number(product.labourAll || 0) > 0) {
    labourAmt = Number(product.labourAll || 0);
    labourDesc = 'Labour Amount';
  }
  
  let goldAmt = 0;
  if (Number(product.labourP || 0) > 0) {
    const labourP = Number(product.labourP);
    const baseAmount = isGstInclusive 
      ? (subtotalExclGst - (nonGoldExclLabour - customFieldsAmt)) 
      : (subtotalExclGst - nonGoldExclLabour);
    goldAmt = Math.max(0, baseAmount / (1 + labourP / 100));
    labourAmt = goldAmt * labourP / 100;
    labourDesc = 'Labour';
    labourRate = `${product.labourP}%`;
  } else {
    const nonGoldTotal = nonGoldExclLabour + labourAmt;
    goldAmt = isGstInclusive 
      ? Math.max(0, subtotalExclGst - (nonGoldTotal - customFieldsAmt))
      : Math.max(0, subtotalExclGst - nonGoldTotal);
  }
  
  if (goldAmt > 0 || Number(product.net || 0) > 0) {
    const net = Number(product.net || 0);
    lines.push({
      description: `Gold (${(product.karat === 10 || product.karat === '10' || product.karat === '10.00' || String(product.karat).toLowerCase() === '10k') ? '9' : (product.karat || 22)}KT)`,
      qty: net,
      rate: net > 0 ? Math.round((goldAmt / net) * 100) / 100 : 0,
      amount: Math.round(goldAmt)
    });
  }
  
  if (labourAmt > 0) {
    lines.push({
      description: labourDesc,
      qty: labourQty,
      rate: labourRate,
      amount: Math.round(labourAmt)
    });
  }
  
  if (stonesAmt > 0) lines.push({ description: 'Stones', qty: Number(product.stones), rate: Number(product.stRate), amount: Math.round(stonesAmt) });
  if (beadsAmt > 0) lines.push({ description: 'Beads', qty: Number(product.beadsCt), rate: Number(product.bdRate), amount: Math.round(beadsAmt) });
  if (pearlsAmt > 0) lines.push({ description: 'Pearls', qty: Number(product.pearlsGm), rate: Number(product.prlRate), amount: Math.round(pearlsAmt) });
  if (ssPearlsAmt > 0) lines.push({ description: 'SS Pearls', qty: Number(product.ssPearlCt), rate: Number(product.ssRate), amount: Math.round(ssPearlsAmt) });
  if (diamondsAmt > 0) lines.push({ description: 'Diamonds', qty: Number(product.diamondsCt), rate: Number(product.diaRt), amount: Math.round(diamondsAmt) });
  if (otherStonesAmt > 0) lines.push({ description: 'Other Stones', qty: Number(product.otherStonesCt), rate: Number(product.otherStonesRt), amount: Math.round(otherStonesAmt) });
  if (vilandiAmt > 0) lines.push({ description: 'Vilandi', qty: Number(product.vilandiCt), rate: Number(product.vRate), amount: Math.round(vilandiAmt) });
  if (mozAmt > 0) lines.push({ description: 'Mozonite', qty: Number(product.mozonite), rate: Number(product.mRate), amount: Math.round(mozAmt) });
  if (realStAmt > 0) lines.push({ description: 'Real St', qty: null, rate: null, amount: Math.round(realStAmt) });
  if (fittingAmt > 0) lines.push({ description: 'Fitting', qty: null, rate: null, amount: Math.round(fittingAmt) });
  
  lines.push(...customLines);
  
  return {
    item: product.item || parsedEstimate?.item || 'N/A',
    designNo: product.designNo || parsedEstimate?.designNo || '',
    orderId: product.orders?.orderId || parsedEstimate?.orderId || '',
    customerName: product.customerName || parsedEstimate?.customerName || 'N/A',
    clientTimestamp: parsedEstimate?.clientTimestamp || new Date().toISOString(),
    lines: lines,
    totals: {
      noGst: Math.round(grandTotalExclGst),
      gst: Math.round(calculatedGst),
      grandTotal: Math.round(grandTotal)
    }
  };
};

function EstimateSnapshot({ onSwitchPage }) {
  const [estimate, setEstimate] = useState(null);
  const [returnPage, setReturnPage] = useState('enquiry-log');

  useEffect(() => {
    const storedEstimate = sessionStorage.getItem('estimateFromLog');
    const storedReturnPage = sessionStorage.getItem('returnToPage');
    
    if (storedEstimate) {
      try {
        let parsed = JSON.parse(storedEstimate);
        if (!parsed || !parsed.lines || parsed.lines.length === 0) {
          const storedProduct = sessionStorage.getItem('productFromLog');
          if (storedProduct) {
            const product = JSON.parse(storedProduct);
            parsed = reconstructEstimateFromProduct(product, parsed);
          }
        }
        setEstimate(parsed);
      } catch (e) {
        console.error('Error parsing estimate:', e);
      }
    } else {
      const storedProduct = sessionStorage.getItem('productFromLog');
      if (storedProduct) {
        try {
          const product = JSON.parse(storedProduct);
          const reconstructed = reconstructEstimateFromProduct(product, null);
          setEstimate(reconstructed);
        } catch (e) {
          console.error('Error reconstructing from product:', e);
        }
      }
    }
    
    if (storedReturnPage) {
      // Extract page name from URL if it's a full URL
      if (storedReturnPage.includes('enquiry')) {
        setReturnPage('enquiry-log');
      } else if (storedReturnPage.includes('sales')) {
        setReturnPage('sales-log');
      }
    }
  }, []);

  const handleBack = () => {
    sessionStorage.removeItem('estimateFromLog');
    sessionStorage.removeItem('returnToPage');
    onSwitchPage(returnPage);
  };

  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
  const formatNumber = (value) => Number(value || 0).toLocaleString('en-IN');
  const formatQty = (line) => {
    const qty = Number(line.qty || 0);
    if (qty <= 0) return '';
    return `${qty.toFixed(3)}${getUnit(line.description || '')}`;
  };
  const formatRate = (value) => {
    if (typeof value === 'string' && value.endsWith('%')) return value;
    return Number(value || 0) > 0 ? Number(value).toFixed(2) : '';
  };

  const handleDownloadPdf = () => {
    if (!estimate) return;

    const lines = (estimate.lines || []).filter(line => Number(line.amount || 0) > 0);
    const fileDesignNo = estimate.designNo || estimate.orderId || 'estimate';
    const formattedDate = estimate.clientTimestamp
      ? new Date(estimate.clientTimestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      : 'N/A';

    const body = [
      [
        { text: 'Description', style: 'tableHeader' },
        { text: 'Qty', style: 'tableHeader' },
        { text: 'Rate', style: 'tableHeader' },
        { text: 'Amount', style: 'tableHeader' }
      ],
      ...lines.map(line => [
        { text: line.description || '-', style: 'tableCell' },
        { text: formatQty(line), style: 'tableCell' },
        { text: formatRate(line.rate), style: 'tableCell' },
        { text: formatCurrency(line.amount), style: 'tableCell' }
      ])
    ];

    if (Number(estimate.totals?.gst || 0) > 0) {
      body.push([
        { text: 'GST', colSpan: 3, alignment: 'right', style: 'total' },
        {},
        {},
        { text: formatCurrency(estimate.totals.gst), style: 'total' }
      ]);
    }

    body.push([
      { text: 'Total', colSpan: 3, alignment: 'right', style: 'grandTotal' },
      {},
      {},
      { text: formatCurrency(estimate.totals?.grandTotal), style: 'grandTotal' }
    ]);

    const docDef = {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      content: [
        { text: `Estimate for ${estimate.item || ''}`, style: 'header', alignment: 'center' },
        { text: `Design No: ${estimate.orderId || ''}/${estimate.designNo || ''}`, alignment: 'center', margin: [0, 4, 0, 12] },
        {
          columns: [
            { text: `Customer: ${estimate.customerName || 'N/A'}` },
            { text: `Date: ${formattedDate}`, alignment: 'right' }
          ],
          margin: [0, 0, 0, 12]
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body
          },
          layout: 'lightHorizontalLines'
        }
      ],
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 8] },
        tableHeader: { bold: true, fontSize: 11, color: 'black' },
        tableCell: { fontSize: 10, color: 'black' },
        total: { bold: true, fontSize: 11, color: 'black' },
        grandTotal: { bold: true, fontSize: 12, color: 'black' }
      }
    };

    pdfMake.createPdf(docDef).download(`Estimate_${fileDesignNo}_${Date.now()}.pdf`);
  };

  if (!estimate) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <button className="modal-close-btn" onClick={handleBack}>&times;</button>
          <h2>Estimate Not Found</h2>
          <p>No estimate data available.</p>
          <button className="action-button secondary" onClick={handleBack}>
            Back
          </button>
        </div>
      </div>
    );
  }

  const getUnit = (desc) => {
    const d = desc.toLowerCase();
    if (d.includes('gold') || d.includes('labour') || d.includes('pearls')) return ' gm';
    if (d.includes('beads') || d.includes('diamonds') || d.includes('stones') || d.includes('vilandi') || d.includes('ss pearls')) return ' ct';
    return '';
  };

  return (
    <div className="modal-overlay">
      <div className="estimate-snapshot-modal-content">
        <button className="modal-close-btn" onClick={handleBack}>&times;</button>
        
        <div style={{ padding: '20px' }}>
          <h2 style={{ marginBottom: '20px', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>
            Estimate Snapshot
          </h2>

          {/* Estimate Details */}
          <div style={{ marginBottom: '20px' }}>
            <h3>Estimate Information</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold', width: '30%' }}>Item:</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{estimate.item || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Design No:</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{estimate.designNo || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Customer Name:</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{estimate.customerName || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Date:</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                    {estimate.clientTimestamp ? new Date(estimate.clientTimestamp).toLocaleString() : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Items Table */}
          {estimate.lines && estimate.lines.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3>Estimated Items</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                <thead style={{ backgroundColor: '#f5f5f5' }}>
                  <tr>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Description</th>
                    <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Quantity</th>
                    <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Rate (per unit)</th>
                    <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {estimate.lines.map((line, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{line.description || '-'}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                        {line.qty > 0 ? `${line.qty.toFixed(3)}${getUnit(line.description)}` : '-'}
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                        {line.rate > 0 ? line.rate.toFixed(2) : '-'}
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontWeight: 'bold', textAlign: 'right' }}>
                        {line.amount ? line.amount.toLocaleString('en-IN') : '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Total Section */}
          {estimate.totals && (
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '5px' }}>
              <table style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px', fontSize: '14px' }}>Subtotal (Excl. GST):</td>
                    <td style={{ padding: '4px', textAlign: 'right', fontSize: '14px' }}>
                      ₹{estimate.totals.noGst?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px', fontSize: '14px' }}>GST:</td>
                    <td style={{ padding: '4px', textAlign: 'right', fontSize: '14px' }}>
                      ₹{estimate.totals.gst?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #ccc' }}>
                    <td style={{ padding: '8px 4px', fontWeight: 'bold', fontSize: '16px' }}>Grand Total:</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 'bold', fontSize: '18px', color: '#2c3e50' }}>
                      ₹{estimate.totals.grandTotal?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Notes */}
          {estimate.notes && (
            <div style={{ marginBottom: '20px' }}>
              <h3>Notes</h3>
              <div style={{ padding: '10px', backgroundColor: '#fffbea', border: '1px solid #f0ad4e', borderRadius: '4px' }}>
                {estimate.notes}
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button className="action-button" onClick={handleDownloadPdf}>
              <i className="fas fa-download"></i> Download PDF
            </button>
            <button className="action-button secondary" onClick={handleBack}>
              <i className="fas fa-arrow-left"></i> Back to Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EstimateSnapshot;
