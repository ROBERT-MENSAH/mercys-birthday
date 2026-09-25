/**
 * MINIMAL CHROME DEVTOOLS PROTOCOL CLIENT
 * Mercy - A Story Worth Celebrating
 *
 * A dependency-free CDP client over a raw WebSocket. The project deliberately
 * ships no npm dependencies, so this implements just enough of RFC 6455 to
 * talk to headless Chrome: a handshake, text frames, and masked client frames.
 *
 * Kept in its own module so tools/mobile-audit.js can stay readable.
 */
const net = require("net");
const crypto = require("crypto");

/**
 * Connect to a CDP WebSocket endpoint.
 * @param {string} wsUrl e.g. ws://127.0.0.1:9333/devtools/page/<id>
 */
function connect(wsUrl) {
  const url = new URL(wsUrl);
  const key = crypto.randomBytes(16).toString("base64");

  return new Promise((resolve, reject) => {
    const socket = net.connect(Number(url.port), url.hostname, () => {
      socket.write(
        `GET ${url.pathname}${url.search} HTTP/1.1\r\n` +
        `Host: ${url.host}\r\n` +
        "Upgrade: websocket\r\n" +
        "Connection: Upgrade\r\n" +
        `Sec-WebSocket-Key: ${key}\r\n` +
        "Sec-WebSocket-Version: 13\r\n\r\n"
      );
    });

    let handshake = false;
    let buffer = Buffer.alloc(0);
    const pending = new Map();
    const listeners = [];
    let nextId = 1;

    /** Decode every complete frame sitting in the buffer. */
    function drain() {
      for (;;) {
        if (buffer.length < 2) return;
        const opcode = buffer[0] & 0x0f;
        let length = buffer[1] & 0x7f;
        let offset = 2;
        if (length === 126) {
          if (buffer.length < 4) return;
          length = buffer.readUInt16BE(2);
          offset = 4;
        } else if (length === 127) {
          if (buffer.length < 10) return;
          length = Number(buffer.readBigUInt64BE(2));
          offset = 10;
        }
        if (buffer.length < offset + length) return;
        const payload = buffer.slice(offset, offset + length);
        buffer = buffer.slice(offset + length);

        if (opcode !== 0x1) continue; // text frames only
        let msg;
        try { msg = JSON.parse(payload.toString("utf8")); } catch (e) { continue; }

        if (msg.id && pending.has(msg.id)) {
          const entry = pending.get(msg.id);
          pending.delete(msg.id);
          if (msg.error) entry.reject(new Error(msg.error.message));
          else entry.resolve(msg.result);
        } else if (msg.method) {
          listeners.forEach((fn) => fn(msg));
        }
      }
    }

    socket.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (!handshake) {
        const idx = buffer.indexOf("\r\n\r\n");
        if (idx === -1) return;
        handshake = true;
        buffer = buffer.slice(idx + 4);
        resolve(api);
      }
      drain();
    });

    socket.on("error", reject);

    /** Send one masked text frame carrying a CDP command. */
    function send(method, params) {
      return new Promise((res, rej) => {
        const id = nextId++;
        pending.set(id, { resolve: res, reject: rej });
        const payload = Buffer.from(
          JSON.stringify({ id, method, params: params || {} }), "utf8");
        const mask = crypto.randomBytes(4);

        let header;
        if (payload.length < 126) {
          header = Buffer.from([0x81, 0x80 | payload.length]);
        } else if (payload.length < 65536) {
          header = Buffer.alloc(4);
          header[0] = 0x81;
          header[1] = 0x80 | 126;
          header.writeUInt16BE(payload.length, 2);
        } else {
          header = Buffer.alloc(10);
          header[0] = 0x81;
          header[1] = 0x80 | 127;
          header.writeBigUInt64BE(BigInt(payload.length), 2);
        }

        const masked = Buffer.alloc(payload.length);
        for (let i = 0; i < payload.length; i++) masked[i] = payload[i] ^ mask[i % 4];
        socket.write(Buffer.concat([header, mask, masked]));
      });
    }

    const api = {
      send,
      on: (fn) => listeners.push(fn),
      close: () => socket.end()
    };
  });
}

module.exports = { connect };
