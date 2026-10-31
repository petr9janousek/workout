// Moving data between two phones: an object ⇄ a few hundred bytes.
//
//   const bytes = await pack({ kind: 'pass', … });   // for a QR code
//   const data = await unpack(bytes);                // after scanning
//
// The bytes are JSON, squeezed with the browser's own deflate, after a 2-byte
// header ("W" and a format version) so a random QR code isn't mistaken for
// one of ours. The channel (QR today) doesn't care what's inside, so it can be
// swapped for something else later without touching the data.

const MAGIC = 0x57; // "W"
const FORMAT = 1;

async function squeeze(bytes, Stream) {
  const stream = new Blob([bytes]).stream().pipeThrough(new Stream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function pack(data) {
  const body = await squeeze(new TextEncoder().encode(JSON.stringify(data)), CompressionStream);
  const bytes = new Uint8Array(body.length + 2);
  bytes.set([MAGIC, FORMAT]);
  bytes.set(body, 2);
  return bytes;
}

// Throws an Error with a message for people when it's not ours or damaged.
export async function unpack(bytes) {
  if (bytes?.[0] !== MAGIC) throw new Error("This code isn't from the Workout app.");
  if (bytes[1] !== FORMAT) throw new Error('This code is from a newer version of the app. Update the app on this phone (reopen it) and try again.');
  try {
    return JSON.parse(new TextDecoder().decode(await squeeze(bytes.subarray(2), DecompressionStream)));
  } catch {
    throw new Error("The code couldn't be read. Try again.");
  }
}
