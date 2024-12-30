import { Connection } from './Connection';
import WebSocket from 'ws';
import { type IUser } from '@abybylijedno/songbook-protocol';

import { getSubLogger } from "../../commons/logger";
const logger = getSubLogger("ConnectionsManager");

/**
 * Connections manager
 */
export const ConnectionsManager = {
  connections: new Map<WebSocket, Connection>(),

  /**
   * Add a new connection
   * 
   * @param ws 
   * @returns 
   */
  addConnection(ws: WebSocket): Connection {
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
  deleteConnection(ws: WebSocket): void {
    logger.debug(`Deleting connection`);
    ConnectionsManager.connections.delete(ws);
  },

  /**
   * Check if a connection exists
   * 
   * @param ws 
   * @returns 
   */
  hasConnection(ws: WebSocket): boolean {
    return ConnectionsManager.connections.has(ws);
  },

  /**
   * Get the connection
   * 
   * @param ws 
   * @returns 
   */
  getConnection(ws: WebSocket): Connection {
    const connection = ConnectionsManager.connections.get(ws);
    if (!connection) {
      throw new Error(`Connection not found`);
    }
    return connection;
  },

  /**
   * Find connection of user
   * 
   * @param user 
   * @returns 
   */
  findConnectionOfUser(user: IUser): Connection | undefined {
    for (const [ws, connection] of ConnectionsManager.connections) {
      if (connection.user.uid === user.uid) {
        return connection;
      }
    }

    return undefined;
  },

  /**
   * Handle message
   * 
   * @param ws 
   * @param message 
   */
  handleMessage(ws: WebSocket, message: ArrayBuffer) {
    if (!ConnectionsManager.hasConnection(ws)) {
      logger.warn(`Received message from unknown client`);
      return;
    }

    ConnectionsManager.getConnection(ws).handleCommand(message);
  },

  /**
   * Handle pong
   * 
   * @param ws 
   */
  handlePong(ws: WebSocket) {
    if (!ConnectionsManager.hasConnection(ws)) {
      logger.warn(`Received pong from unknown client`);
      return;
    }

    ConnectionsManager.getConnection(ws).handlePong();
  }

};
