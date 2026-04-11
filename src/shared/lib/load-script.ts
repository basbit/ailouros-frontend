export function loadScript(src: string, crossOrigin?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    if (crossOrigin) {
      s.crossOrigin = crossOrigin;
    }
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`load ${src}`));
    document.body.appendChild(s);
  });
}
