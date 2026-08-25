import { useState, useEffect } from 'react';
import './Home.css';

const API_BASE = import.meta.env.DEV ? 'http://localhost:8080' : '';

function Home({ onSwitchPage, user }) {
  console.log('Home component rendering', user);
  const [prices, setPrices] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupSettings, setBackupSettings] = useState({
    enabled: true,
    frequency: 'WEEKLY',
    backupDirectory: '',
    lastBackupAt: null,
    lastBackupFile: '',
    nextDueAt: null,
    dueNow: false
  });
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupSaving, setBackupSaving] = useState(false);
  const [backupRunning, setBackupRunning] = useState(false);
  const [backupImporting, setBackupImporting] = useState(false);
  const [backupFiles, setBackupFiles] = useState([]);
  const [backupImportMode, setBackupImportMode] = useState('latest');
  const [selectedBackupFile, setSelectedBackupFile] = useState('');
  const [backupMessage, setBackupMessage] = useState('');
  const [customQrBaseUrl, setCustomQrBaseUrl] = useState('');
  const [qrRegenerating, setQrRegenerating] = useState(false);

  useEffect(() => {
    fetchPrices();
    checkPricePopup();
    if (user?.roles?.includes('ROLE_ADMIN')) {
      runDueBackupCheck();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchPrices = async () => {
    try {
      const response = await fetch(`${API_BASE}/rates`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch rates');
      const data = await response.json();
      const ratesData = Array.isArray(data) ? data : (data.rates || []);

      const pricesObj = {
        gold_10k: getPriceForCommodity(ratesData, '10.00'),
        gold_14k: getPriceForCommodity(ratesData, '14.00'),
        gold_18k: getPriceForCommodity(ratesData, '18.00'),
        gold_22k: getPriceForCommodity(ratesData, '22.00'),
        gold_24k: getPriceForCommodity(ratesData, '24.00'),
        silver: getPriceForCommodity(ratesData, 'silver'),
        diamond: getPriceForCommodity(ratesData, 'diamond'),
        gst: getPriceForCommodity(ratesData, 'gst')
      };
      setPrices(pricesObj);
    } catch (error) {
      console.error('Error fetching prices:', error);
      setPrices({});
    } finally {
      setLoading(false);
    }
  };

  const getPriceForCommodity = (data, commodity) => {
    const rate = data.find(item => item.commodity === commodity);
    return rate ? rate.price : 'N/A';
  };

  const checkPricePopup = () => {
    // 1. If updated today, never show banner
    const pricesUpdatedToday = localStorage.getItem("pricesUpdatedToday");
    const todayStr = new Date().toDateString();
    if (pricesUpdatedToday === todayStr) {
      setShowPopup(false);
      return;
    }

    // 2. Otherwise, check standard 6-hour dismissal cooldown
    const lastDismissed = localStorage.getItem("pricePopupDismissed");
    const now = new Date();
    const lastDismissedDate = lastDismissed ? new Date(lastDismissed) : null;

    if (!lastDismissedDate || now.getDate() !== lastDismissedDate.getDate()) {
      setShowPopup(true);
    } else {
      const hoursSinceDismissed = (now - lastDismissedDate) / (1000 * 60 * 60);
      if (hoursSinceDismissed >= 6) {
        setShowPopup(true);
      }
    }
  };

  const closePopup = () => setShowPopup(false);

  const redirectToSetPrices = () => {
    onSwitchPage('set-price');
  };

  const dismissForToday = () => {
    const now = new Date();
    localStorage.setItem("pricePopupDismissed", now);
    setShowPopup(false);
  };

  const handleLogout = async () => {
    localStorage.removeItem('user');
    try {
      await fetch(`${API_BASE}/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    onSwitchPage('login');
  };

  const formatDateTime = (value) => {
    if (!value) return 'Not available yet';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const hasRole = (role) => {
    return user && user.roles && user.roles.includes(role);
  };

  const loadBackupSettings = async () => {
    setBackupLoading(true);
    setBackupMessage('');
    try {
      const response = await fetch(`${API_BASE}/api/backups/config`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load backup settings');
      const data = await response.json();
      setBackupSettings(prev => ({
        ...prev,
        ...data
      }));
      await loadBackupFiles();
    } catch (error) {
      console.error('Error loading backup settings:', error);
      setBackupMessage('Could not load backup settings right now.');
    } finally {
      setBackupLoading(false);
    }
  };

  const openBackupModal = async () => {
    setShowBackupModal(true);
    await loadBackupSettings();
  };

  const closeBackupModal = () => {
    setShowBackupModal(false);
    setBackupMessage('');
  };

  const saveBackupSettings = async () => {
    setBackupSaving(true);
    setBackupMessage('');
    try {
      const response = await fetch(`${API_BASE}/api/backups/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          enabled: backupSettings.enabled,
          frequency: backupSettings.frequency,
          backupDirectory: backupSettings.backupDirectory
        })
      });
      if (!response.ok) throw new Error('Failed to save backup settings');
      const data = await response.json();
      setBackupSettings(prev => ({
        ...prev,
        ...data
      }));
      setBackupMessage(data.message || 'Backup settings saved.');
      await loadBackupFiles();
    } catch (error) {
      console.error('Error saving backup settings:', error);
      setBackupMessage('Could not save backup settings.');
    } finally {
      setBackupSaving(false);
    }
  };

  const browseBackupFolder = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/backups/browse-directory`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to open folder picker');
      const data = await response.json();
      if (data.success && data.path) {
        setBackupSettings(prev => ({
          ...prev,
          backupDirectory: data.path
        }));
      }
    } catch (error) {
      console.error('Error picking backup directory:', error);
    }
  };

  const runBackupNow = async () => {
    setBackupRunning(true);
    setBackupMessage('');
    try {
      const response = await fetch(`${API_BASE}/api/backups/run`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to run backup');
      const data = await response.json();
      setBackupSettings(prev => ({
        ...prev,
        ...data
      }));
      setBackupMessage(data.success
        ? `Backup created successfully.${data.backupFile ? ` Saved at: ${data.backupFile}` : ''}`
        : (data.error || 'Backup could not be completed.'));
      if (data.success) {
        await loadBackupFiles();
      }
    } catch (error) {
      console.error('Error running backup:', error);
      setBackupMessage('Could not create backup right now.');
    } finally {
      setBackupRunning(false);
    }
  };

  const runDueBackupCheck = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/backups/run-due`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) return;
      const data = await response.json();
      setBackupSettings(prev => ({
        ...prev,
        ...data
      }));
    } catch (error) {
      console.error('Error checking due backup:', error);
    }
  };

  const loadBackupFiles = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/backups/files`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load backup files');
      const data = await response.json();
      const files = Array.isArray(data.backups) ? data.backups : [];
      setBackupFiles(files);
      setSelectedBackupFile(prev => prev || files[0]?.name || '');
    } catch (error) {
      console.error('Error loading backup files:', error);
      setBackupFiles([]);
    }
  };

  const importBackup = async () => {
    const importingLatest = backupImportMode === 'latest';
    if (!importingLatest && !selectedBackupFile) {
      setBackupMessage('Select a backup file to import.');
      return;
    }

    const targetLabel = importingLatest ? 'the latest backup' : selectedBackupFile;
    const confirmed = window.confirm(`Import ${targetLabel}? This will replace the current database with the selected backup.`);
    if (!confirmed) return;

    setBackupImporting(true);
    setBackupMessage('');
    try {
      const response = await fetch(`${API_BASE}/api/backups/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          latest: importingLatest,
          backupFile: importingLatest ? null : selectedBackupFile
        })
      });
      if (!response.ok) throw new Error('Failed to import backup');
      const data = await response.json();
      setBackupFiles(Array.isArray(data.backups) ? data.backups : []);
      setBackupMessage(data.success
        ? `Backup imported successfully.${data.importedFile ? ` Imported: ${data.importedFile}` : ''}`
        : (data.error || 'Backup import could not be completed.'));
    } catch (error) {
      console.error('Error importing backup:', error);
      setBackupMessage('Could not import backup right now.');
    } finally {
      setBackupImporting(false);
    }
  };

  const handleRegenerateQrs = async () => {
    const confirmed = window.confirm("Are you sure you want to regenerate all QR codes? This might take a few moments.");
    if (!confirmed) return;

    setQrRegenerating(true);
    setBackupMessage('');
    try {
      let url = `${API_BASE}/api/backups/regenerate-qrs`;
      if (customQrBaseUrl.trim()) {
        url += `?customBaseUrl=${encodeURIComponent(customQrBaseUrl.trim())}`;
      }
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to regenerate QR codes');
      const data = await response.json();
      if (data.success) {
        setBackupMessage(data.message || `QR codes regenerated successfully (${data.count} codes).`);
      } else {
        setBackupMessage(data.error || 'Failed to regenerate QR codes.');
      }
    } catch (error) {
      console.error('Error regenerating QR codes:', error);
      setBackupMessage('Could not regenerate QR codes right now.');
    } finally {
      setQrRegenerating(false);
    }
  };

  const formatFileSize = (sizeBytes) => {
    const size = Number(sizeBytes);
    if (!Number.isFinite(size) || size <= 0) return '0 KB';
    if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const priceLabel = loading
    ? "Loading prices..."
    : `Gold 9K: ₹${prices.gold_10k} | Gold 14K: ₹${prices.gold_14k} | Gold 18K: ₹${prices.gold_18k} | Gold 22K: ₹${prices.gold_22k} | Gold 24K: ₹${prices.gold_24k} | Silver: ₹${prices.silver} | Diamond: ₹${prices.diamond} | GST: ${prices.gst}%`;

  return (
    <div className="home-screen">
      {/* Header */}
      <header className="header">
        <div className="logo">Product <span>Manager</span></div>
        <div className="logout-container">
          <div className="dropdown">
            <button className="dropbtn">
              <i className="fas fa-user-circle"></i> User Options
            </button>
            <div className="dropdown-content">
              {hasRole('ROLE_ADMIN') && (
                <button type="button" className="dropdown-item" onClick={() => onSwitchPage('permissions')}>
                  <i className="fas fa-key"></i> User Permissions
                </button>
              )}
              {hasRole('ROLE_ADMIN') && (
                <button type="button" className="dropdown-item" onClick={openBackupModal}>
                  <i className="fas fa-database"></i> Backup Settings
                </button>
              )}
              {hasRole('ROLE_ADMIN') && (
                <button type="button" className="dropdown-item" onClick={() => onSwitchPage('karat-ratios')}>
                  <i className="fas fa-percentage"></i> Gold Karat Ratios
                </button>
              )}
              <button type="button" className="dropdown-item" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="home-content-scroll">
        {/* Scrolling Prices Header */}
        <div className="scrolling-prices-container">
          <div className="scrolling-prices">
            <span className="scrolling-text">{priceLabel}</span>
          </div>
        </div>

        {/* Price Reminder Top Banner */}
        {showPopup && (
          <div className="price-reminder-banner">
            <span className="banner-message">
              ⚠️ <strong>Price Reminder:</strong> Gold and silver rates have not been updated today.
            </span>
            <div className="banner-actions">
              <button className="banner-btn primary" onClick={redirectToSetPrices}>Set Prices Now</button>
              <button className="banner-btn secondary" onClick={dismissForToday}>Dismiss</button>
            </div>
          </div>
        )}

        {showBackupModal && (
          <div className="popup-overlay backup-popup-overlay">
            <div className="popup-content backup-popup-content">
              <button className="popup-close-btn" onClick={closeBackupModal}>&times;</button>
              <div className="popup-header backup-popup-header">
                <h2>Database Backup Settings</h2>
                <p>Keep a local SQL backup of your tables and data so it can be imported again if needed.</p>
              </div>

              <div className="backup-grid">
                <div className="backup-card">
                  <label className="backup-toggle">
                    <input
                      type="checkbox"
                      checked={backupSettings.enabled}
                      onChange={(e) => setBackupSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                    />
                    <span>Enable automatic backup checks when the app is opened</span>
                  </label>

                  <label className="backup-label">Backup Frequency</label>
                  <select
                    className="backup-select"
                    value={backupSettings.frequency}
                    onChange={(e) => setBackupSettings(prev => ({ ...prev, frequency: e.target.value }))}
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>

                  <p className="backup-note">
                    If the machine is turned off when a backup is due, the app will create the missed backup the next time it is opened.
                  </p>
                </div>

                <div className="backup-card backup-meta-card">
                  <div className="backup-meta-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '5px' }}>
                    <span>Backup Folder</span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <input 
                        type="text" 
                        value={backupSettings.backupDirectory || ''} 
                        onChange={(e) => setBackupSettings(prev => ({ ...prev, backupDirectory: e.target.value }))}
                        style={{ 
                          padding: '6px 10px', 
                          border: '1px solid #cbd5e1', 
                          borderRadius: '6px', 
                          fontSize: '0.9rem',
                          color: '#000',
                          flex: 1,
                          boxSizing: 'border-box'
                        }} 
                      />
                      <button 
                        type="button" 
                        onClick={browseBackupFolder}
                        className="action-button"
                        style={{ padding: '6px 12px', fontSize: '0.9rem', width: 'fit-content', whiteSpace: 'nowrap', borderRadius: '6px', background: '#007bff' }}
                      >
                        Browse...
                      </button>
                    </div>
                  </div>
                  <div className="backup-meta-row">
                    <span>Last Backup</span>
                    <strong>{formatDateTime(backupSettings.lastBackupAt)}</strong>
                  </div>
                  <div className="backup-meta-row">
                    <span>Next Due</span>
                    <strong>{formatDateTime(backupSettings.nextDueAt)}</strong>
                  </div>
                  <div className="backup-meta-row">
                    <span>Status</span>
                    <strong>{backupSettings.dueNow ? 'Backup due now' : 'On schedule'}</strong>
                  </div>
                  <div className="backup-meta-row backup-file-row">
                    <span>Latest File</span>
                    <strong>{backupSettings.lastBackupFile || 'No backup created yet'}</strong>
                  </div>
                </div>
              </div>

              <div className="backup-import-panel">
                <div>
                  <label className="backup-label">Import Backup</label>
                  <p className="backup-note">
                    Choose the latest backup or select a specific SQL backup from the backup folder.
                  </p>
                </div>

                <div className="backup-radio-group">
                  <label>
                    <input
                      type="radio"
                      name="backup-import-mode"
                      value="latest"
                      checked={backupImportMode === 'latest'}
                      onChange={() => setBackupImportMode('latest')}
                    />
                    Latest backup
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="backup-import-mode"
                      value="specific"
                      checked={backupImportMode === 'specific'}
                      onChange={() => setBackupImportMode('specific')}
                    />
                    Select backup
                  </label>
                </div>

                <select
                  className="backup-select"
                  value={selectedBackupFile}
                  onChange={(e) => setSelectedBackupFile(e.target.value)}
                  disabled={backupImportMode !== 'specific' || backupFiles.length === 0}
                >
                  {backupFiles.length === 0 ? (
                    <option value="">No backups available</option>
                  ) : (
                    backupFiles.map(file => (
                      <option key={file.name} value={file.name}>
                        {file.name} - {formatDateTime(file.lastModified)} - {formatFileSize(file.sizeBytes)}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="qr-regen-panel">
                <div>
                  <label className="backup-label">Regenerate QR Codes</label>
                  <p className="backup-note">
                    Regenerate product QR codes. You can specify a custom base URL (e.g. if migrating to a new machine/URL). Leave blank to use default application URL.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <input
                    type="text"
                    placeholder="e.g. http://192.168.1.50:18080 (Optional)"
                    value={customQrBaseUrl}
                    onChange={(e) => setCustomQrBaseUrl(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      color: '#000',
                      flex: 1,
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleRegenerateQrs}
                    disabled={qrRegenerating || backupLoading}
                    className="popup-button secondary"
                    style={{ padding: '8px 16px', fontSize: '0.9rem', width: 'auto', whiteSpace: 'nowrap', margin: 0 }}
                  >
                    {qrRegenerating ? 'Regenerating...' : 'Regenerate'}
                  </button>
                </div>
              </div>

              {backupLoading && <p className="backup-feedback">Loading backup details...</p>}
              {!backupLoading && backupMessage && <p className="backup-feedback">{backupMessage}</p>}

              <div className="popup-actions backup-actions">
                <button className="popup-button primary" onClick={saveBackupSettings} disabled={backupSaving || backupLoading}>
                  {backupSaving ? 'Saving...' : 'Save Settings'}
                </button>
                <button className="popup-button secondary" onClick={runBackupNow} disabled={backupRunning || backupLoading}>
                  {backupRunning ? 'Creating Backup...' : 'Backup Now'}
                </button>
                <button
                  className="popup-button warning"
                  onClick={importBackup}
                  disabled={backupImporting || backupLoading || backupFiles.length === 0}
                >
                  {backupImporting ? 'Importing...' : 'Import Backup'}
                </button>
                <button className="popup-button ghost" onClick={closeBackupModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="home-main">
          <h1>Welcome, <span>{user ? user.username : 'Guest'}</span>!</h1>
          <p className="subtitle">Your one-stop solution for managing all product operations</p>
          {/* Action Buttons */}
          <div className="button-container">
            {(hasRole('ROLE_EDITOR') || hasRole('ROLE_ADMIN')) && (
              <button className="action-button" onClick={() => onSwitchPage('set-price')}>
                <i className="fas fa-dollar-sign"></i> Set Prices
              </button>
            )}
            {(hasRole('ROLE_EDITOR') || hasRole('ROLE_ADMIN') || hasRole('ROLE_VIEWER')) && (
              <button className="action-button" onClick={() => onSwitchPage('view-product')}>
                <i className="fas fa-eye"></i> View Products
              </button>
            )}
            {hasRole('ROLE_ADMIN') && (
              <button className="action-button" onClick={() => onSwitchPage('add-product')}>
                <i className="fas fa-plus"></i> Add Product
              </button>
            )}
            {(hasRole('ROLE_EDITOR') || hasRole('ROLE_ADMIN')) && (
              <button className="action-button" onClick={() => {
                sessionStorage.removeItem('modifyDesignNo');
                sessionStorage.removeItem('modifyReferrer');
                onSwitchPage('modify-product');
              }}>
                <i className="fas fa-edit"></i> Modify Product
              </button>
            )}
            {hasRole('ROLE_ADMIN') && (
              <button className="action-button" onClick={() => onSwitchPage('remove-product')}>
                <i className="fas fa-trash"></i> Remove Product
              </button>
            )}
            {(hasRole('ROLE_EDITOR') || hasRole('ROLE_ADMIN') || hasRole('ROLE_VIEWER')) && (
              <button className="action-button" onClick={() => onSwitchPage('enquiry-log')}>
                <i className="fas fa-clipboard-list"></i> Product Enquiry
              </button>
            )}
            {(hasRole('ROLE_EDITOR') || hasRole('ROLE_ADMIN') || hasRole('ROLE_VIEWER')) && (
              <button className="action-button" onClick={() => onSwitchPage('verify-product')}>
                <i className="fas fa-check-circle"></i> Verify Products
              </button>
            )}
            {(hasRole('ROLE_EDITOR') || hasRole('ROLE_ADMIN') || hasRole('ROLE_VIEWER')) && (
              <button className="action-button" onClick={() => onSwitchPage('sales-log')}>
                <i className="fas fa-box-open"></i> Sold Products
              </button>
            )}
            {(hasRole('ROLE_EDITOR') || hasRole('ROLE_ADMIN')) && (
              <button className="action-button" onClick={() => onSwitchPage('generate-report')}>
                <i className="fas fa-file-alt"></i> Generate Report
              </button>
            )}
            {hasRole('ROLE_ADMIN') && (
              <button className="action-button" onClick={() => onSwitchPage('import-data')}>
                <i className="fas fa-file-import"></i> Import Data
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Home;
