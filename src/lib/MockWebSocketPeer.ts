import { EventEmitter } from 'events';
import { Socket } from 'net';

import { Data as WSData } from 'ws';
import { MockWebSocketConnection } from './MockWebSocketConnection';
import { WebSocketCloseMessage } from './WebSocketCloseMessage';

export abstract class MockWebSocketPeer extends EventEmitter {
  protected readonly socket: Socket;

  constructor(protected peerConnection: MockWebSocketConnection) {
    super();

    this.socket = new Socket();
    this.socket.on('error', (hadError) => {
      // tslint:disable-next-line:no-console
      console.log({ hadError });
    });
  }

  get wasConnectionClosed(): boolean {
    return this.peerConnection.closeFrame !== null;
  }

  public disconnect(code?: number, reason?: string): void {
    this.peerConnection.emit('close', code, reason);
  }

  public abort(error: Error): void {
    this.peerConnection.emit('error', error);
  }

  public async send(message: Buffer | string): Promise<void> {
    this.requireConnectionStillOpen();

    return new Promise((resolve) => {
      this.peerConnection.once('message', resolve);
      this.peerConnection.emit('message', message);
    });
  }

  public async receive(): Promise<WSData> {
    this.requireConnectionStillOpen();

    const lastMessage = this.popLastPeerMessage();
    if (lastMessage) {
      return lastMessage;
    }

    return this.peerConnection.getLastMessageSent();
  }

  public popLastPeerMessage(): WSData | undefined {
    return this.peerConnection.popLastMessage();
  }

  public async waitForPeerClosure(): Promise<WebSocketCloseMessage> {
    return this.peerConnection.getCloseFrameWhenAvailable();
  }

  private requireConnectionStillOpen(): void {
    if (this.wasConnectionClosed) {
      throw new Error('Connection was already closed');
    }
  }
}
