import { EventEmitter } from 'events';

import { Data as WSData } from 'ws';
import { CloseFrame } from './CloseFrame';
import { MockWebSocket } from './MockWebSocket';

export abstract class MockPeer extends EventEmitter {
  protected readonly peerWebSocket = new MockWebSocket();

  get wasConnectionClosed(): boolean {
    return this.peerWebSocket.closeFrame !== null;
  }

  public disconnect(code?: number, reason?: string): void {
    this.peerWebSocket.emit('close', code, reason);
  }

  public abort(error: Error): void {
    this.peerWebSocket.emit('error', error);
  }

  public async send(message: Buffer | string): Promise<void> {
    this.requireConnectionStillOpen();

    return new Promise((resolve) => {
      this.peerWebSocket.once('message', resolve);
      this.peerWebSocket.emit('message', message);
    });
  }

  public async receive(): Promise<WSData> {
    this.requireConnectionStillOpen();

    const lastMessage = this.popLastPeerMessage();
    if (lastMessage) {
      return lastMessage;
    }

    return this.peerWebSocket.getLastMessageSent();
  }

  public popLastPeerMessage(): WSData | undefined {
    return this.peerWebSocket.popLastMessage();
  }

  public async waitForPeerClosure(): Promise<CloseFrame> {
    return this.peerWebSocket.getCloseFrameWhenAvailable();
  }

  private requireConnectionStillOpen(): void {
    if (this.wasConnectionClosed) {
      throw new Error('Connection was already closed');
    }
  }
}
