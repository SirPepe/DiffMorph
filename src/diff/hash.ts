// 32 bit fnv1a hash function. Not that number inputs get stringified, making
// them return the same value as an equivalent numeric string. Concatenating
// with the sigma symbol makes to input values distinct from a single input
// value that contains the same letters, provided there's no sigma in the single
// value. This is sort of a hack, but works.
export function hash(inputs: (string | number)[]): number {
  let input = inputs.join("Ͼ");
  let hash = 2166136261;
  let nonAscii = false;
  for (let i = 0; i < input.length; i++) {
    let characterCode = input.charCodeAt(i);
    if (characterCode > 0x7f && !nonAscii) {
      input = unescape(encodeURIComponent(input));
      characterCode = input.charCodeAt(i);
      nonAscii = true;
    }
    hash ^= characterCode;
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}

export function naiveHashChain(items: { hash: number | string }[]): number {
  return hash(items.map(({ hash }) => hash));
}

// Create a hash of a list of tokens by concatenating the token's hashes and
// their *relative* offsets. The absolute coordinates are not reflected in the
// hash - two structs containing the same characters the same distances apart on
// either axis get the same hash, no matter the absolute offsets.
export function offsetHashChain(
  items: { x: number; y: number; hash: number | string }[]
): number {
  const hashes = items.flatMap((item, idx) => {
    const xDelta = idx > 0 ? item.x - items[idx - 1].x : 0;
    const yDelta = idx > 0 ? item.y - items[idx - 1].y : 0;
    return [item.hash, xDelta, yDelta];
  });
  return hash(hashes);
}

// Each function returned from this function is guaranteed to only generate each
// hash once, thus making the hashes a hash over the input and what amounts to a
// serial number.
export function createUniqueHashGenerator(): (
  inputs: (string | number)[]
) => number {
  const counter = new Map<number, number>();
  return function uniqueHash(inputs: (string | number)[]): number {
    const h = hash(inputs);
    const count = counter.get(h);
    if (typeof count === "undefined") {
      counter.set(h, 0);
      return h;
    } else {
      counter.set(h, count + 1);
      return uniqueHash([...inputs, count]);
    }
  };
}
