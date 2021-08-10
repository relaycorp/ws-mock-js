import { MockPeer } from './MockPeer';
import { MockWebSocket } from './MockWebSocket';

export class MockServer extends MockPeer {
  get client(): MockWebSocket {
    return this.peerWebSocket;
  }

  public async use<T>(
    clientPromise: Promise<T>,
    serverImplementation?: () => Promise<void>,
  ): Promise<T> {
    const [clientResult] = await Promise.all([
      clientPromise,
      new Promise(async (resolve) => {
        this.peerWebSocket.emit('open');

        // Give the client enough time to connect
        await new Promise(setImmediate);

        await serverImplementation?.();

        // Allow more time for the client to process the latest actions from the server
        await new Promise(setImmediate);

        if (!this.didICloseConnection && !this.didPeerCloseConnection) {
          this.close();
        }

        resolve(undefined);
      }),
    ]);

    return clientResult;
  }
}
