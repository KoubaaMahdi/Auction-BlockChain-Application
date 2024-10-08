// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AuctionManager {
    struct Auction {
        address payable owner;
        uint auctionEndTime;
        address payable highestBidder;
        uint highestBid;
        bool ended;
    }

    uint public auctionCount;
    mapping(uint => Auction) public auctions;

    event AuctionCreated(uint auctionId, address owner, uint endTime);
    event HighestBidIncreased(uint auctionId, address bidder, uint amount);
    event AuctionEnded(uint auctionId, address winner, uint amount);
    event TransferSuccessful(address recipient, uint amount);
    event TransferFailed(address recipient, uint amount);

    function createAuction(uint _biddingTime) public {
        auctionCount++;
        Auction storage newAuction = auctions[auctionCount];
        newAuction.owner = payable(msg.sender);
        newAuction.auctionEndTime = block.timestamp + _biddingTime;
        emit AuctionCreated(
            auctionCount,
            msg.sender,
            newAuction.auctionEndTime
        );
    }

    function bid(uint auctionId) public payable {
        Auction storage auction = auctions[auctionId];

        require(
            block.timestamp <= auction.auctionEndTime,
            "Auction already ended."
        );
        require(
            msg.value > auction.highestBid,
            "There already is a higher bid."
        );

        // Automatically refund the previous highest bidder, if there is one
        if (auction.highestBid != 0) {
            address payable previousBidder = auction.highestBidder;
            uint previousBid = auction.highestBid;

            // Use `call` to refund the previous bidder to handle errors more gracefully
            (bool success, ) = previousBidder.call{value: previousBid}("");
            require(success, "Refund to previous bidder failed.");
        }

        auction.highestBidder = payable(msg.sender);
        auction.highestBid = msg.value;

        emit HighestBidIncreased(auctionId, msg.sender, msg.value);
    }

    function endAuction(uint auctionId) public {
        Auction storage auction = auctions[auctionId];
        require(msg.sender == auction.owner, "You are not the auction owner.");
        require(!auction.ended, "Auction end already called.");
        auction.ended = true;
        emit AuctionEnded(auctionId, auction.highestBidder, auction.highestBid);

        (bool success, ) = auction.owner.call{value: auction.highestBid}("");
        require(success, "Transfer to auction owner failed."); // Check if the transfer succeeded
    }

    // Add a method to get auction details
    function getAuctionDetails(
        uint auctionId
    ) public view returns (address highestBidder) {
        Auction storage auction = auctions[auctionId];
        return (auction.highestBidder);
    }
    function getHighestBid(uint auctionId) public view returns (uint) {
    Auction storage auction = auctions[auctionId];
    return auction.highestBid;
}

}
