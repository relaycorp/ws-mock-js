# @relaycorp/ws-mock

Mock client and server to unit test the NPM package [`ws`](https://www.npmjs.com/package/ws).

## Install

```
npm install @relaycorp/ws-mock
```

## Using the mock client

You should initialise `MockWebSocketClient` by passing the WebSocket server to be tested and then call `client.connect()` to initiate the connection. From that point you can interact with the server. For example:

```javascript
  test('Challenge should be sent as soon as client connects', async () => {
    const client = new MockWebSocketClient(wsServer);
    await client.connect();

    const challengeSerialized = await client.receive();
    expect(challengeSerialized).toBeInstanceOf(ArrayBuffer);
  });
```

You'll find [real-world examples in relaycorp/relaynet-internet-gateway](https://github.com/relaycorp/relaynet-internet-gateway/search?l=TypeScript&q=%22%40relaycorp%2Fws-mock%22).
