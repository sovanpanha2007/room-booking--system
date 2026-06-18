const { WebSocketServer, WebSocket } = require('ws');

let wss = null;

function initialize(server) {
    wss = new WebSocketServer({ server });

    wss.on('connection', (ws, req) => {
        console.log(`[WebSocket] Client connected from ${req.socket.remoteAddress}`);

        // Simple heartbeat ping-pong to clean up dead connections
        ws.isAlive = true;
        ws.on('pong', () => {
            ws.isAlive = true;
        });

        ws.on('message', (message) => {
            try {
                const parsed = JSON.parse(message);
                console.log(`[WebSocket] Received message:`, parsed);
                // Clients can subscribe or ping, handle accordingly if needed
                if (parsed.event === 'ping') {
                    ws.send(JSON.stringify({ event: 'pong' }));
                }
            } catch (err) {
                // Ignore parsing errors from client
            }
        });

        ws.on('close', () => {
            console.log('[WebSocket] Client disconnected');
        });

        ws.on('error', (error) => {
            console.error('[WebSocket] Connection error:', error);
        });

        // Send a welcome message
        ws.send(JSON.stringify({ event: 'connected', message: 'Connected to Room Booking Live Broadcast' }));
    });

    // Heartbeat check every 30 seconds
    const interval = setInterval(() => {
        if (!wss) return;
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                console.log('[WebSocket] Terminating dead client connection');
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

    wss.on('close', () => {
        clearInterval(interval);
    });

    console.log('[WebSocket] Server initialized successfully');
    return wss;
}

function broadcast(event, data) {
    if (!wss) {
        console.warn('[WebSocket] Warning: WebSocket server not initialized yet');
        return;
    }
    const message = JSON.stringify({ event, data });
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

module.exports = {
    initialize,
    broadcast
};
