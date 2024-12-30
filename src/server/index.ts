import { WebSocketServer } from 'ws';
import { getSubLogger } from "../commons/logger";
import { ConnectionsManager } from "./connection";
import { SessionsManager } from "./session";
import { Duration } from 'luxon';

const PORT = 8081;
const HEARTBEAT_INTERVAL = Duration.fromObject({ seconds: 5 }).toMillis();
const HEARTBEAT_THRESHOLD = 3;

const logger = getSubLogger("server");
const server = new WebSocketServer({
  port: PORT
});

/**
 * Start listening
 */
server.on('listening', () => {
  logger.info(`Listening on port ${PORT}`);
  SessionsManager.startCleaner({ seconds: 5 });
});

/**
 * Handle server errors
 */
server.on('error', (err) => {
  logger.error(`Server error: ${err}`);
});

/**
 * Handle new connection
 */
server.on('connection', (ws) => {
  logger.info(`New client has connected`);
  ConnectionsManager.addConnection(ws);

  // Ping-pong mechanism
  let pings = 0;
  const heartbeat = setInterval(() => {
    if (pings > HEARTBEAT_THRESHOLD) {
      logger.warn(`Client has missed ${pings} pings - disconnecting`);
      ws.terminate();
      clearInterval(heartbeat);
      return;
    }

    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
      pings++;
    }
  }, HEARTBEAT_INTERVAL);

  // Handle messages
  ws.on('message', (data: ArrayBuffer, isBinary) => {
    if (!isBinary) {
      logger.warn(`Message is not binary - disconnecting client`);
      ws.terminate();
      return;
    }

    ConnectionsManager.handleMessage(ws, data);
  });

  // Handle pongs
  ws.on('pong', () => {
    pings = 0;
    ConnectionsManager.handlePong(ws);
  });

  // Handle disconnect
  ws.on('close', (code, reason) => {
    logger.info(`Client disconnected with code ${code} and reason ${reason}`);
    clearInterval(heartbeat);
    ConnectionsManager.deleteConnection(ws);
  });

});

/**
 * Handle server close
 */
server.on('close', () => {
  logger.debug(`Server has closed`);
});
