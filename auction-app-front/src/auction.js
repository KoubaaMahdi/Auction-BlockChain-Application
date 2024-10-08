import Web3 from 'web3';
import AuctionManager from './contracts/AuctionManager.json'; // Path to the compiled JSON ABI

let web3;
let auctionManager;

const loadBlockchainData = async () => {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    await window.ethereum.request({ method: 'eth_requestAccounts' }); // Request accounts via MetaMask

    const accounts = await web3.eth.getAccounts();
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = AuctionManager.networks[networkId];
    auctionManager = new web3.eth.Contract(
      AuctionManager.abi,
      deployedNetwork && deployedNetwork.address,
    );

    return { accounts, auctionManager };
  } else {
    alert('Please install MetaMask to use this application!');
    return { accounts: null, auctionManager: null };
  }
};

export { web3, loadBlockchainData };
