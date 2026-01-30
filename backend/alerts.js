const domains = [
  "google.com", "facebook.com", "malicious-domain.xyz", 
  "login-secure-update.net", "example.com"
];

const severityLevels = ["Low", "Medium", "High", "Critical"];
const alertTypes = ["Query", "Phishing", "Malware", "Suspicious"];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateAlert() {
  const now = new Date().toLocaleString();
  const severity = randomItem(severityLevels);

  return {
    timestamp: now,
    src_ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
    domain: randomItem(domains),
    severity: severity,
    alerts: [
      {
        type: randomItem(alertTypes),
        description: `Detected ${severity.toLowerCase()} level issue`
      }
    ]
  };
}

function getAlerts(count = 10) {
  const alerts = [];
  for (let i = 0; i < count; i++) {
    alerts.push(generateAlert());
  }
  return alerts;
}

module.exports = { getAlerts };
