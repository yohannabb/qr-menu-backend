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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- MIDDLEWARE ---
app.use(cors({
  origin: [
    "http://localhost:5173", 
    "https://qr-menu-frontend-mauve.vercel.app"
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

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'habeshas_hotel_menu', 
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
  subcategory: { type: String, default: "General Section" }, 
  desc: { type: String },
  img: { type: String } 
}, { collection: 'MenuItem' });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// --- API ROUTES ---
app.get('/', (req, res) => {
    res.send('🚀 QR Menu Server is up and running smoothly!');
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
    const { name, price, category, subcategory, desc } = req.body; 
    const imgPath = req.file ? req.file.path : '';

    const newItem = new MenuItem({ 
      name, 
      price: Number(price), 
      category, 
      subcategory: subcategory || "General Section", 
      desc, 
      img: imgPath 
    });
    await newItem.save();
    res.status(201).json({ message: 'Item added successfully!', item: newItem });
  } catch (error) {
    res.status(400).json({ message: 'Error creating menu item', error });
  }
});

// 3. PUT: Update item
app.put('/api/menu/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, price, category, subcategory, desc, img } = req.body; 
    let imgPath = img; 

    if (req.file) {
      imgPath = req.file.path;
    }

    const updatedItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { name, price: Number(price), category, subcategory, desc, img: imgPath },
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