import { EventEmitter } from 'events';
import { Duplex } from 'stream';
import { Data as WSData } from 'ws';

import { WebSocketCloseMessage } from './WebSocketCloseMessage';

export class MockWebSocketConnection extends EventEmitter {
  // tslint:disable-next-line:readonly-keyword
  protected ownCloseFrame: WebSocketCloseMessage | null = null;
  // tslint:disable-next-line:readonly-array
  protected readonly messagesSent: WSData[] = [];
  protected readonly serverEvents = new EventEmitter();

  public send(data: WSData): void {
    this.messagesSent.push(data);
    this.serverEvents.emit('messageSent', data);
  }

  /**
   * @internal
   */
  public async getLastMessageSent(): Promise<WSData> {
    const message = await waitForEvent<Buffer | string>('messageSent', this.serverEvents);
    const index = this.messagesSent.indexOf(message);
    this.messagesSent.splice(index, 1);
    return message;
  }

  /**
   * @internal
   */
  public popLastMessage(): WSData | undefined {
    return this.messagesSent.pop();
  }

  public close(code?: number, reason?: string): void {
    // tslint:disable-next-line:no-object-mutation
    this.ownCloseFrame = { code, reason };
    this.serverEvents.emit('close', this.ownCloseFrame);
  }

  /**
   * @internal
   */
  get closeFrame(): WebSocketCloseMessage | null {
    return this.ownCloseFrame;
  }

  /**
   * @internal
   */
  public async getCloseFrameWhenAvailable(): Promise<WebSocketCloseMessage> {
    if (this.ownCloseFrame) {
      return this.ownCloseFrame;
    }
    return waitForEvent('close', this.serverEvents);
  }

  public makeDuplex(): Duplex {
    // tslint:disable-next-line:no-this-assignment
    const connection = this;
    const duplex = new Duplex({
      objectMode: true,
      read(_size: number): void {
        connection.on('message', (message) => {
          duplex.push(message);
        });
      },
      write(chunk: any, _encoding: string, callback: (error?: Error | null) => void): void {
        connection.send(chunk);
        callback();
      },
    });

    this.on('close', () => duplex.push(null));

    this.on('error', (error) => duplex.destroy(error));

    return duplex;
  }
}

async function waitForEvent<T>(eventName: string, eventEmitter: EventEmitter): Promise<T> {
  return new Promise((resolve) => eventEmitter.once(eventName, resolve));
}
