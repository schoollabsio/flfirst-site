// https://github.com/blakeembrey/decorator-cache-getter
export interface CachePropertyDescriptor<T, R> extends PropertyDescriptor {
  get?: (this: T) => R;
}

export function cache<T, R>(
  target: object,
  name: PropertyKey,
  descriptor: CachePropertyDescriptor<T, R>
) {
  const getter = descriptor.get;

  if (!getter) throw new TypeError("Getter property descriptor expected");

  // Have to disable this check so we can intercept the method call and cache it
  // eslint-disable-next-line no-param-reassign, func-names
  descriptor.get = function (this: T) {
    const value = getter.call(this);

    Object.defineProperty(this, name, {
      configurable: descriptor.configurable,
      enumerable: descriptor.enumerable,
      writable: false,
      value,
    });

    return value;
  };
}

export const singleton = cache;
