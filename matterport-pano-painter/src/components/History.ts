
export interface IHistory {
  readonly hasPrev: boolean;
  undo(): void;
  readonly hasNext: boolean;
  redo(): void;

  onHistoryChange(observer: IHistoryObserver): void;
}

export interface IHistoryObserver {
  notify(): void;
}

export class History implements IHistory {
  private history: ICommand[] = [];
  private currIndex = -1;

  private observers: IHistoryObserver[] = [];

  /**
   * The history is undo-able
   */
  get hasPrev() {
    return this.currIndex > -1;
  }

  undo() {
    if (this.hasPrev) {
      this.history[this.currIndex].undo();
      --this.currIndex;
      this.notifyObservers();
    }
  }

  /**
   * The history has been undone at least once and can be re-done
   */
  get hasNext() {
    return (this.history.length - 1) > this.currIndex;
  }

  redo() {
    if (this.hasNext) {
      ++this.currIndex;
      this.history[this.currIndex].exec();
      this.notifyObservers();
    }
  }

  /**
   * Execute a command and add it to the history
   * @param command
   */
  exec(command: ICommand) {
    for (let i = this.history.length - 1; i > this.currIndex; --i) {
      this.history[i].dispose();
    }
    this.history.length = this.currIndex + 1;
    this.history.push(command);
    this.redo();
  }

  /**
   * Subscribe to changes in the history
   * @param cb
   */
  onHistoryChange(observer: IHistoryObserver) {
    this.observers.push(observer);
  }

  /**
   * Reverse history to square one by undoing and then disposing each command in the history
   */
  clear() {
    while (this.currIndex !== -1) {
      this.undo();
    }
    for (let i = this.history.length - 1; i > this.currIndex; --i) {
      this.history[i].dispose();
    }
    this.history.length = 0;
    this.notifyObservers();
  }

  private notifyObservers() {
    for (let i = 0, l = this.observers.length; i < l; ++i) {
      this.observers[i].notify();
    }
  }
}

export interface ICommand {
  exec(): void;
  undo(): void;
  // TODO: this probably shouldn't be here, ehh, oh well
  dispose(): void;
}
