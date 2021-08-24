interface HTMLVideoElement {
    captureStream?(frameRate?: number): MediaStream;
    mozCaptureStream?(frameRate?: number): MediaStream;
}

// eslint-disable-next-line @typescript-eslint/ban-types
interface WeakRef<T extends object> {
    readonly [Symbol.toStringTag]: "WeakRef";

    /**
     * Returns the WeakRef instance's target object, or undefined if the target object has been
     * reclaimed.
     */
    deref(): T | undefined;
}

interface WeakRefConstructor {
    readonly prototype: WeakRef<any>;

    /**
     * Creates a WeakRef instance for the given target object.
     * @param target The target object for the WeakRef instance.
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    new <T extends object>(target?: T): WeakRef<T>;
}

let WeakRef: WeakRefConstructor;
