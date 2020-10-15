import WebSocket from 'ws';
import { MockPeer } from './MockPeer';
import { MockServerAction } from './MockServerAction';

export class MockServer extends MockPeer {
  get mockClientWebSocket(): WebSocket {
    return this.peerWebSocket as any;
  }

  public async runActions(...actions: readonly MockServerAction[]): Promise<void> {
    for (const action of actions) {
      await action.run(this);
    }
  }

  public async acceptConnection(): Promise<void> {
    await new Promise((resolve) => {
      this.peerWebSocket.once('open', resolve);
      this.peerWebSocket.emit('open');
    });
  }
}
