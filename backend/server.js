
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
require('./config/db');

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Updated CORS (no logic change, just explicit config)
app.use(cors({
  origin: "*"
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API Running');
});

// ── Routes ─────────────────────────────────────────────
const uploadRoutes = require("./routes/uploadRoutes");
app.use("/api/upload", uploadRoutes);

const searchRoutes = require("./routes/searchRoutes");
app.use('/api', searchRoutes);

const skillsRoutes = require("./routes/skillsRoutes");
app.use("/api/skills", skillsRoutes);

// ── Start Server ───────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});