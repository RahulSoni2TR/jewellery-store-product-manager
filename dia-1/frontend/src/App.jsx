import { useState, useEffect } from 'react';
import Login from './components/Login.jsx';
import Signup from './components/Signup.jsx';
import ForgotPassword from './components/ForgotPassword.jsx';
import ResetPassword from './components/ResetPassword.jsx';
import ViewRates from './components/ViewRates.jsx';
import Home from './components/Home.jsx';
import SetPrice from './components/SetPrice.jsx';
import AddProduct from './components/AddProduct.jsx';
import ModifyProduct from './components/ModifyProduct.jsx';
import BatchUpdate from './components/BatchUpdate.jsx';
import ViewProduct from './components/ViewProduct.jsx';
import RemoveProduct from './components/RemoveProduct.jsx';
import LoadProduct from './components/LoadProduct.jsx';
import GetEstimate from './components/GetEstimate.jsx';
import VerifyProducts from './components/VerifyProducts.jsx';
import EnquiryLog from './components/EnquiryLog.jsx';
import SalesLog from './components/SalesLog.jsx';
import EstimateSnapshot from './components/EstimateSnapshot.jsx';
import ProductSnapshot from './components/ProductSnapshot.jsx';
import GenerateReport from './components/GenerateReport.jsx';
import CustomFoldableTags from './components/CustomFoldableTags.jsx';
import ImportData from './components/ImportData.jsx';
import Permissions from './components/Permissions.jsx';
import PriceHistory from './components/PriceHistory.jsx';
import KaratRatios from './components/KaratRatios.jsx';
import Modal from './components/Modal.jsx'; 
import './components/Home.css';

const API_BASE = import.meta.env.DEV ? 'http://localhost:8080' : '';

