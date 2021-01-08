export function deepClone<T>(source: T): T {
    if (source === undefined || source === null) {
        return source;
    }

    return source instanceof Array
        ? source.map((item) => deepClone(item))
        : source instanceof Date
        ? new Date(source.getTime())
        : typeof source === "object"
        ? Object.getOwnPropertyNames(source).reduce((o, prop) => {
              Object.defineProperty(o, prop, Object.getOwnPropertyDescriptor(source, prop) as PropertyDescriptor);
              o[prop] = deepClone(source[prop as keyof T]);
              return o;
          }, Object.create(Object.getPrototypeOf(source)))
        : (source as T);
}
