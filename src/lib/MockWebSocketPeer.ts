import { EventEmitter } from 'events';
import { Socket } from 'net';

import { MockWebSocketConnection } from './MockWebSocketConnection';
import { WebSocketCloseMessage } from './WebSocketCloseMessage';

export class MockWebSocketPeer extends EventEmitter {
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
    return this.peerConnection.ownCloseFrame !== null;
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

  public async receive(): Promise<Buffer | string> {
    this.requireConnectionStillOpen();

    const lastMessage = this.getLastMessage();
    if (lastMessage) {
      return lastMessage;
    }

    const message = await waitForEvent<Buffer | string>(
      'messageSent',
      this.peerConnection.serverEvents,
    );
    const index = this.peerConnection.messagesSentByServer.indexOf(message);
    this.peerConnection.messagesSentByServer.splice(index, 1);
    return message;
  }

  public getLastMessage(): Buffer | string | undefined {
    return this.peerConnection.messagesSentByServer.pop() as Buffer | string;
  }

  public async waitForClose(): Promise<WebSocketCloseMessage> {
    if (this.peerConnection.ownCloseFrame) {
      return this.peerConnection.ownCloseFrame;
    }
    return waitForEvent('close', this.peerConnection.serverEvents);
  }

  private requireConnectionStillOpen(): void {
    if (this.wasConnectionClosed) {
      throw new Error('Connection was already closed');
    }
  }
}

async function waitForEvent<T>(eventName: string, eventEmitter: EventEmitter): Promise<T> {
  return new Promise((resolve) => eventEmitter.once(eventName, resolve));
}
