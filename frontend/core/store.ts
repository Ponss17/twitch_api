type Listener<T> = (state: T) => void;

export class Store<T extends object> {
    private state: T;
    private listeners = new Set<Listener<T>>();
    private keyListeners = new Map<keyof T, Set<Listener<T>>>();

    constructor(initialState: T) {
        this.state = { ...initialState };
    }

    getState(): Readonly<T> {
        return this.state;
    }

    get<K extends keyof T>(key: K): T[K] {
        return this.state[key];
    }

    setState(partial: Partial<T>) {
        const changedKeys = Object.keys(partial) as (keyof T)[];
        this.state = { ...this.state, ...partial };

        this.listeners.forEach((fn) => fn(this.state));

        changedKeys.forEach((key) => {
            const keyFns = this.keyListeners.get(key);
            if (keyFns) {
                keyFns.forEach((fn) => fn(this.state));
            }
        });
    }

    subscribe(fn: Listener<T>): () => void {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    // Suscripción específica: solo se dispara cuando cambia una key
    on<K extends keyof T>(key: K, fn: Listener<T>): () => void {
        if (!this.keyListeners.has(key)) {
            this.keyListeners.set(key, new Set());
        }
        this.keyListeners.get(key)!.add(fn);
        return () => this.keyListeners.get(key)?.delete(fn);
    }

    reset(initialState: T) {
        this.state = { ...initialState };
        this.listeners.forEach((fn) => fn(this.state));
    }

    destroy() {
        this.listeners.clear();
        this.keyListeners.clear();
    }
}
