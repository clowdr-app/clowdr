export type Observer<V> = (v: V) => true | void;

export class Observable<V> {
    observers = new Map<number, Observer<V>>();
    idGenerator = 1;

    constructor(private onSubscribed?: (observer: Observer<V>) => void) {}

    public subscribe(observer: Observer<V>): () => void {
        const newId = this.idGenerator++;
        this.observers.set(newId, observer);
        this.onSubscribed?.(observer);
        return () => {
            this.observers.delete(newId);
        };
    }

    public publish(v: V): void {
        this.observers.forEach((observer, id) => {
            if (observer(v)) {
                this.observers.delete(id);
            }
        });
    }
}

export class StoredObservable<V> {
    observers = new Map<number, Observer<V>>();
    idGenerator = 1;
    private currentValue: V;

    get value(): V {
        return this.currentValue;
    }

    constructor(initialValue: V) {
        this.currentValue = initialValue;
    }

    public publish(newValue: V): void {
        if (newValue === this.currentValue) {
            return;
        }
        this.currentValue = newValue;
        this.observers.forEach((observer, id) => {
            if (observer(this.currentValue)) {
                this.observers.delete(id);
            }
        });
    }

    public subscribe(observer: Observer<V>): () => void {
        const newId = this.idGenerator++;
        this.observers.set(newId, observer);
        return () => {
            this.observers.delete(newId);
        };
    }
}
