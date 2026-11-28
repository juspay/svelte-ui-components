// Helpers shared by every case file.
export const stack = import.meta.env.VITE_STACK;

const describe = (value) => {
  if (value instanceof Event) {
    if (value instanceof CustomEvent) {
      return { custom: value.type, detail: describe(value.detail) };
    }
    return { native: value.type };
  }
  if (value === undefined) {
    return '__undefined__';
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(describe);
  }
  const out = {};
  for (const key of Object.keys(value).sort()) {
    out[key] = describe(value[key]);
  }
  return out;
};

/** Returns a handler that records the event name and its payload for the cross-stack comparison. */
export const log = (name) => (event) => {
  window.__events.push([name, describe(event)]);
};

/** Records an arbitrary observation (for example a bound value after an interaction). */
export const note = (name, value) => {
  window.__events.push([name, describe(value)]);
};

// A 24x24 solid teal PNG and a small SVG, inlined so no case touches the network.
export const png =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAIElEQVR42mNgaPj/n5aYYdSCUQtGLRi1YNSCUQuGqwUA2pL6ULi6eLQAAAAASUVORK5CYII=';
export const svg =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#c2410c"/></svg>'
  );
