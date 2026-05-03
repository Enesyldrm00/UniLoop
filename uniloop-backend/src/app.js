require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const errorHandler = require('./middleware/errorHandler');

// Route modülleri
const authRoutes    = require('./modules/auth/auth.routes');
const walletRoutes  = require('./modules/wallet/wallet.routes');
const profileRoutes = require('./modules/profile/profile.routes');
const contactRoutes = require('./modules/contact/contact.routes');
const taskRoutes    = require('./modules/task/task.routes');
const escrowRoutes  = require('./modules/escrow/escrow.routes');
const poolRoutes    = require('./modules/pool/pool.routes');
const messageRoutes = require('./modules/message/message.routes');
const eventRoutes   = require('./modules/event/event.routes');

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statik dosya sunucusu (uploads klasörü için)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Sağlık Kontrolü ────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'OK', app: 'UniLoop', timestamp: new Date() });
});

// ── API Rotaları ────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/wallet',   walletRoutes);
app.use('/api/profile',  profileRoutes);
app.use('/api/contact',  contactRoutes);
app.use('/api/tasks',    taskRoutes);
app.use('/api/escrow',   escrowRoutes);
app.use('/api/pools',    poolRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/events',   eventRoutes);

// ── 404 Yakalayıcı ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint bulunamadı.' });
});

// ── Global Hata Yakalayıcı ──────────────────────────────────
app.use(errorHandler);

module.exports = app;
