import { MockPeer } from './MockPeer';
import { MockServerAction } from './MockServerAction';
import { MockWebSocket } from './MockWebSocket';

export class MockServer extends MockPeer {
  get client(): MockWebSocket {
    return this.peerWebSocket;
  }

  public async runActions(...actions: readonly MockServerAction[]): Promise<void> {
    for (const action of actions) {
      if (this.wasConnectionClosed) {
        break;
      }
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
