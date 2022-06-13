import { MockPeer } from './MockPeer';
import { MockWebSocket } from './MockWebSocket';
import { MockWSError } from './MockWSError';

export class MockServer extends MockPeer {
  get client(): MockWebSocket {
    return this.peerWebSocket;
  }

  public async use<T>(
    clientPromise: Promise<T>,
    serverImplementation?: () => Promise<void>,
  ): Promise<T> {
    const [clientResult, serverResult] = await Promise.allSettled([
      clientPromise,
      new Promise(async (resolve) => {
        this.peerWebSocket.emit('open');

        // Give the client enough time to connect
        await new Promise(setImmediate);

        await serverImplementation?.();

        // Allow more time for the client to process the latest actions from the server
        await new Promise(setImmediate);

        if (this.client.readyState === MockWebSocket.OPEN) {
          this.close();
        }

        resolve(undefined);
      }),
    ]);

    if (clientResult.status === 'rejected') {
      throw new MockWSError(clientResult.reason, 'Client promise rejected');
    }
    if (serverResult.status === 'rejected') {
      throw new MockWSError(serverResult.reason, 'Mock server failed');
    }

    return clientResult.value;
  }
}
