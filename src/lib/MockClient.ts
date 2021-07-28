import { IncomingMessage } from 'http';
import { Socket } from 'net';
import { Server as WSServer } from 'ws';

import { MockPeer } from './MockPeer';

export class MockClient extends MockPeer {
  protected readonly socket: Socket;

  constructor(
    private wsServer: WSServer,
    private headers: { readonly [key: string]: string } = {},
    private url: string = '/',
  ) {
    super();

    this.socket = new Socket();
    this.socket.on('error', (hadError) => {
      // tslint:disable-next-line:no-console
      console.log({ hadError });
    });
  }

  public async connect(): Promise<void> {
    const incomingMessage = new IncomingMessage(this.socket);
    // tslint:disable-next-line:no-object-mutation
    incomingMessage.headers = {
      ...incomingMessage.headers,
      ...this.headers,
    };
    // tslint:disable-next-line:no-object-mutation
    incomingMessage.url = this.url;

    return new Promise((resolve) => {
      this.wsServer.once('connection', resolve);
      this.wsServer.emit('connection', this.peerWebSocket, incomingMessage);
    });
  }

  /**
   * Connect to server, run `callback` and close the connection.
   *
   * @param callback The function to execute whilst connected to server
   */
  public async use(callback: () => Promise<void>): Promise<void> {
    await this.connect();
    try {
      await callback();
    } finally {
      this.close();
    }
  }
}
