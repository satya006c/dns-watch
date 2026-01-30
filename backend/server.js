const express = require("express");
const cors = require("cors");
const { getAlerts } = require("./alerts");

const app = express();
const PORT = 5000;

/* ✅ Added CORS options (from your reference) */
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://ai-spm.vercel.app",
    ];

    // Allow requests with no origin (like direct browser access)
    if (!origin) return callback(null, true);

    // Allow exact origins or any *.vercel.app domain
    if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

/* ✅ Updated: use cors with options */
app.use(cors(corsOptions));
app.use(express.json());

app.get("/", (req, res) => {
  res.send({ status: "DNS-Catch backend running" });
});

// Dynamic alerts API
app.get("/api/alerts", (req, res) => {
  const alerts = getAlerts(15); // generate 15 alerts
  res.json(alerts);
});

app.listen(PORT, () => {
  console.log(`🚀 DNS-Catch backend running on http://localhost:${PORT}`);
});
