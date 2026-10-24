/** Native media selection does not flatten slots. Temporarily adopt metadata nodes. */
export function adoptMediaChildren(host: HTMLElement, media: HTMLMediaElement): () => void {
  const owned = new Map<Element, Comment>();
  let alive = true;

  const prune = () => {
    for (const [node, marker] of owned) {
      if (marker.parentNode !== host) {
        if (node.parentNode === media) node.remove();
        owned.delete(node);
        continue;
      }
      if (node.parentNode !== media && node.parentNode !== host) {
        marker.remove();
        owned.delete(node);
      }
    }
  };

  const sync = () => {
    if (!alive) return;
    prune();
    let adopted = false;
    const slot =
      Array.from(media.children).find(
        (node) => node.localName === 'slot' && !node.hasAttribute('name')
      ) ?? null;
    for (const node of Array.from(host.children)) {
      if (!['source', 'track'].includes(node.localName) || node.getAttribute('slot')) continue;
      const marker = owned.get(node) ?? host.ownerDocument.createComment('sui-media-child');
      host.insertBefore(marker, node);
      owned.set(node, marker);
      media.insertBefore(node, slot);
      adopted = true;
    }
    if (adopted) {
      const ordered = Array.from(host.childNodes).flatMap((marker) =>
        Array.from(owned)
          .filter((entry) => entry[1] === marker)
          .map((entry) => entry[0])
      );
      for (const node of ordered) media.insertBefore(node, slot);
    }
  };

  const hostObserver = new MutationObserver(sync);
  const mediaObserver = new MutationObserver(prune);
  hostObserver.observe(host, { childList: true });
  mediaObserver.observe(media, { childList: true });
  sync();

  return () => {
    alive = false;
    hostObserver.disconnect();
    mediaObserver.disconnect();
    for (const [node, marker] of owned) {
      if (node.parentNode === media && marker.parentNode === host) {
        host.insertBefore(node, marker);
      } else if (node.parentNode === media) node.remove();
      marker.remove();
    }
    owned.clear();
  };
}
