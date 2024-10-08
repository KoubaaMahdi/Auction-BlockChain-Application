import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Button, Carousel } from 'react-bootstrap';
import { FaMoneyBillWave, FaTrash, FaGavel } from 'react-icons/fa';  // Import icons from FontAwesome

const Profile = ({ account, auctionManager }) => {
  const [activeAuctions, setActiveAuctions] = useState([]);
  const [inactiveAuctions, setInactiveAuctions] = useState([]);

  useEffect(() => {
    const loadAuctions = async () => {
      const response = await axios.get(`http://localhost:5000/api/auctions/creator/${account}`);
      const now = new Date();
      const active = response.data.filter(auction => new Date(auction.endDate) > now);
      const inactive = response.data.filter(auction => new Date(auction.endDate) <= now);
      setActiveAuctions(active);
      setInactiveAuctions(inactive);
    };

    if (account) {
      loadAuctions();
    }
  }, [account]);

  const claimMoney = async (auctionId, blockchainAuctionId) => {
    try {
      if (!blockchainAuctionId) {
        alert('Blockchain auction ID is missing or invalid.');
        return;
      }

      await auctionManager.methods.endAuction(blockchainAuctionId).send({
        from: account,
        gas: 500000, 
      });

      alert('Money claimed successfully!');

      await axios.put(`http://localhost:5000/api/auctions/${auctionId}`, {
        moneyClaimed: true, 
      });

      setInactiveAuctions(
        inactiveAuctions.map((auction) =>
          auction._id === auctionId ? { ...auction, moneyClaimed: true } : auction
        )
      );
    } catch (error) {
      console.error('Error claiming money:', error);
      alert('Failed to claim money!');
    }
  };

  const endAuction = async (auctionId, blockchainAuctionId) => {
    try {
      if (!blockchainAuctionId) {
        alert('Blockchain auction ID is missing or invalid.');
        return;
      }

      await auctionManager.methods.endAuction(blockchainAuctionId).send({
        from: account,
        gas: 500000, 
      });

      alert('Auction ended successfully on blockchain!');

      const now = new Date().toISOString(); 
      await axios.put(`http://localhost:5000/api/auctions/${auctionId}`, {
        endDate: now,
        moneyClaimed: true, 
      });

      const updatedActive = activeAuctions.filter(auction => auction._id !== auctionId);
      const endedAuction = activeAuctions.find(auction => auction._id === auctionId);

      setActiveAuctions(updatedActive);
      setInactiveAuctions([...inactiveAuctions, { ...endedAuction, endDate: now, moneyClaimed: true }]);

      alert('Auction ended successfully in the database!');
    } catch (error) {
      console.error('Error ending auction:', error);
      alert('Failed to end auction!');
    }
  };

  const deleteAuction = async (auctionId) => {
    try {
      await axios.delete(`http://localhost:5000/api/auctions/${auctionId}`);
      setActiveAuctions(activeAuctions.filter((auction) => auction._id !== auctionId));
      setInactiveAuctions(inactiveAuctions.filter((auction) => auction._id !== auctionId));
    } catch (error) {
      console.error('Error deleting auction:', error);
    }
  };

  return (
    <div className="container py-5">
      <h2 className="my-4" style={headingStyle}>Your Created Auctions</h2>

      <h3 style={subHeadingStyle}>Active Auctions</h3>
      {activeAuctions.length === 0 ? <p>No active auctions.</p> : (
        <div className="row">
          {activeAuctions.map((auction) => (
            <div key={auction._id} className="col-md-4">
              <Card style={cardStyle}>
                {auction.photos && auction.photos.length > 0 && (
                  <Carousel>
                    {auction.photos.map((photo, imgIndex) => (
                      <Carousel.Item key={imgIndex}>
                        <img
                          className="d-block w-100"
                          src={`http://localhost:5000/file/${photo}`}
                          alt={`Auction Image ${imgIndex + 1}`}
                        />
                      </Carousel.Item>
                    ))}
                  </Carousel>
                )}
                <Card.Body>
                  <Card.Title style={cardTitleStyle}>{auction.title}</Card.Title>
                  <Card.Text style={cardTextStyle}>Starting Price: {auction.startingPrice} ETH</Card.Text>
                  <Card.Text style={cardTextStyle}>Ends at: {new Date(auction.endDate).toLocaleString()}</Card.Text>
                  <Button 
                    style={endButtonStyle} 
                    variant="danger" 
                    onClick={() => endAuction(auction._id, auction.blockchainAuctionId)}
                  >
                    <FaGavel style={{ marginRight: '8px' }} /> End Auction
                  </Button>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}

      <h3 style={subHeadingStyle}>Inactive Auctions</h3>
      {inactiveAuctions.length === 0 ? <p>No inactive auctions.</p> : (
        <div className="row">
          {inactiveAuctions.map((auction) => (
            <div key={auction._id} className="col-md-4">
              <Card style={cardStyle}>
                {auction.photos && auction.photos.length > 0 && (
                  <Carousel>
                    {auction.photos.map((photo, imgIndex) => (
                      <Carousel.Item key={imgIndex}>
                        <img
                          className="d-block w-100"
                          src={`http://localhost:5000/file/${photo}`}
                          alt={`Auction Image ${imgIndex + 1}`}
                        />
                      </Carousel.Item>
                    ))}
                  </Carousel>
                )}
                <Card.Body>
                  <Card.Title style={cardTitleStyle}>{auction.title}</Card.Title>
                  <Card.Text style={cardTextStyle}>Starting Price: {auction.startingPrice} ETH</Card.Text>
                  <Card.Text style={cardTextStyle}>Auction Ended at: {new Date(auction.endDate).toLocaleString()}</Card.Text>
                  <Button 
                    variant="danger" 
                    style={deleteButtonStyle} 
                    onClick={() => deleteAuction(auction._id)}
                  >
                    <FaTrash style={{ marginRight: '8px' }} /> Delete
                  </Button>
                  <Button
                    style={claimButtonStyle}
                    onClick={() => claimMoney(auction._id, auction.blockchainAuctionId)}
                    disabled={auction.moneyClaimed}
                  >
                    <FaMoneyBillWave style={{ marginRight: '8px' }} />
                    {auction.moneyClaimed ? 'Money Claimed' : 'Claim Money'}
                  </Button>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Custom Styles
const headingStyle = {
  fontFamily: 'Poppins',
  fontWeight: '600',
  fontSize: '2rem',
  color: '#fff',  // Text color set to white for headings
  textAlign: 'center',
};

const subHeadingStyle = {
  fontFamily: 'Poppins',
  fontWeight: '500',
  fontSize: '1.5rem',
  marginBottom: '20px',
  color: '#fff',  // Text color set to white for subheadings
};

const cardStyle = {
  width: '100%',
  marginBottom: '20px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  borderRadius: '10px',
  overflow: 'hidden',
  transition: 'transform 0.3s ease-in-out',
};

const cardTitleStyle = {
  fontFamily: 'Poppins',
  fontWeight: '600',
  fontSize: '1.2rem',
  color: '#333',  // Keep the card title text dark
};

const cardTextStyle = {
  fontFamily: 'Roboto',
  fontSize: '1rem',
  color: '#555',  // Keep the card body text gray
};

const endButtonStyle = {
  backgroundColor: '#ff4d4d',
  borderColor: '#ff4d4d',
  borderRadius: '25px',
  padding: '10px 20px',
  fontFamily: 'Poppins',
  fontWeight: '500',
};

const deleteButtonStyle = {
  backgroundColor: '#dc3545',
  borderColor: '#dc3545',
  borderRadius: '25px',
  padding: '10px 20px',
  fontFamily: 'Poppins',
  fontWeight: '500',
  marginRight: '10px',
};

const claimButtonStyle = {
  backgroundColor: '#28a745',
  borderColor: '#28a745',
  borderRadius: '25px',
  padding: '10px 20px',
  fontFamily: 'Poppins',
  fontWeight: '500',
};

export default Profile;
