import { IncomingMessage } from 'http';
import { Server as WSServer } from 'ws';

import { MockConnection } from './MockConnection';
import { MockPeer } from './MockPeer';

export class MockClient extends MockPeer {
  constructor(
    private wsServer: WSServer,
    private headers: { readonly [key: string]: string } = {},
  ) {
    super(new MockConnection());
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
      this.wsServer.emit('connection', this.peerConnection, incomingMessage);
    });
  }
}
