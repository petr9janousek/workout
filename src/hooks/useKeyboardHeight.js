import { useEffect, useState } from 'react';

// How much of the screen the on-screen keyboard covers, in CSS pixels (0
// when it's closed). Phones don't move fixed things (like the rest timer)
// above the keyboard by themselves; the visual viewport is the part of the
// page you can still see, so whatever is missing below it is the keyboard.
export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const covered = window.innerHeight - vv.height - vv.offsetTop;
      setHeight(covered > 80 ? Math.round(covered) : 0); // small gaps are toolbars, not a keyboard
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);
  return height;
}
