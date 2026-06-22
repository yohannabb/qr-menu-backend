import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Resolve __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- MIDDLEWARE ---
// --- MIDDLEWARE ---
app.use(cors({
  origin: [
    "http://localhost:5173", 
    "https://qr-menu-frontend-mauve.vercel.app" // Your exact live link!
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// --- CLOUDINARY CONFIGISTRATION ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure storage engine to point directly to Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'habeshas_hotel_menu', // Creates a clean folder name inside your Cloudinary account
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

const upload = multer({ storage: storage });

// --- MONGODB CONNECTION ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/qrmenu';
mongoose.connect(MONGO_URI)
  .then(() => console.log('🚀 Connected smoothly to Cloud MongoDB Atlas!'))
  .catch((err) => console.error('❌ Database connection error:', err));

// --- DATABASE SCHEMA & MODEL ---
const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  desc: { type: String },
  img: { type: String } // Will now store direct global secure https cloud URLs
}, { collection: 'MenuItem' });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// --- API ROUTES ---

app.get('/', (req, res) => {
    res.send('🚀 QR Menu Server is up and running securely with Cloudinary storage!');
});

// 1. GET: Fetch all menu items
app.get('/api/menu', async (req, res) => {
  try {
    const menu = await MenuItem.find();
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching menu items', error });
  }
});

// 2. POST: Create item WITH cloud file upload
app.post('/api/menu', upload.single('image'), async (req, res) => {
  try {
    const { name, price, category, desc } = req.body;
    
    // Automatically uses Cloudinary secure asset URL endpoint
    const imgPath = req.file ? req.file.path : '';

    const newItem = new MenuItem({ name, price: Number(price), category, desc, img: imgPath });
    await newItem.save();
    res.status(201).json({ message: 'Item added successfully!', item: newItem });
  } catch (error) {
    res.status(400).json({ message: 'Error creating menu item', error });
  }
});

// 3. PUT: Update item WITH optional new cloud file upload
app.put('/api/menu/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, price, category, desc, img } = req.body;
    let imgPath = img; // Keep the old image link by default

    // If a new file is uploaded, replace it with the new Cloudinary link path
    if (req.file) {
      imgPath = req.file.path;
    }

    const updatedItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { name, price: Number(price), category, desc, img: imgPath },
      { new: true }
    );
    res.json({ message: 'Item updated successfully!', item: updatedItem });
  } catch (error) {
    res.status(400).json({ message: 'Error updating menu item', error });
  }
});

// 4. DELETE: Remove item
app.delete('/api/menu/:id', async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting menu item', error });
  }
});

app.listen(PORT, () => {
  console.log(`⚡ Server is actively spinning on port ${PORT}`);
});