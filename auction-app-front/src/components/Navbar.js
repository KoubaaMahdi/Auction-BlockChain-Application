import React from 'react';
import { Navbar as BSNavbar, Nav } from 'react-bootstrap';
import { FaHome, FaGavel, FaUser } from 'react-icons/fa';

const Navbar = ({ account, changeView }) => {
  return (
    <BSNavbar bg="dark" variant="dark" expand="lg" style={{ padding: '10px 20px' }}>
      <BSNavbar.Brand href="#" style={{ fontFamily: 'Poppins', fontWeight: 'bold', fontSize: '1.5rem' }}>
        Auctions chez lahneks 
      </BSNavbar.Brand>
      <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
      <BSNavbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto" style={{ gap: '15px' }}>
          <Nav.Link onClick={() => changeView('home')}>
            <FaHome style={{ marginRight: '8px' }} /> Home
          </Nav.Link>
          <Nav.Link onClick={() => changeView('create')}>
            <FaGavel style={{ marginRight: '8px' }} /> Create Auction
          </Nav.Link>
          <Nav.Link onClick={() => changeView('profile')}>
            <FaUser style={{ marginRight: '8px' }} /> Profile
          </Nav.Link>
        </Nav>
        <span className="navbar-text" style={{ color: 'lightgray', fontFamily: 'Roboto', fontSize: '1rem' }}>
          Connected: {account}
        </span>
      </BSNavbar.Collapse>
    </BSNavbar>
  );
};

export default Navbar;
