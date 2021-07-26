import { Data as WSData } from 'ws';

export interface PingOrPong {
  readonly data?: WSData;
  readonly mask?: boolean;
  readonly cb?: (err?: Error) => void;
  readonly date: Date;
}
