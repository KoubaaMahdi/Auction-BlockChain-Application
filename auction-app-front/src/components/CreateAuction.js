import React, { useState } from 'react';
import axios from 'axios';
import Web3 from 'web3';

const CreateAuction = ({ account, auctionManager }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [photos, setPhotos] = useState([]);
  const [duration, setDuration] = useState(''); // Duration in minutes
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Handle image change (multiple images)
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setPhotos([...photos, ...files]); // Append new images to the current photos state
  };

  // Open image in popup modal
  const openImage = (image) => {
    setSelectedImage(URL.createObjectURL(image));
  };

  // Close modal when clicking outside the image
  const handleCloseModal = (e) => {
    if (e.target.className === 'image-overlay') {
      setSelectedImage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      // Step 1: Create auction on the blockchain
      const durationInSeconds = parseInt(duration) * 60; // Convert minutes to seconds
      const tx = await auctionManager.methods.createAuction(durationInSeconds).send({
        from: account
      });
  
      // Retrieve the auctionId from the event emitted by the contract
      const auctionId = tx.events.AuctionCreated.returnValues.auctionId;
  
      // Step 2: Save auction to backend (with blockchain auctionId)
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('startingPrice', startingPrice);
      formData.append('creator', account);
      formData.append('duration', duration);
      alert(auctionId)
      formData.append('blockchainAuctionId', auctionId); // Save blockchain auction ID
  
      for (let i = 0; i < photos.length; i++) {
        formData.append('photos', photos[i]);
      }
  
      await axios.post('http://localhost:5000/api/auctions', formData);
      alert('Auction created successfully!');
      setShowSuccessAlert(true);
  
      // Reset form
      setTitle('');
      setDescription('');
      setStartingPrice('');
      setDuration('');
      setPhotos([]);
    } catch (error) {
      console.error('Error creating auction:', error);
    }
  };

  return (
    <div className="container py-5" style={formContainerStyle}>
      <h2 className="mb-4" style={formHeadingStyle}>Create New Auction</h2>
      <form onSubmit={handleSubmit} style={formStyle}>
        <div className="form-group">
          <label style={labelStyle}>Title</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <div className="form-group">
          <label style={labelStyle}>Description</label>
          <textarea
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            style={textareaStyle}
          ></textarea>
        </div>
        <div className="form-group">
          <label style={labelStyle}>Starting Price</label>
          <input
            type="number"
            className="form-control"
            value={startingPrice}
            onChange={(e) => setStartingPrice(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <div className="form-group">
          <label style={labelStyle}>Duration (minutes)</label>
          <input
            type="number"
            className="form-control"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <div className="form-group">
          <label style={labelStyle}>Product Images (multiple)</label>
          <input
            type="file"
            className="form-control-file"
            multiple
            onChange={handleImageChange}
            required
            style={inputStyle}
          />
        </div>

        <div className="image-preview-container" style={{ marginTop: '20px' }}>
          {photos.length > 0 &&
            photos.map((image, index) => (
              <img
                key={index}
                src={URL.createObjectURL(image)}
                alt={`preview-${index}`}
                style={imagePreviewStyle}
                onClick={() => openImage(image)}
              />
            ))}
        </div>

        {selectedImage && (
          <div className="image-overlay" onClick={handleCloseModal} style={overlayStyle}>
            <div style={modalStyle}>
              <img src={selectedImage} alt="Selected Preview" style={{ maxWidth: '100%', maxHeight: '80vh' }} />
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-primary" style={buttonStyle}>Create Auction</button>

        {showSuccessAlert && <div className="alert alert-success mt-3">Auction created successfully!</div>}
      </form>
    </div>
  );
};

// Styling for the form
const formContainerStyle = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#fff',
  padding: '20px',
  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
  borderRadius: '10px',
};

const formHeadingStyle = {
  fontFamily: 'Poppins',
  fontWeight: '600',
  fontSize: '1.8rem',
  textAlign: 'center',
  color: '#333',
};

const formStyle = {
  fontFamily: 'Poppins',
  color: '#555',
};

const labelStyle = {
  fontWeight: '600',
  fontSize: '1rem',
  color: '#333',
};

const inputStyle = {
  borderRadius: '8px',
  padding: '10px',
  fontSize: '1rem',
  marginBottom: '10px',
};

const textareaStyle = {
  borderRadius: '8px',
  padding: '10px',
  fontSize: '1rem',
  height: '150px',
  marginBottom: '10px',
};

const imagePreviewStyle = {
  width: '100px',
  height: '100px',
  objectFit: 'cover',
  borderRadius: '10px',
  marginRight: '10px',
  cursor: 'pointer',
  boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.2)',
};

const buttonStyle = {
  width: '100%',
  padding: '12px',
  fontSize: '1.1rem',
  backgroundColor: '#007bff',
  borderColor: '#007bff',
  borderRadius: '30px',
  fontFamily: 'Poppins',
  fontWeight: '600',
  transition: 'background-color 0.3s ease',
};

// Modal and overlay styling
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalStyle = {
  position: 'relative',
  padding: '20px',
  backgroundColor: '#fff',
  borderRadius: '8px',
};

export default CreateAuction;