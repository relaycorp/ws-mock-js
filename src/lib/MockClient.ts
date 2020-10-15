import { IncomingMessage } from 'http';
import { Socket } from 'net';
import { Server as WSServer } from 'ws';

import { MockPeer } from './MockPeer';

export class MockClient extends MockPeer {
  protected readonly socket: Socket;

  constructor(
    private wsServer: WSServer,
    private headers: { readonly [key: string]: string } = {},
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
    return new Promise((resolve) => {
      this.wsServer.once('connection', resolve);
      this.wsServer.emit('connection', this.peerWebSocket, incomingMessage);
    });
  }
}
