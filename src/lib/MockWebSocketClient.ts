import { IncomingMessage } from 'http';
import { Server as WSServer } from 'ws';

import { MockWebSocketConnection } from './MockWebSocketConnection';
import { MockWebSocketPeer } from './MockWebSocketPeer';

export class MockWebSocketClient extends MockWebSocketPeer {
  constructor(
    private wsServer: WSServer,
    private headers: { readonly [key: string]: string } = {},
  ) {
    super(new MockWebSocketConnection());
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
