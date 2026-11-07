import { useEffect, useRef, useState } from "react";

/* Load the WebGL scene only as this section approaches the viewport. */
export default function ConnectionSculpture({ en = false }) {
  const hostRef = useRef(null), canvasRef = useRef(null), sceneRef = useRef(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const host = hostRef.current;
    let disposed = false, loading = false;
    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting || loading) return;
      loading = true; observer.disconnect();
      try {
        const { createReliefScene } = await import("./ReliefScene");
        if (!disposed) sceneRef.current = createReliefScene(host, canvasRef.current);
      } catch {
        if (!disposed) host.dataset.renderer = "fallback";
      }
    }, { rootMargin: "400px 0px" });
    observer.observe(host);
    return () => { disposed = true; observer.disconnect(); sceneRef.current?.dispose(); sceneRef.current = null; };
  }, []);
  useEffect(() => {
    hostRef.current.dataset.paused = String(paused);
    sceneRef.current?.setPaused(paused);
  }, [paused]);
  return <div ref={hostRef} className="ih-sculpture-art" data-concept="typographic-relief" data-renderer="loading" data-paused={String(paused)}>
    <span className="ih-relief-fallback" role="img" aria-label="IdeaHire" data-no-translate="true">IdeaHire</span>
    <canvas ref={canvasRef} aria-hidden="true" />
    <button className="ih-relief-motion" type="button" aria-pressed={paused} onClick={() => setPaused(value => !value)}>
      {paused ? (en ? "Resume motion" : "Wznów animację") : (en ? "Pause motion" : "Zatrzymaj animację")}
    </button>
  </div>;
}
