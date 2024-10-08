const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const { MongoClient, GridFSBucket } = require('mongodb'); // Native GridFSBucket

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection URL
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/auction-db';

// MongoDB connection
const connection = mongoose.createConnection(mongoUrl);
let gfs, gridfsBucket;

connection.once('open', () => {
  // Initialize GridFSBucket
  gridfsBucket = new GridFSBucket(connection.db, {
    bucketName: 'uploads',
  });
  console.log('GridFS initialized successfully');
});

mongoose.connect(mongoUrl)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// GridFS storage engine using multer-gridfs-storage
const storage = new GridFsStorage({
  url: mongoUrl,
  file: (req, file) => {
    return {
      bucketName: 'uploads', // Bucket name for storing files
      filename: `${Date.now()}-${file.originalname}`, // Unique filename
    };
  },
});

const upload = multer({ storage });

// Auction schema
const auctionSchema = new mongoose.Schema({
  title: String,
  description: String,
  startingPrice: Number,
  photos: [String],
  creator: String,
  duration: Number, // Duration in hours
  endDate: Date, // Automatically calculate when auction ends
  createdAt: { type: Date, default: Date.now },
  blockchainAuctionId: Number,
  moneyClaimed: { type: Boolean, default: false },
});

const Auction = mongoose.model('Auction', auctionSchema);

// Get all auctions
app.get('/api/auctions', async (req, res) => {
  try {
    const auctions = await Auction.find();
    res.status(200).send(auctions);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching auctions' });
  }
});

// Route to get auctions created by a specific user
app.get('/api/auctions/creator/:creatorAddress', async (req, res) => {
  try {
    const auctions = await Auction.find({ creator: req.params.creatorAddress });
    res.status(200).send(auctions);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user auctions' });
  }
});

// Get active auctions
app.get('/api/auctions/active', async (req, res) => {
  try {
    const now = new Date();
    const auctions = await Auction.find({ endDate: { $gte: now } }); // Only fetch active auctions
    res.status(200).send(auctions);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching active auctions' });
  }
});

// Serve files (photos) stored in GridFS using GridFSBucket
app.get('/file/:filename', (req, res) => {
  gridfsBucket.find({ filename: req.params.filename }).toArray((err, files) => {
    if (!files || files.length === 0) {
      return res.status(404).json({ err: 'No file exists' });
    }

    // Pipe the image stream from GridFS to the response
    gridfsBucket.openDownloadStreamByName(req.params.filename).pipe(res);
  });
});

// Create new auction
app.post('/api/auctions', upload.array('photos', 5), async (req, res) => {
  try {
    const { title, description, startingPrice, creator, duration, blockchainAuctionId } = req.body;
    const photoFilenames = req.files.map((file) => file.filename);

    const endDate = new Date();
    endDate.setMinutes(endDate.getMinutes() + parseInt(duration));

    const auction = new Auction({
      title,
      description,
      startingPrice,
      photos: photoFilenames,
      creator,
      duration,
      endDate,
      blockchainAuctionId, // Store the blockchain auction ID
      moneyClaimed: false, // Default value for new auction
    });

    await auction.save();
    res.status(201).send(auction);
  } catch (error) {
    res.status(500).json({ error: 'Error creating auction' });
  }
});

// Update auction's fields (such as endDate or moneyClaimed or startingPrice)
app.put('/api/auctions/:auctionId', async (req, res) => {
  try {
    const auctionId = req.params.auctionId;
    const updatedFields = req.body;

    // Update auction with the provided fields
    const auction = await Auction.findByIdAndUpdate(auctionId, updatedFields, { new: true });
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    res.status(200).send(auction);
  } catch (error) {
    res.status(500).json({ error: 'Error updating auction' });
  }
});

// Route to delete an auction by ID
app.delete('/api/auctions/:auctionId', async (req, res) => {
  try {
    const auctionId = req.params.auctionId;
    // Find the auction by ID and delete it
    const auction = await Auction.findByIdAndDelete(auctionId);

    if (!auction) {
      return res.status(404).send({ error: 'Auction not found' });
    }

    // Delete associated files from GridFS
    auction.photos.forEach(async (filename) => {
      const file = await gridfsBucket.find({ filename }).toArray();
      if (file.length) {
        await gridfsBucket.delete(file[0]._id);
      }
    });

    res.status(200).send({ message: 'Auction deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting auction' });
  }
});
// Update auction's end date
app.put('/api/auctions/time/:auctionId', async (req, res) => {
  try {
    const auctionId = req.params.auctionId;
    const updatedFields = req.body;

    const auction = await Auction.findByIdAndUpdate(auctionId, updatedFields, { new: true });
    if (!auction) {
      return res.status(404).send({ error: 'Auction not found' });
    }

    res.status(200).send(auction);
  } catch (error) {
    res.status(500).send({ error: 'Error updating auction' });
  }
});
// Start the server
app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
