
type Observer<T> = {
  next: (value: T) => void
  error: (error: any) => void
  complete: () => void
}

type Unsubscribable = {
  unsubscribe: () => void
}

export class Observable<T> {
  private started: boolean = false;
  private completed: boolean = false;
  private observers: Partial<Observer<T>>[] = [];
  private internalObserver: Pick<Observer<T>, 'next' | 'complete'> = {
    next: (value: T) => {
      this.observers.forEach(observer => observer.next?.(value));
    },
    complete: () => {
      this.observers.forEach(observer => observer.complete?.());
      this.completed = true;
      this.observers = [];
    }
  }

  constructor(private subscribeFn: (observer: Pick<Observer<T>, 'next' | 'complete'>) => void) {}

  public subscribe(observer: Partial<Observer<T>> | ((arg: T) => void)): Unsubscribable {
    if (typeof observer === 'function') {
      observer = { next: observer };
    }

    this.observers.push(observer);

    if (!this.started && !this.completed) {
      this.started = true;
      try {
        this.subscribeFn(this.internalObserver)
      } catch (error) {
        this.observers.forEach(obs => obs.error?.(error));
        this.completed = true;
        this.observers = [];
      }
    }

    return {
      unsubscribe: () => {
        this.observers = this.observers.filter(obs => obs !== observer);
      }
    } as Unsubscribable
  }

  public isCompleted(): boolean {
    return this.completed;
  }
}