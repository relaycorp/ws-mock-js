import { EventEmitter } from 'events';
import { Duplex } from 'stream';
import { Data as WSData } from 'ws';

import { CloseFrame } from './CloseFrame';
import { PingOrPong } from './PingOrPong';

const READY_STATES: readonly string[] = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];

export class MockWebSocket extends EventEmitter {
  public static readonly CONNECTING = READY_STATES.indexOf('CONNECTING');
  public static readonly OPEN = READY_STATES.indexOf('OPEN');
  public static readonly CLOSING = READY_STATES.indexOf('CLOSING');
  public static readonly CLOSED = READY_STATES.indexOf('CLOSED');

  public readonly CONNECTING = MockWebSocket.CONNECTING;
  public readonly OPEN = MockWebSocket.OPEN;
  public readonly CLOSING = MockWebSocket.CLOSING;
  public readonly CLOSED = MockWebSocket.CLOSED;

  // tslint:disable-next-line:readonly-keyword
  public binaryType: 'nodebuffer' | 'arraybuffer' = 'nodebuffer';

  // tslint:disable-next-line:readonly-array
  public readonly outgoingPings: PingOrPong[] = [];
  // tslint:disable-next-line:readonly-array
  public readonly outgoingPongs: PingOrPong[] = [];

  // tslint:disable-next-line:readonly-keyword
  protected _readyState: number = MockWebSocket.CONNECTING;

  // tslint:disable-next-line:readonly-keyword
  protected ownCloseFrame: CloseFrame | null = null;
  // tslint:disable-next-line:readonly-keyword
  protected _wasTerminated = false;

  // tslint:disable-next-line:readonly-array
  protected readonly messagesSent: WSData[] = [];
  protected readonly ownEvents = new EventEmitter();

  constructor() {
    super();

    this.once('open', () => {
      // tslint:disable-next-line:no-object-mutation
      this._readyState = MockWebSocket.OPEN;
    });
  }

  get readyState(): number {
    return this._readyState;
  }

  public send(data: WSData): void {
    this.requireOpenConnection();

    this.messagesSent.push(data);
    this.ownEvents.emit('messageSent', data);
  }

  public ping(data?: WSData, mask?: boolean, cb?: (err?: Error) => void): void {
    this.requireOpenConnection();

    this.outgoingPings.push({ data, cb, mask, date: new Date() });
    if (cb) {
      cb();
    }
  }

  public pong(data?: WSData, mask?: boolean, cb?: (err?: Error) => void): void {
    this.requireOpenConnection();

    this.outgoingPongs.push({ data, cb, mask, date: new Date() });
    if (cb) {
      cb();
    }
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
  public popOldestMessage(): WSData | undefined {
    return this.messagesSent.shift();
  }

  public close(code?: number, reason?: string): void {
    this.requireOpenConnection();

    // tslint:disable-next-line:no-object-mutation
    this._readyState = MockWebSocket.CLOSED;

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

  public terminate(): void {
    this.requireOpenConnection();

    // tslint:disable-next-line:no-object-mutation
    this._readyState = MockWebSocket.CLOSED;

    // tslint:disable-next-line:no-object-mutation
    this._wasTerminated = true;
    this.ownEvents.emit('termination');
  }

  get wasTerminated(): boolean {
    return this._wasTerminated;
  }

  public makeDuplex(): Duplex {
    this.requireOpenConnection();

    // tslint:disable-next-line:no-this-assignment
    const connection = this;
    const duplex = new Duplex({
      objectMode: true,
      destroy(error: Error | null, callback: (error: Error | null) => void): void {
        if (!connection.wasTerminated) {
          connection.emit('close', error ? 1006 : 1005);
        }
        callback(error);
      },
      read(_size: number): void {
        // Do nothing. We're already recording incoming messages.
      },
      write(chunk: any, _encoding: string, callback: (error?: Error | null) => void): void {
        connection.send(chunk);
        callback();
      },
    });

    this.on('message', (message) => duplex.push(message));

    this.once('close', () => duplex.destroy());

    this.ownEvents.once('termination', () => duplex.destroy());

    this.once('error', (error) => duplex.destroy(error));

    return duplex;
  }

  private requireOpenConnection(): void {
    // TODO: Use this.readyState
    if (this.ownCloseFrame) {
      throw new Error('Connection was closed');
    }
    if (this.wasTerminated) {
      throw new Error('Connection was terminated');
    }
  }
}

async function waitForEvent<T>(eventName: string, eventEmitter: EventEmitter): Promise<T> {
  return new Promise((resolve) => eventEmitter.once(eventName, resolve));
}
