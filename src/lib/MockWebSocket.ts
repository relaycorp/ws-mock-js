import { EventEmitter } from 'events';
import { Duplex } from 'stream';
import { Data as WSData } from 'ws';

import { CloseFrame } from './CloseFrame';

export class MockWebSocket extends EventEmitter {
  // tslint:disable-next-line:readonly-keyword
  public binaryType: 'nodebuffer' | 'arraybuffer' = 'nodebuffer';

  // tslint:disable-next-line:readonly-keyword
  protected ownCloseFrame: CloseFrame | null = null;
  // tslint:disable-next-line:readonly-array
  protected readonly messagesSent: WSData[] = [];
  protected readonly ownEvents = new EventEmitter();

  public send(data: WSData): void {
    this.messagesSent.push(data);
    this.ownEvents.emit('messageSent', data);
  }

  /**
   * @internal
   */
  public async getLastMessageSent(): Promise<WSData> {
    const message = await waitForEvent<WSData>('messageSent', this.ownEvents);
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
    this.ownEvents.emit('close', this.ownCloseFrame);
  }

  /**
   * @internal
   */
  get closeFrame(): CloseFrame | null {
    return this.ownCloseFrame;
  }

  /**
   * @internal
   */
  public async getCloseFrameWhenAvailable(): Promise<CloseFrame> {
    if (this.ownCloseFrame) {
      return this.ownCloseFrame;
    }
    return waitForEvent('close', this.ownEvents);
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
