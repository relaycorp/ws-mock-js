# @relaycorp/ws-mock

Mock client and server to unit test the NPM package [`ws`](https://www.npmjs.com/package/ws).

## Install

```
npm install @relaycorp/ws-mock
```

## Using the mock client

You should initialise `MockClient` by passing the `ws` server to be tested and then call `client.connect()` to initiate the connection. From that point you can interact with the server. For example:

```javascript
test('Challenge should be sent as soon as client connects', async () => {
  const client = new MockClient(wsServer);
  await client.connect();

  const challengeSerialized = await client.receive();
  expect(challengeSerialized).toBeInstanceOf(ArrayBuffer);
});
```

You'll find [real-world examples in relaycorp/relaynet-internet-gateway](https://github.com/relaycorp/relaynet-internet-gateway/search?l=TypeScript&q=%22%40relaycorp%2Fws-mock%22).

## Using the mock server

You basically need to initialise `MockServer` and replace the default export from `ws` with a mock WebSocket. Here's an example with Jest:

```javascript
let mockServer: MockServer;
beforeEach(() => {
  mockServer = new MockServer();
});
jest.mock('ws', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockServer.mockClientWebSocket),
}));

test('Server message should be played back', async () => {
  const clientUnderTest = new ClientUnderTest();
  const messageToEcho = 'foo';

  await Promise.all([
    clientUnderTest.connectToServerAndInteractWithIt(),
    // Configure the mock server to accept the incoming connection and return a message straightaway
    mockServer.runActions(
      new AcceptConnectionAction(),
      new SendMessageAction(messageToEcho),
    ),
  ]);

  const clientResponse = await mockServer.receive();
  expect(clientResponse).toEqual(messageToEcho);
});
```

You'll find [real-world examples in relaycorp/relaynet-poweb-js](https://github.com/relaycorp/relaynet-poweb-js/search?l=TypeScript&q=%22%40relaycorp%2Fws-mock%22).

## Using streams

When using streams in the unit under test, make sure to mock the `createWebSocketStream` function in `ws`. Here's an example with Jest:

```javascript
import { createMockWebSocketStream } from '@relaycorp/ws-mock';
import WebSocket from 'ws';

jest
  .spyOn(WebSocket, 'createWebSocketStream')
  .mockImplementation(createMockWebSocketStream);
```
