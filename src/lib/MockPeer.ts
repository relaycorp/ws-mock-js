import { Data as WSData } from 'ws';

import { CloseFrame } from './CloseFrame';
import { MockWebSocket } from './MockWebSocket';

export abstract class MockPeer {
  protected readonly peerWebSocket = new MockWebSocket();

  get wasConnectionClosed(): boolean {
    return this.peerWebSocket.closeFrame !== null;
  }

  public close(code?: number, reason?: string): void {
    this.peerWebSocket.emit('close', code, reason);
  }

  public abort(error: Error): void {
    this.peerWebSocket.emit('error', error);
  }

  public async send(message: string | Buffer | ArrayBuffer): Promise<void> {
    this.requireConnectionStillOpen();

    const messageSerialized =
      typeof message === 'string' ? message : this.convertBinaryType(message);
    return new Promise((resolve) => {
      this.peerWebSocket.once('message', resolve);
      this.peerWebSocket.emit('message', messageSerialized);
    });
  }

  public async receive(): Promise<WSData> {
    this.requireConnectionStillOpen();

    const oldestMessage = this.popOldestPeerMessage();
    if (oldestMessage) {
      return oldestMessage;
    }

    return this.peerWebSocket.getLastMessageSent();
  }

  public popOldestPeerMessage(): WSData | undefined {
    return this.peerWebSocket.popOldestMessage();
  }

  public async waitForPeerClosure(): Promise<CloseFrame> {
    return this.peerWebSocket.getCloseFrameWhenAvailable();
  }

  get peerCloseFrame(): CloseFrame | null {
    return this.peerWebSocket.closeFrame;
  }

  protected convertBinaryType(message: Buffer | ArrayBuffer): Buffer {
    const binaryType = this.peerWebSocket.binaryType;
    if (binaryType === 'nodebuffer') {
      return Buffer.isBuffer(message) ? message : Buffer.from(message);
    }

    throw new Error(`Unsupported WebSocket.binaryType (${binaryType}); feel free to open a PR`);
  }

  private requireConnectionStillOpen(): void {
    if (this.wasConnectionClosed) {
      throw new Error('Connection was already closed');
    }
  }
}
