// tslint:disable:max-classes-per-file

import { Data } from 'ws';
import { CloseFrame } from './CloseFrame';
import { MockServer } from './MockServer';

export abstract class MockServerAction {
  // tslint:disable-next-line:readonly-keyword
  protected _wasRun = false;

  get wasRun(): boolean {
    return this._wasRun;
  }

  public async run(_mockServer: MockServer): Promise<void> {
    // tslint:disable-next-line:no-object-mutation
    this._wasRun = true;
  }
}

export class AcceptConnectionAction extends MockServerAction {
  public async run(mockServer: MockServer): Promise<void> {
    await mockServer.acceptConnection();
    await super.run(mockServer);
  }
}

export class CloseConnectionAction extends MockServerAction {
  constructor(protected readonly closeFrame?: CloseFrame) {
    super();
  }

  public async run(mockServer: MockServer): Promise<void> {
    await mockServer.close(this.closeFrame?.code, this.closeFrame?.reason);
    await super.run(mockServer);
  }
}

export class SendMessageAction extends MockServerAction {
  constructor(protected readonly message: Data) {
    super();
  }

  public async run(mockServer: MockServer): Promise<void> {
    await mockServer.send(this.message);
    await super.run(mockServer);
  }
}
