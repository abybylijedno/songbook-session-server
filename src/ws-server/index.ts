import { App } from "uWebSockets.js";
import { getSubLogger } from "../commons/logger";
import { ConnectionsManager } from "./connection";
import { SessionsManager } from "./session";


const logger = getSubLogger("ws-server");
const app = App();

app.ws("/ws", {
  sendPingsAutomatically: true,
  idleTimeout: 10,

  open: (ws) => {
    logger.debug(`New client has connected`);
    ConnectionsManager.addConnection(ws);
  },

  close: (ws, code, message) => {
    logger.debug(`Client disconnected with code ${code} and message ${message}.`);
    ConnectionsManager.deleteConnection(ws);
  },
  
  message: (ws, message, isBinary) => {
    if (!isBinary) {
      logger.warn(`Message is not binary - disconnecting client`);
      ws.end();
      return;
    }

    ConnectionsManager.handleMessage(ws, message);
  },

  pong: (ws) => {
    ConnectionsManager.handlePong(ws);
  }
});

const PORT = 8081;
app.listen(PORT, (token) => {
  if (token) {
    logger.info(`Listening on port ${PORT}`);
    SessionsManager.startCleaner({ seconds: 5 });
  } else {
    logger.error(`Failed to listen to port ${PORT}`);
  }
});