function App() {
  const getInitialPage = () => {
    const path = window.location.pathname;
    
    // Check if it's the QR scan path (case-insensitive and optional s)
    const decodedPath = decodeURIComponent(path);
    const qrMatch = decodedPath.match(/^\/loadProducts?ByDesignNo\/([^/]+)/i);
    if (qrMatch) {
      const designNo = qrMatch[1];
      try {
        sessionStorage.setItem('productId', designNo);
        sessionStorage.setItem('isDesignNo', 'true');
      } catch (e) {
        console.warn('sessionStorage is not accessible:', e);
      }
      return 'load-product';
    }

    const cleanPath = path.replace(/^\/|\/$/g, '');
    if (!cleanPath || cleanPath === 'login') return 'login';
    if (cleanPath === 'custom-tags') return 'custom-foldable-tags';
    if (cleanPath === 'public-rates') return 'view-rates';
    return cleanPath;
  };

  const [page, setPage] = useState(getInitialPage);
  const [modalMessage, setModalMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [licenseStatus, setLicenseStatus] = useState(null);
  const [licenseDetails, setLicenseDetails] = useState(null);

  const checkLicense = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/license/status`);
      if (res.ok) {
        const data = await res.json();
        setLicenseStatus(data.status);
        setLicenseDetails(data);
        if (data.status === 'EXPIRED' || data.status === 'TAMPERED') {
          setPage('login');
          window.history.pushState(null, '', '/');
        }
      }
    } catch (err) {
      console.error('License check failed:', err);
    }
  };

  // Safely initialize user from localStorage
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('localStorage is not accessible during initialization:', e);
    }
    return null;
  });

  useEffect(() => {
    checkLicense();
    const handlePopState = () => {
      setPage(getInitialPage());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSwitchPage = (newPage) => {
    if ((licenseStatus === 'EXPIRED' || licenseStatus === 'TAMPERED') && newPage !== 'login') {
      newPage = 'login';
    }
    setPage(newPage);
    let path = '/';
    if (newPage !== 'login') {
      if (newPage === 'custom-foldable-tags') {
        path = '/custom-tags';
      } else if (newPage === 'view-rates') {
        path = '/public-rates';
      } else {
        path = `/${newPage}`;
      }
    }
    window.history.pushState(null, '', path);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    try {
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (e) {
      console.warn('Failed to save user to localStorage:', e);
    }
  };

  const openModal = (message) => {
    setModalMessage(message);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalMessage('');
  };

  const activePage = (licenseStatus === 'EXPIRED' || licenseStatus === 'TAMPERED') ? 'login' : page;

  return (
    <div className="home-page">
      <div className="flex-grow">
        {activePage === 'home' ? (
          <Home onSwitchPage={handleSwitchPage} user={user} />
        ) : activePage === 'set-price' ? (
          <SetPrice onSwitchPage={handleSwitchPage} />
        ) : activePage === 'add-product' ? (
          <AddProduct onSwitchPage={handleSwitchPage} onOpenModal={openModal} />
        ) : activePage === 'modify-product' ? (
          <ModifyProduct onSwitchPage={handleSwitchPage} onOpenModal={openModal} />
        ) : activePage === 'batch-update' ? (
          <BatchUpdate onSwitchPage={handleSwitchPage} onOpenModal={openModal} />
        ) : activePage === 'view-product' ? (
          <ViewProduct onSwitchPage={handleSwitchPage} onOpenModal={openModal} />
        ) : activePage === 'remove-product' ? (
          <RemoveProduct onSwitchPage={handleSwitchPage} onOpenModal={openModal} />
        ) : activePage === 'load-product' ? (
          <LoadProduct onSwitchPage={handleSwitchPage} onOpenModal={openModal} />
        ) : activePage === 'verify-product' ? (
          <VerifyProducts onSwitchPage={handleSwitchPage} onOpenModal={openModal} />
        ) : activePage === 'get-estimate' ? (
          <GetEstimate onSwitchPage={handleSwitchPage} onOpenModal={openModal} />
        ) : activePage === 'enquiry-log' ? (
          <EnquiryLog onSwitchPage={handleSwitchPage} />
        ) : activePage === 'estimate-snapshot' ? (
          <EstimateSnapshot onSwitchPage={handleSwitchPage} />
        ) : activePage === 'product-snapshot' ? (
          <ProductSnapshot onSwitchPage={handleSwitchPage} />
        ) : activePage === 'sales-log' ? (
          <SalesLog onSwitchPage={handleSwitchPage} />
        ) : activePage === 'generate-report' ? (
          <GenerateReport onSwitchPage={handleSwitchPage} />
        ) : activePage === 'custom-foldable-tags' ? (
          <CustomFoldableTags onSwitchPage={handleSwitchPage} />
        ) : activePage === 'import-data' ? (
          <ImportData onSwitchPage={handleSwitchPage} />
        ) : activePage === 'permissions' ? (
          <Permissions onSwitchPage={handleSwitchPage} onOpenModal={openModal} />
        ) : activePage === 'price-history' ? (
          <PriceHistory onSwitchPage={handleSwitchPage} />
        ) : activePage === 'karat-ratios' ? (
          <KaratRatios onSwitchPage={handleSwitchPage} />
        ) : (
          <main className="home-main">
            {activePage === 'login' && (
              <Login 
                onSwitchPage={handleSwitchPage} 
                onOpenModal={openModal} 
                onLoginSuccess={handleLoginSuccess}
                licenseStatus={licenseStatus}
                licenseDetails={licenseDetails}
                onLicenseActivated={checkLicense}
              />
            )}
            {activePage === 'signup' && (
              <Signup onSwitchPage={handleSwitchPage} onOpenModal={openModal} />
            )}
            {activePage === 'forgot' && (
              <ForgotPassword onSwitchPage={handleSwitchPage} onOpenModal={openModal} />
            )}
            {activePage === 'reset' && (
              <ResetPassword onSwitchPage={handleSwitchPage} onOpenModal={openModal} />
            )}
            {activePage === 'view-rates' && (
              <ViewRates onSwitchPage={handleSwitchPage} />
            )}
          </main>
        )}
      </div>

      <footer className="footer">
        <p>&copy; 2025 Jewellery Store Manager. All rights reserved.</p>
      </footer>

      <Modal isOpen={modalOpen} message={modalMessage} onClose={closeModal} />
    </div>
  );
}

export default App;
