// tslint:disable:readonly-keyword no-object-mutation

import { IncomingMessage } from 'http';
import { Socket } from 'net';
import { Server as WSServer } from 'ws';

import { MockPeer } from './MockPeer';

export class MockClient extends MockPeer {
  protected readonly socket: Socket;

  protected connected = false;

  constructor(
    private wsServer: WSServer,
    private headers: { readonly [key: string]: string } = {},
    private url: string = '/',
  ) {
    super();

    this.socket = new Socket();
    // TODO: Propagate error somehow, instead of silencing it
    this.socket.on('error', (hadError) => {
      // tslint:disable-next-line:no-console
      console.log({ hadError });
    });
  }

  public async connect(): Promise<void> {
    if (this.connected) {
      throw new Error('Cannot connect to server again');
    }

    const incomingMessage = new IncomingMessage(this.socket);
    incomingMessage.headers = {
      ...incomingMessage.headers,
      ...this.headers,
    };
    incomingMessage.url = this.url;

    this.connected = true;

    // Only return once the server's own `connection` event handler has been been executed
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
