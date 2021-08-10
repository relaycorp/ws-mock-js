import bufferToArray from 'buffer-to-arraybuffer';
import { Data as WSData } from 'ws';

import { CloseFrame } from './CloseFrame';
import { MockWebSocket } from './MockWebSocket';
import { PingOrPong } from './PingOrPong';

export abstract class MockPeer {
  protected readonly peerWebSocket = new MockWebSocket();

  // tslint:disable-next-line:readonly-keyword
  protected ownCloseFrame: CloseFrame | null = null;

  // tslint:disable-next-line:readonly-keyword
  protected wasAborted: boolean = false;

  get didPeerCloseConnection(): boolean {
    return this.peerWebSocket.closeFrame !== null || this.peerWebSocket.wasTerminated;
  }

  protected get didICloseConnection(): boolean {
    return this.ownCloseFrame !== null || this.wasAborted;
  }

  public close(code: number = 1005, reason?: string): void {
    // tslint:disable-next-line:readonly-keyword no-object-mutation
    this.ownCloseFrame = { code, reason };

    this.peerWebSocket.emit('close', code, reason);
  }

  public abort(error: Error): void {
    // tslint:disable-next-line:no-object-mutation
    this.wasAborted = true;

    this.peerWebSocket.emit('error', error);
    this.close(1006);
  }

  public async send(message: WSData): Promise<void> {
    this.requireConnectionStillOpen();

    const messageSerialized =
      typeof message === 'string' || Array.isArray(message)
        ? message
        : this.convertBinaryType(message);
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

  /**
   * Send ping to peer and return ping data.
   *
   * @param data
   */
  public ping(data?: Buffer): Buffer {
    const finalData = data ?? Buffer.from(Math.random().toString());
    this.peerWebSocket.emit('ping', finalData);
    return finalData;
  }

  /**
   * Send pong to peer.
   *
   * @param data
   */
  public pong(data: Buffer): void {
    this.peerWebSocket.emit('pong', data);
  }

  /**
   * Return pings sent by peer.
   */
  get incomingPings(): readonly PingOrPong[] {
    // Return a shallow copy to avoid race conditions if more pings are received
    return [...this.peerWebSocket.outgoingPings];
  }

  /**
   * Return pongs sent by peer.
   */
  get incomingPongs(): readonly PingOrPong[] {
    // Return a shallow copy to avoid race conditions if more pings are received
    return [...this.peerWebSocket.outgoingPongs];
  }

  /**
   * Mimic the conversion that `ws` would do on binary frames.
   *
   * @param message
   *
   * See https://github.com/websockets/ws/blob/master/doc/ws.md#websocketbinarytype
   */
  protected convertBinaryType(message: Buffer | ArrayBuffer): Buffer | ArrayBuffer {
    if (this.peerWebSocket.binaryType === 'nodebuffer') {
      return Buffer.isBuffer(message) ? message : Buffer.from(message);
    }

    return Buffer.isBuffer(message) ? bufferToArray(message) : message;
  }

  private requireConnectionStillOpen(): void {
    if (this.didPeerCloseConnection) {
      throw new Error('Connection was already closed');
    }
  }
}
