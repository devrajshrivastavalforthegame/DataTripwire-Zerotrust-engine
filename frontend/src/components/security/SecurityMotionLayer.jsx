import { useEffect, useRef } from "react";

const INTERACTIVE_SELECTOR =
  'a,button,input,textarea,select,[role="button"],[data-cursor-hover]';

export default function SecurityMotionLayer() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const glowRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dt-security-cursor");

    let raf = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let ringX = x;
    let ringY = y;

    const move = (event) => {
      x = event.clientX;
      y = event.clientY;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
      }

      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        ringX += (x - ringX) * 0.18;
        ringY += (y - ringY) * 0.18;

        if (ringRef.current) {
          ringRef.current.style.transform = `translate3d(${ringX}px,${ringY}px,0) translate(-50%,-50%)`;
        }
        if (glowRef.current) {
          glowRef.current.style.transform = `translate3d(${ringX}px,${ringY}px,0) translate(-50%,-50%)`;
        }
      });
    };

    const over = (event) => {
      const target = event.target?.closest?.(INTERACTIVE_SELECTOR);
      root.classList.toggle("dt-cursor-hover", Boolean(target));
    };

    const down = () => root.classList.add("dt-cursor-pressed");
    const up = () => root.classList.remove("dt-cursor-pressed");

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over, true);
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("pointerup", up, true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over, true);
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("pointerup", up, true);
      root.classList.remove("dt-security-cursor", "dt-cursor-hover", "dt-cursor-pressed");
    };
  }, []);

  return (
    <>
      <span ref={glowRef} className="security-cursor-glow" aria-hidden="true" />
      <span ref={ringRef} className="security-cursor-ring" aria-hidden="true" />
      <span ref={dotRef} className="security-cursor-dot" aria-hidden="true" />
    </>
  );
}
