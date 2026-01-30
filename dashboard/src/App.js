import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

function App() {
  const [alerts, setAlerts] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState(null);

  const alertsEndRef = useRef(null);

  const severityMap = { Low: 1, Medium: 2, High: 3, Critical: 4 };
  const severityColors = { Low: "#4caf50", Medium: "#ffeb3b", High: "#ff9800", Critical: "#f44336" };
  const getSeverityColor = (severity) => severityColors[severity] || "#fff";

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/alerts");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (!data.alerts) data.alerts = [];
      if (!data.src_ip) data.src_ip = "N/A";
      if (!data.domain) data.domain = "N/A";
      if (!data.severity) data.severity = "Low";

      setAlerts(prev => [data, ...prev].slice(0, 100));
    };

    ws.onopen = () => console.log("WebSocket connected");
    ws.onclose = () => console.log("WebSocket disconnected");

    return () => ws.close();
  }, []);

  // Auto-scroll to newest alert
  useEffect(() => {
    if (alertsEndRef.current) {
      alertsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [alerts]);

  // Filtered & searched alerts
  const displayedAlerts = alerts.filter(alert => {
    const severityMatch = filterSeverity === "All" || alert.severity === filterSeverity;
    const searchMatch = alert.src_ip.includes(searchTerm) || alert.domain.includes(searchTerm);
    return severityMatch && searchMatch;
  });

  // Dashboard stats
  const totalAlerts = alerts.length;
  const severityCounts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
  alerts.forEach(a => {
    if (severityCounts[a.severity] !== undefined) severityCounts[a.severity]++;
  });

  // Chart data
  const chartData = alerts
    .map(alert => ({
      timestamp: alert.timestamp,
      severityValue: severityMap[alert.severity] || 0,
      severity: alert.severity
    }))
    .reverse();

  const pieData = Object.keys(severityCounts).map(key => ({
    name: key,
    value: severityCounts[key]
  }));

  return (
    <div style={{
      padding: "2rem",
      backgroundColor: darkMode ? "#111" : "#f4f4f4",
      color: darkMode ? "#fff" : "#111",
      minHeight: "100vh",
      fontFamily: "Arial, sans-serif"
    }}>
      <header style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.5rem", color: "#00bcd4" }}>DNS SOC Dashboard</h1>
        <p style={{ fontSize: "1rem", color: darkMode ? "#aaa" : "#555" }}>Real-time DNS security alerts and trends</p>
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            backgroundColor: "#00bcd4",
            color: "#fff",
            fontWeight: "bold"
          }}
        >
          Toggle {darkMode ? "Light" : "Dark"} Mode
        </button>
      </header>

      {/* Dashboard Stats */}
      <section style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "150px", padding: "1rem", backgroundColor: darkMode ? "#222" : "#ddd", borderRadius: "8px", textAlign: "center" }}>
          <h3>Total Alerts</h3>
          <p style={{ fontSize: "1.5rem", color: "#00bcd4", fontWeight: "bold" }}>{totalAlerts}</p>
        </div>
        {Object.keys(severityCounts).map(sev => (
          <div key={sev} style={{ flex: 1, minWidth: "150px", padding: "1rem", backgroundColor: darkMode ? "#222" : "#ddd", borderRadius: "8px", textAlign: "center" }}>
            <h3>{sev} Alerts</h3>
            <p style={{ fontSize: "1.5rem", color: getSeverityColor(sev), fontWeight: "bold" }}>{severityCounts[sev]}</p>
          </div>
        ))}
      </section>

      {/* Filters */}
      <section style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div>
          <label>Filter Severity:</label>
          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
            style={{ marginLeft: "0.5rem", padding: "0.3rem 0.5rem", borderRadius: "4px", border: "none" }}>
            <option>All</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
        </div>
        <div>
          <label>Search IP/Domain:</label>
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Enter IP or Domain"
            style={{ marginLeft: "0.5rem", padding: "0.3rem 0.5rem", borderRadius: "4px", border: "none" }}
          />
        </div>
      </section>

      {/* Alerts List */}
      <section>
        <h2 style={{ color: "#00bcd4" }}>Live Alerts</h2>
        <div style={{
          maxHeight: "400px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          padding: "0.5rem",
          border: `1px solid ${darkMode ? "#333" : "#ccc"}`,
          borderRadius: "8px",
          backgroundColor: darkMode ? "#1a1a1a" : "#fff",
          color: darkMode ? "#fff" : "#111"
        }}>
          {displayedAlerts.length === 0 && (
            <p style={{ textAlign: "center", padding: "1rem" }}>No alerts to display.</p>
          )}
          {displayedAlerts.map((alert, index) => (
            <div key={index} style={{
              display: "flex",
              flexDirection: "column",
              border: `1px solid ${darkMode ? "#444" : "#ccc"}`,
              borderRadius: "8px",
              padding: "1rem",
              backgroundColor: index % 2 === 0 ? (darkMode ? "#222" : "#eee") : (darkMode ? "#1f1f1f" : "#ddd"),
              transition: "transform 0.2s",
              animation: alert.severity === "Critical" ? "flash 1s infinite alternate" : "none"
            }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span><strong>Time (UTC):</strong> {alert.timestamp}</span>
                <span style={{
                  padding: "0.2rem 0.6rem",
                  borderRadius: "12px",
                  backgroundColor: getSeverityColor(alert.severity),
                  color: alert.severity === "Medium" ? "#000" : "#fff",
                  fontWeight: "bold"
                }}>
                  {alert.severity}
                </span>
              </div>
              <div style={{ marginTop: "0.5rem" }}>
                <strong>Source IP:</strong> {alert.src_ip}<br />
                <strong>Domain:</strong> {alert.domain}
              </div>
              <div style={{ marginTop: "0.5rem" }}>
                {alert.alerts.map((a, i) => (
                  <div key={i} style={{
                    borderTop: i !== 0 ? `1px dashed ${darkMode ? "#555" : "#aaa"}` : "none",
                    paddingTop: i !== 0 ? "0.3rem" : "0",
                    marginTop: i !== 0 ? "0.3rem" : "0"
                  }}>
                    <strong>{a.type}:</strong>
                    <span style={{ cursor: "pointer", marginLeft: "0.3rem" }}
                      onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}>
                      {expandedIndex === index ? a.description : (a.description.length > 50 ? a.description.slice(0, 50) + "..." : a.description)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div ref={alertsEndRef} />
        </div>
      </section>

      {/* Charts */}
      <section style={{ display: "flex", flexWrap: "wrap", gap: "2rem", marginTop: "2rem" }}>
        <div style={{ flex: 1, minWidth: "300px", height: "300px" }}>
          <h2 style={{ color: "#00bcd4" }}>Alert Trend</h2>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={darkMode ? "#333" : "#ccc"} strokeDasharray="5 5" />
              <XAxis dataKey="timestamp" tick={{ fontSize: 12, fill: darkMode ? "#fff" : "#111" }} />
              <YAxis tick={{ fill: darkMode ? "#fff" : "#111" }} domain={[0, 4]} ticks={[1, 2, 3, 4]} />
              <Tooltip
                formatter={(value) => {
                  const sev = Object.keys(severityMap).find(key => severityMap[key] === value);
                  return [sev || "N/A", "Severity"];
                }}
                contentStyle={{ backgroundColor: darkMode ? "#222" : "#fff", border: `1px solid ${darkMode ? "#555" : "#ccc"}`, color: darkMode ? "#fff" : "#111" }}
              />
              <Legend wrapperStyle={{ color: darkMode ? "#fff" : "#111" }} />
              <Line
                type="monotone"
                dataKey="severityValue"
                stroke="#00bcd4"
                strokeWidth={2}
                dot={{ r: 3, fill: "#00bcd4" }}
                activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ flex: 1, minWidth: "300px", height: "300px" }}>
          <h2 style={{ color: "#00bcd4" }}>Severity Distribution</h2>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label={(entry) => entry.name}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getSeverityColor(entry.name)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [value, name]}
                contentStyle={{ backgroundColor: darkMode ? "#222" : "#fff", border: `1px solid ${darkMode ? "#555" : "#ccc"}`, color: darkMode ? "#fff" : "#111" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <style>{`
        @keyframes flash {
          0% { background-color: #f44336; }
          50% { background-color: #ff7961; }
          100% { background-color: #f44336; }
        }
      `}</style>
    </div>
  );
}

export default App;

