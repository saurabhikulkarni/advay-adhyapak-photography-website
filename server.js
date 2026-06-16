const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Admin Authentication Password (for demonstration)
const ADMIN_PASSWORD = 'AdvayAdmin2026';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data folder and storage files exist
const DATA_DIR = path.join(__dirname, 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(BOOKINGS_FILE)) {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([], null, 2), 'utf8');
}

if (!fs.existsSync(CONTACTS_FILE)) {
  fs.writeFileSync(CONTACTS_FILE, JSON.stringify([], null, 2), 'utf8');
}

// Helper functions to read/write JSON files
const readJSON = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return [];
  }
};

const writeJSON = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
};

// --- API Endpoints ---

// 1. Submit Booking Request
app.post('/api/bookings', (req, res) => {
  const { name, email, phone, date, category, details } = req.body;

  if (!name || !email || !phone || !date || !category) {
    return res.status(400).json({ success: false, message: 'Required fields are missing.' });
  }

  const bookings = readJSON(BOOKINGS_FILE);
  const newBooking = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    name,
    email,
    phone,
    date,
    category,
    details: details || '',
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  bookings.push(newBooking);
  if (writeJSON(BOOKINGS_FILE, bookings)) {
    return res.status(201).json({ success: true, message: 'Booking request submitted successfully!', booking: newBooking });
  } else {
    return res.status(500).json({ success: false, message: 'Failed to record booking request.' });
  }
});

// 2. Submit Contact Inquiry
app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
  }

  const contacts = readJSON(CONTACTS_FILE);
  const newContact = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    name,
    email,
    subject: subject || 'General Inquiry',
    message,
    createdAt: new Date().toISOString()
  };

  contacts.push(newContact);
  if (writeJSON(CONTACTS_FILE, contacts)) {
    return res.status(201).json({ success: true, message: 'Message sent successfully!' });
  } else {
    return res.status(500).json({ success: false, message: 'Failed to save contact message.' });
  }
});

// --- Admin Endpoints (Password Protected) ---

// Authentication middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader === `Bearer ${ADMIN_PASSWORD}`) {
    next();
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized. Invalid admin password.' });
  }
};

// Admin Login Check
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: ADMIN_PASSWORD });
  } else {
    res.status(401).json({ success: false, message: 'Incorrect password.' });
  }
});

// Get Bookings
app.get('/api/admin/bookings', authenticateAdmin, (req, res) => {
  const bookings = readJSON(BOOKINGS_FILE);
  res.json({ success: true, bookings });
});

// Update Booking Status (e.g. Approve, Completed, Cancelled)
app.patch('/api/admin/bookings/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required.' });
  }

  const bookings = readJSON(BOOKINGS_FILE);
  const index = bookings.findIndex(b => b.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Booking not found.' });
  }

  bookings[index].status = status;
  if (writeJSON(BOOKINGS_FILE, bookings)) {
    res.json({ success: true, message: `Booking status updated to ${status}.`, booking: bookings[index] });
  } else {
    res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
});

// Delete Booking
app.delete('/api/admin/bookings/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const bookings = readJSON(BOOKINGS_FILE);
  const filteredBookings = bookings.filter(b => b.id !== id);

  if (bookings.length === filteredBookings.length) {
    return res.status(404).json({ success: false, message: 'Booking not found.' });
  }

  if (writeJSON(BOOKINGS_FILE, filteredBookings)) {
    res.json({ success: true, message: 'Booking deleted successfully.' });
  } else {
    res.status(500).json({ success: false, message: 'Failed to delete booking.' });
  }
});

// Get Contacts (Inquiries)
app.get('/api/admin/contacts', authenticateAdmin, (req, res) => {
  const contacts = readJSON(CONTACTS_FILE);
  res.json({ success: true, contacts });
});

// Delete Contact Message
app.delete('/api/admin/contacts/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const contacts = readJSON(CONTACTS_FILE);
  const filteredContacts = contacts.filter(c => c.id !== id);

  if (contacts.length === filteredContacts.length) {
    return res.status(404).json({ success: false, message: 'Message not found.' });
  }

  if (writeJSON(CONTACTS_FILE, filteredContacts)) {
    res.json({ success: true, message: 'Message deleted successfully.' });
  } else {
    res.status(500).json({ success: false, message: 'Failed to delete message.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Advay Adhyapak Photography Server running on http://localhost:${PORT}`);
});
