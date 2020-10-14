import { EventEmitter } from 'events';
import { Duplex } from 'stream';
import { WebSocketCloseMessage } from './WebSocketCloseMessage';

export class MockWebSocketConnection extends EventEmitter {
  // tslint:disable-next-line:readonly-keyword
  public ownCloseFrame: WebSocketCloseMessage | null = null;
  // tslint:disable-next-line:readonly-array
  public readonly messagesSentByServer: Array<Buffer | string> = [];
  public readonly serverEvents = new EventEmitter();

  public send(data: any): void {
    this.messagesSentByServer.push(data);
    this.serverEvents.emit('messageSent', data);
  }

  public close(code?: number, reason?: string): void {
    // tslint:disable-next-line:no-object-mutation
    this.ownCloseFrame = { code, reason };
    this.serverEvents.emit('close', this.ownCloseFrame);
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
