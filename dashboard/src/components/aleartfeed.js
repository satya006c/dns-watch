import React, { useEffect, useState } from "react";

const AlertFeed = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Connect to backend WebSocket
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/alerts");

    ws.onopen = () => console.log("Connected to WebSocket");
    ws.onmessage = (event) => {
      const alert = JSON.parse(event.data);
      setAlerts((prev) => [alert, ...prev]); // newest first
    };
    ws.onclose = () => console.log("WebSocket disconnected");

    return () => ws.close();
  }, []);

  return (
    <div>
      <h2>Real-time DNS Alerts</h2>
      <ul>
        {alerts.map((alert, index) => (
          <li key={index}>
            <strong>{alert.severity}</strong>: {alert.message || alert.alerts?.join(", ")} <br />
            <em>{alert.timestamp}</em> from {alert.src_ip} → {alert.domain}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AlertFeed;
