import { VError } from 'verror';

export class MockWSError extends VError {
  override get name(): string {
    return this.constructor.name;
  }
}
