import { Connection } from './Connection';
import { type WebSocket } from 'uWebSockets.js';
import { getSubLogger } from "../commons/logger";

const logger = getSubLogger("ConnectionsManager");

export const ConnectionsManager = {
  connections: new Map<WebSocket<unknown>, Connection>(),

  /**
   * Add a new connection
   * 
   * @param ws 
   * @returns 
   */
  addConnection(ws: WebSocket<unknown>): Connection {
    logger.debug(`Adding new connection`);
    const connection = new Connection(ws);
    ConnectionsManager.connections.set(ws, connection);
    return connection;
  },

  /**
   * Delete a connection
   * 
   * @param ws 
   */
  deleteConnection(ws: WebSocket<unknown>): void {
    logger.debug(`Deleting connection`);
    ConnectionsManager.connections.delete(ws);
  },

  /**
   * Check if a connection exists
   * 
   * @param ws 
   * @returns 
   */
  hasConnection(ws: WebSocket<unknown>): boolean {
    return ConnectionsManager.connections.has(ws);
  },

  /**
   * Get the connection
   * 
   * @param ws 
   * @returns 
   */
  getConnection(ws: WebSocket<unknown>): Connection {
    const connection = ConnectionsManager.connections.get(ws);
    if (!connection) {
      throw new Error(`Connection not found`);
    }
    return connection;
  },

  /**
   * Handle message
   * 
   * @param ws 
   * @param message 
   */
  handleMessage(ws: WebSocket<unknown>, message: ArrayBuffer) {
    if (!ConnectionsManager.hasConnection(ws)) {
      logger.warn(`Received message from unknown client`);
      return;
    }

    ConnectionsManager.getConnection(ws).handleCommand(message);
  }

};
