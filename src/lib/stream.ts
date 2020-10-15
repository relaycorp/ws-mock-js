import { Duplex } from 'stream';
import WebSocket from 'ws';
import { MockWebSocket } from './MockWebSocket';

export function createMockWebSocketStream(ws: WebSocket): Duplex {
  const mockWS = ws as any;
  if (!(mockWS instanceof MockWebSocket)) {
    throw new Error('WebSocket must be a mock one');
  }
  return (mockWS as MockWebSocket).makeDuplex();
}
