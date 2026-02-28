let ws = null;

export const initWebSocket = (userId, onMessage) => {
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
  ws = new WebSocket(`${wsUrl}/ws/messages/${userId}`);

  ws.onopen = () => {
    console.log('WebSocket connected');
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
  };
};

export const sendWebSocketMessage = (message) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
};

export const closeWebSocket = () => {
  if (ws) {
    ws.close();
  }
};
