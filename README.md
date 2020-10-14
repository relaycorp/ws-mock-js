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

Simply initialise `MockServer` with the `ws` client connection you wish to test. For example:

```javascript
  test('Server message should be played back', async () => {
    const mockConnection = new MockConnection();
    const mockServer = new MockServer(mockConnection);
    const clientUnderTest = new ClientUnderTest(mockConnection);

    clientUnderTest.connectToServer();
    mockServer.send('foo');

    const clientResponse = await mockServer.receive();
    expect(clientResponse).toEqual('foo');
  });
```

You'll find [real-world examples in relaycorp/relaynet-poweb-js](https://github.com/relaycorp/relaynet-poweb-js/search?l=TypeScript&q=%22%40relaycorp%2Fws-mock%22).
