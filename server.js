import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react'; 
import './App.css';

const CARD_COLORS = ['card-red', 'card-orange', 'card-green'];

// Real-World Cafeteria Menu Mapping Architecture
const MENU_STRUCTURE = {
  Food: ['All Food', 'Meat Section', 'Vegetarian / Fasting', 'Burgers & Snacks'],
  Drinks: ['All Drinks', 'Hot Drinks', 'Soft Drinks & Juices', 'Alcoholic Beverages'],
  Dessert: ['All Dessert', 'Cakes', 'Pastries']
};

function App() {
  const [menuItems, setMenuItems] = useState([]); 
  const [activeCategory, setActiveCategory] = useState('Food');
  const [activeSubcategory, setActiveSubcategory] = useState('All Food');
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState(null);

  // Admin Dashboard States
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingItem, setEditingItem] = useState(null); 
  const [form, setForm] = useState({ name: '', price: '', category: 'Food', subcategory: 'Meat Section', desc: '', img: '' });

  // Fetch items from database
  const fetchMenu = () => {
    setLoading(true);
    fetch('https://qr-menu-backend-qkfd.onrender.com/api/menu')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch data');
        return res.json();
      })
      .then((data) => {
        setMenuItems(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching data:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // Sync subcategory form state when main category changes
  const handleMainCategoryChange = (e) => {
    const mainCat = e.target.value;
    const defaultSub = MENU_STRUCTURE[mainCat][1]; 
    setForm(prev => ({ ...prev, category: mainCat, subcategory: defaultSub }));
  };

  // Switch tabs cleanly on navigation click
  const handleNavCategoryClick = (cat) => {
    setActiveCategory(cat);
    setActiveSubcategory(MENU_STRUCTURE[cat][0]); 
  };

  const handleAdminLogin = () => {
    if (isAdmin) {
      setIsAdmin(false); 
    } else {
      const pin = prompt("Enter Admin Password Pin:");
      if (pin === "1234") { 
        setIsAdmin(true);
      } else {
        alert("Incorrect Pin Code!");
      }
    }
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle Add or Update Submission
  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!form.name || !form.price) {
      alert("Please provide at least a Name and Price before saving.");
      return;
    }
    
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('price', form.price);
    formData.append('category', form.category);
    formData.append('subcategory', form.subcategory);
    formData.append('desc', form.desc);
    
    if (editingItem && !imageFile) {
      formData.append('img', form.img);
    }
    
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const url = editingItem 
      ? `https://qr-menu-backend-qkfd.onrender.com/api/menu/${editingItem._id}` 
      : 'https://qr-menu-backend-qkfd.onrender.com/api/menu';
    
    const method = editingItem ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      body: formData
    })
    .then(res => {
      if (!res.ok) {
        return res.json().then(errData => {
          throw new Error(errData.message || "The server rejected the save operation.");
        });
      }
      return res.json();
    })
    .then(() => {
      alert(editingItem ? "Item Updated!" : "Item Added Successfully!");
      setForm({ name: '', price: '', category: 'Food', subcategory: 'Meat Section', desc: '', img: '' });
      setImageFile(null); 
      setEditingItem(null);
      fetchMenu();
    })
    .catch(err => {
      alert(`❌ Failed to save: ${err.message}`);
      console.error("Error saving item:", err);
    });
  };

  const startEdit = (item, e) => {
    e.stopPropagation(); 
    setEditingItem(item);
    setForm({
      name: item.name,
      price: item.price,
      category: item.category || 'Food',
      subcategory: item.subcategory || 'Meat Section',
      desc: item.desc || '',
      img: item.img || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you completely sure you want to delete this menu item?")) {
      fetch(`https://qr-menu-backend-qkfd.onrender.com/api/menu/${id}`, { method: 'DELETE' })
        .then(res => {
          if (!res.ok) throw new Error('Server rejected deletion');
          return res.json();
        })
        .then(() => {
          alert("Item Deleted!");
          fetchMenu();
        })
        .catch(err => console.error("Error deleting:", err));
    }
  };

  // Case-Insensitive Filter matching logic
  const filteredMenu = menuItems.filter(item => {
    const itemCat = item.category ? item.category.trim().toLowerCase() : '';
    const activeCat = activeCategory.trim().toLowerCase();
    
    const matchesMain = itemCat === activeCat || (activeCat === 'dessert' && itemCat.includes('dessert'));
    if (!matchesMain) return false;
    
    if (activeSubcategory.toLowerCase().startsWith('all')) return true; 
    
    const savedSub = item.subcategory ? item.subcategory.trim().toLowerCase() : '';
    const targetSub = activeSubcategory.trim().toLowerCase();
    
    return savedSub === targetSub;
  });

  return (
    <div className="mobile-layout">
      {/* Header Layout */}
      <header className="menu-header">
        <div className="brand-badge">
          <h1 className="restaurant-name">CAFE & PASTRY HUB</h1>
        </div>
        <p className="restaurant-tagline">Fresh Cooking • Scan • Enjoy</p>
      </header>

      {/* ADMIN CONTROL PANEL DASHBOARD VIEW */}
      {isAdmin && (
        <div style={{ backgroundColor: '#1b120c', padding: '16px', borderBottom: '3px solid #f39c12', fontFamily: 'sans-serif' }}>
          <h3 style={{ color: '#f39c12', margin: '0 0 12px 0', textTransform: 'uppercase' }}>
            {editingItem ? "⚡ Editing Mode" : "📝 Add New Cafeteria Item"}
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input type="text" name="name" placeholder="Item Name (e.g., Special Macchiato)" value={form.name} onChange={handleInputChange} style={{ padding: '8px', borderRadius: '4px', border: 'none' }} />
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="number" step="0.01" name="price" placeholder="Price (ETB)" value={form.price} onChange={handleInputChange} style={{ padding: '8px', borderRadius: '4px', border: 'none', flex: 1 }} />
              
              <select name="category" value={form.category} onChange={handleMainCategoryChange} style={{ padding: '8px', borderRadius: '4px', border: 'none', flex: 1 }}>
                <option value="Food">Food</option>
                <option value="Drinks">Drinks</option>
                <option value="Dessert">Dessert & Pastry</option>
              </select>
            </div>

            {/* Dynamic Real-World Subcategory Form Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ color: '#f39c12', fontSize: '0.8rem', fontWeight: 'bold' }}>Specific Menu Section:</label>
              <select name="subcategory" value={form.subcategory} onChange={handleInputChange} style={{ padding: '8px', borderRadius: '4px', border: 'none', width: '100%' }}>
                {MENU_STRUCTURE[form.category].slice(1).map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
            
            <label style={{ color: '#f39c12', fontSize: '0.85rem', fontWeight: 'bold' }}>Upload Item Image File:</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setImageFile(e.target.files[0])} 
              style={{ padding: '6px', color: '#fff', background: '#33231a', borderRadius: '4px' }} 
            />
            
            <textarea name="desc" placeholder="Ingredients description details..." value={form.desc} onChange={handleInputChange} rows="2" style={{ padding: '8px', borderRadius: '4px', border: 'none', fontFamily: 'sans-serif' }}></textarea>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={handleSubmit} style={{ backgroundColor: '#f39c12', color: '#000', border: 'none', padding: '10px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', flex: 2 }}>
                {editingItem ? "Update Item" : "Save to Cafeteria System"}
              </button>
              {editingItem && (
                <button type="button" onClick={() => { setEditingItem(null); setForm({ name: '', price: '', category: 'Food', subcategory: 'Meat Section', desc: '', img: '' }); }} style={{ backgroundColor: '#777', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', flex: 1 }}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Category Filter Level */}
      <nav className="category-bar">
        {['Food', 'Drinks', 'Dessert'].map((cat) => (
          <button 
            key={cat} 
            className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => handleNavCategoryClick(cat)}
          >
            {cat === 'Dessert' ? 'Dessert & Pastry' : cat}
          </button>
        ))}
      </nav>

      {/* Subcategory Visual Scannable Tag Navigation Track */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '8px 16px', background: '#261a10' }}>
        {MENU_STRUCTURE[activeCategory].map((sub) => (
          <button
            key={sub}
            onClick={() => setActiveSubcategory(sub)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '0.8rem',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              backgroundColor: activeSubcategory === sub ? '#f39c12' : '#3d2b1d',
              color: activeSubcategory === sub ? '#000' : '#ccc',
              fontWeight: 'bold',
              transition: 'all 0.2s ease'
            }}
          >
            {sub}
          </button>
        ))}
      </div>

      <div className="menu-section-header">
        <h2>{activeSubcategory.toUpperCase()}</h2>
      </div>

      {/* Menu Cards Display */}
      <main className="menu-list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'sans-serif' }}>Loading menu database records...</div>
        ) : filteredMenu.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'sans-serif', opacity: 0.7 }}>No items found in this section.</div>
        ) : (
          filteredMenu.map((item, index) => {
            const assignedColor = CARD_COLORS[index % CARD_COLORS.length];

            return (
              <div 
                key={item._id} 
                className={`menu-card ${assignedColor}`}
                onClick={() => setSelectedItem(item)} 
              >
                {isAdmin && (
                  <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px', zIndex: 5 }}>
                    <button onClick={(e) => startEdit(item, e)} style={{ backgroundColor: '#2196F3', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>EDIT</button>
                    <button onClick={(e) => handleDelete(item._id, e)} style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>DELETE</button>
                  </div>
                )}

                <div className="item-details">
                  <h3 className="item-name" style={{ marginTop: isAdmin ? '24px' : '0' }}>{item.name}</h3>
                  <span style={{ fontSize: '0.7rem', color: '#f39c12', background: '#1b120c', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '6px' }}>
                    {item.subcategory || "General Section"}
                  </span>
                  <p className="item-desc">{item.desc}</p>
                  
                  <div className="price-badge-circle">
                    <span className="badge-size-label">PRICE</span>
                    <span className="item-price">{item.price ? item.price.toFixed(2) : '0.00'}</span>
                  </div>
                </div>

                <div className="item-image-wrapper">
                  <img src={item.img} alt={item.name} className="item-image" />
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* DETAILS POPUP MODAL */}
      {selectedItem && (
        <div className="modal-backdrop" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedItem(null)}>×</button>
            <img src={selectedItem.img} alt={selectedItem.name} className="modal-image" />
            <div className="modal-body">
              <div className="modal-header-row">
                <h3 className="modal-item-name">{selectedItem.name}</h3>
                <span className="modal-item-price">{selectedItem.price ? selectedItem.price.toFixed(2) : '0.00'} <small style={{fontSize:'0.6rem'}}>ETB</small></span>
              </div>
              <span className="modal-category-tag">{selectedItem.category} • {selectedItem.subcategory || "General"}</span>
              <p className="modal-item-desc">{selectedItem.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer System */}
      <footer className="menu-footer">
        <p className="footer-line-1">ALL MEALS ARE PREPARED FRESH TO ORDER.</p>
        <p className="footer-line-2">THANK YOU FOR YOUR PATRONAGE!</p>
        <button 
          onClick={handleAdminLogin} 
          style={{ background: 'none', border: 'none', color: '#f39c12', opacity: 0.3, fontSize: '0.7rem', marginTop: '12px', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {isAdmin ? "[Logout Admin Panel]" : "[Admin Management Portal]"}
        </button>
      </footer>
    </div>
  );
}

export default App;