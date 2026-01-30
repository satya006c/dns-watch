const express = require("express");
const cors = require("cors");
const { getAlerts } = require("./alerts");

const app = express();
const PORT = 5000;

app.use(cors());
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
