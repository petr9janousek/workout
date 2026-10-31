import { useEffect, useRef, useState } from 'react';
import { unpack } from '../../data/transfer.js';

// Reads a code from another phone (see QrCode) with the camera, or a file
// sent instead. onData(data) gets what was in it; if it throws an Error, its
// message is shown and scanning goes on. The scanner library loads only here.
export default function ScanCode({ onData }) {
  const video = useRef(null);
  const fileInput = useRef(null);
  const handler = useRef(onData);
  handler.current = onData;
  const [message, setMessage] = useState('');
  const [camera, setCamera] = useState('starting'); // 'starting' | 'on' | 'off'

  // What a code or file contained → onData; true when it was taken.
  async function take(read) {
    try {
      await handler.current(await read());
      return true;
    } catch (err) {
      setMessage(err.message);
      return false;
    }
  }

  useEffect(() => {
    let stream = null;
    let timer = null;
    let stopped = false;
    let lastFailed = ''; // don't repeat the same error for the same code

    async function start() {
      try {
        const [{ default: jsQR }, media] = await Promise.all([
          import('jsqr'),
          navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false }),
        ]);
        stream = media;
        if (stopped) return stop();
        video.current.srcObject = stream;
        await video.current.play();
        setCamera('on');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        // The reader is picky about size: a dense code can fail at one size
        // and read fine at another, so each frame is tried at the next size.
        const sizes = [1000, 700, 500];
        let frame = 0;
        const look = async () => {
          const v = video.current;
          if (stopped || !v) return;
          if (v.videoWidth) {
            const scale = Math.min(1, sizes[frame++ % sizes.length] / Math.max(v.videoWidth, v.videoHeight));
            canvas.width = Math.round(v.videoWidth * scale);
            canvas.height = Math.round(v.videoHeight * scale);
            ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
            const found = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height, { inversionAttempts: 'dontInvert' });
            const key = found?.binaryData?.join(',');
            if (key && key !== lastFailed) {
              if (await take(() => unpack(new Uint8Array(found.binaryData)))) return stop();
              lastFailed = key;
            }
          }
          timer = setTimeout(look, 100);
        };
        look();
      } catch (err) {
        setCamera('off');
        setMessage(cameraProblem(err));
      }
    }
    function stop() {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    }

    start();
    return stop;
  }, []);

  async function openFile(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    await take(async () => {
      try {
        const data = JSON.parse(await file.text());
        if (data?.app === 'workout') return data;
      } catch {
        // not JSON: same message as below
      }
      throw new Error("This file isn't from the Workout app.");
    });
  }

  return (
    <div className="scan">
      {camera !== 'off' && (
        <div className="scan-view">
          <video ref={video} muted playsInline aria-label="Camera" />
          {camera === 'starting' && <span className="scan-note">Starting the camera…</span>}
        </div>
      )}
      {message && <p className="scan-message" role="alert">{message}</p>}
      <button className="btn-text small-link center-link" onClick={() => fileInput.current.click()}>
        Got a file instead? Open it
      </button>
      <input ref={fileInput} type="file" accept="application/json,.json,text/plain,.txt" hidden onChange={openFile} />
    </div>
  );
}

function cameraProblem(err) {
  if (err?.name === 'NotAllowedError') return "The camera is blocked for this app. Allow it in the phone's settings, or have the code sent as a file.";
  if (err?.name === 'NotFoundError' || !navigator.mediaDevices) return 'No camera found. Have the code sent as a file instead.';
  return "The camera didn't start. Have the code sent as a file instead.";
}
