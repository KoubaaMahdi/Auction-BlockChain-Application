import React, { useState, useEffect } from 'react';
import { loadBlockchainData } from './auction';
import AuctionList from './components/AuctionList';
import CreateAuction from './components/CreateAuction';
import Navbar from './components/Navbar';
import Profile from './components/Profile';
import { FaWallet } from 'react-icons/fa';

function App() {
  const [account, setAccount] = useState('');
  const [auctionManager, setAuctionManager] = useState(null);
  const [view, setView] = useState('home'); // Manage views (home, create, profile)
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false);

  useEffect(() => {
    const checkMetaMaskConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsMetaMaskConnected(true);
          await initBlockchain(); // Load blockchain data if MetaMask is already connected
        }
      }
    };

    checkMetaMaskConnection();
  }, []);

  const initBlockchain = async () => {
    const { accounts, auctionManager } = await loadBlockchainData();
    setAccount(accounts[0]);
    setAuctionManager(auctionManager);
  };

  const connectToMetaMask = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setIsMetaMaskConnected(true);
        await initBlockchain();
      } catch (error) {
        console.error('Error connecting to MetaMask', error);
      }
    } else {
      alert('MetaMask is not installed. Please install MetaMask to continue.');
    }
  };

  const handleViewChange = (view) => setView(view);

  const backgroundStyle = {
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', // Gradient background for when MetaMask is not connected
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden',
  };

  const shapeStyle = {
    position: 'absolute',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1,
    animation: 'float 6s ease-in-out infinite',
  };

  const shape1 = { ...shapeStyle, width: '200px', height: '200px', top: '10%', left: '20%' };
  const shape2 = { ...shapeStyle, width: '300px', height: '300px', top: '60%', left: '70%' };
  const shape3 = { ...shapeStyle, width: '150px', height: '150px', top: '40%', left: '10%' };

  if (!isMetaMaskConnected) {
    return (
      <div className="container-fluid" style={backgroundStyle}>
        <div style={shape1}></div>
        <div style={shape2}></div>
        <div style={shape3}></div>

        <div className="container d-flex flex-column justify-content-center align-items-center" style={{ height: '100vh' }}>
          <h2
            style={{
              fontFamily: 'Poppins',
              fontWeight: '600',
              fontSize: '1.8rem',
              marginBottom: '20px',
              color: 'white',
            }}
          >
            Please Connect to MetaMask
          </h2>
          <button
            onClick={connectToMetaMask}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 24px',
              fontSize: '1rem',
              fontFamily: 'Poppins',
              fontWeight: '500',
              borderRadius: '30px',
              transition: 'background-color 0.3s ease',
            }}
          >
            <FaWallet style={{ marginRight: '10px' }} />
            Login with MetaMask
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar account={account} changeView={handleViewChange} />
      <div className="container-fluid" style={{ backgroundColor: '#343a40', minHeight: '100vh', padding: '0' }}>
        <div className="container py-5" style={{ minHeight: '100vh' }}>
          {view === 'home' && <AuctionList account={account} auctionManager={auctionManager} />}
          {view === 'create' && <CreateAuction account={account} auctionManager={auctionManager} />}
          {view === 'profile' && <Profile account={account} auctionManager={auctionManager} />}
        </div>
      </div>
    </div>
  );
}

export default App;
