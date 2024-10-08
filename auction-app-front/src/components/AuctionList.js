import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Card, Carousel } from 'react-bootstrap';
import Web3 from 'web3';

const AuctionList = ({ account, auctionManager }) => {
  const [auctions, setAuctions] = useState([]);
  const [web3, setWeb3] = useState(null); // State for web3 instance
  const [timeLeft, setTimeLeft] = useState({}); // Store the countdown timers for each auction

  useEffect(() => {
    const loadWeb3 = async () => {
      if (window.ethereum) {
        try {
          const web3Instance = new Web3(window.ethereum);
          await window.ethereum.request({ method: 'eth_requestAccounts' }); // Request MetaMask access
          setWeb3(web3Instance);
        } catch (error) {
          console.error('User denied account access');
        }
      } else if (window.web3) {
        setWeb3(new Web3(window.web3.currentProvider)); // MetaMask injected old version of Web3
      } else {
        console.error('Non-Ethereum browser detected. Please install MetaMask!');
      }
    };

    loadWeb3();
  }, []);

  useEffect(() => {
    const loadAuctions = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auctions');
        const now = new Date();

        const filteredAuctions = response.data.filter(
          (auction) => auction.creator !== account && new Date(auction.endDate) > now
        );

        const updatedAuctions = await Promise.all(
          filteredAuctions.map(async (auction) => {
            try {
              if (auction.blockchainAuctionId && auctionManager) {
                const auctionDetails = await auctionManager.methods
                  .getAuctionDetails(auction.blockchainAuctionId)
                  .call();
                auction.highestBidder = auctionDetails; // Update with blockchain highest bidder
              }
            } catch (error) {
              console.error(`Error fetching auction details for ${auction._id}:`, error);
            }
            return auction;
          })
        );

        setAuctions(updatedAuctions);

        // Initialize countdown timers
        const timers = {};
        updatedAuctions.forEach((auction) => {
          timers[auction._id] = calculateTimeLeft(auction.endDate);
        });
        setTimeLeft(timers);

        // Update the timers every second
        const intervalId = setInterval(() => {
          const updatedTimers = {};
          updatedAuctions.forEach((auction) => {
            updatedTimers[auction._id] = calculateTimeLeft(auction.endDate);
          });
          setTimeLeft(updatedTimers);
        }, 1000);

        return () => clearInterval(intervalId); // Cleanup interval on unmount
      } catch (error) {
        console.error('Error loading auctions:', error);
      }
    };

    loadAuctions();
  }, [account, auctionManager]);

  const calculateTimeLeft = (endDate) => {
    const now = new Date().getTime();
    const timeLeft = new Date(endDate).getTime() - now;

    if (timeLeft > 0) {
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else {
      return "Auction Ended";
    }
  };

  const placeBid = async (auctionId, blockchainAuctionId) => {
    const bidAmountInEther = prompt('Enter bid amount in ETH:', '1');
    const bidAmountInWei = web3.utils.toWei(bidAmountInEther, 'ether');
  
    try {
      if (!blockchainAuctionId) {
        alert('Blockchain auction ID is missing or invalid.');
        return;
      }
  
      // Fetch the current highest bid from the blockchain
      const currentHighestBidInWei = await auctionManager.methods
        .getHighestBid(blockchainAuctionId)
        .call();
  

      // Check if the new bid is higher than the current highest bid
      if (parseFloat(bidAmountInWei) <= parseFloat(currentHighestBidInWei)) {
        alert('Your bid must be higher than the current highest bid.');
        return;
      }
  
      // Place the bid on the blockchain
      await auctionManager.methods.bid(blockchainAuctionId).send({
        from: account,
        value: bidAmountInWei,
      });
  
      alert('Bid placed successfully on the blockchain!');
  
      // Update MongoDB with the new highest bid
      await axios.put(`http://localhost:5000/api/auctions/${auctionId}`, {
        startingPrice: bidAmountInEther,
      });
  
      alert('Auction starting price updated in the database!');
    } catch (error) {
      console.error('Error placing bid:', error);
      alert('Failed to place bid or update the database.');
    }
  };
  

  return (
    <div className="container-fluid" style={{ backgroundColor: '#343a40', minHeight: '100vh', padding: '0' }}>
      <div className="container py-5" style={{ minHeight: '100vh' }}>
        <h2 className="my-4" style={{ fontFamily: 'Poppins', fontWeight: 'bold', color: 'white' }}>Active Auctions</h2>
        <div className="row">
          {auctions.map((auction) => (
            <div key={auction._id} className="col-md-4 d-flex align-items-stretch">
              <Card style={{
                width: '100%',
                marginBottom: '20px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                borderRadius: '10px',
                transition: 'transform 0.3s ease-in-out',
                backgroundColor: '#f8f9fa'
              }}
                className="auction-card"
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {auction.photos && auction.photos.length > 0 && (
                  <Carousel indicators={false} controls={true} interval={2000}>
                    {auction.photos.map((photo, imgIndex) => (
                      <Carousel.Item key={imgIndex}>
                        <img
                          className="d-block w-100 carousel-image"
                          src={`http://localhost:5000/file/${photo}`}
                          alt={`Auction Image ${imgIndex + 1}`}
                          style={{
                            height: '200px',
                            objectFit: 'cover',
                            borderTopLeftRadius: '10px',
                            borderTopRightRadius: '10px'
                          }}
                        />
                      </Carousel.Item>
                    ))}
                  </Carousel>
                )}
                <Card.Body>
                  <Card.Title style={{ fontFamily: 'Roboto', fontWeight: '600' }}>{auction.title}</Card.Title>
                  <Card.Text style={{ fontSize: '0.9rem', color: '#555' }}>
                    <strong>Current Bid:</strong> {auction.startingPrice} ETH
                    <br />
                    <strong>Description:</strong> {auction.description}
                    <br />
                    <strong>Highest Bidder:</strong> {auction.highestBidder || 'No bids yet'}
                    <br />
                    <strong>Ends In:</strong> {timeLeft[auction._id] || "Calculating..."}
                  </Card.Text>
                  <Button
                    variant="primary"
                    style={{
                      backgroundColor: '#007bff',
                      borderColor: '#007bff',
                      borderRadius: '25px',
                      padding: '10px 20px',
                      fontFamily: 'Poppins',
                      fontSize: '0.9rem'
                    }}
                    onClick={() => placeBid(auction._id, auction.blockchainAuctionId)}
                  >
                    Place Bid
                  </Button>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>

  );
};

export default AuctionList;
