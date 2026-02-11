const fs = require("fs");
const path = require("path");

// Create a simple PNG with solid color and text using raw bytes
// This is a minimal approach without external dependencies

function createMinimalPNG(width, height, r, g, b) {
  // Create a simple solid color PNG
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0); // length
  ihdr.write("IHDR", 4);
  ihdr.writeUInt32BE(width, 8);
  ihdr.writeUInt32BE(height, 12);
  ihdr.writeUInt8(8, 16); // bit depth
  ihdr.writeUInt8(2, 17); // color type (RGB)
  ihdr.writeUInt8(0, 18); // compression
  ihdr.writeUInt8(0, 19); // filter
  ihdr.writeUInt8(0, 20); // interlace
  
  // Calculate CRC for IHDR
  const crc32 = require("zlib").crc32 || (() => 0);
  const ihdrCrc = crc32(ihdr.slice(4, 21));
  ihdr.writeUInt32BE(ihdrCrc >>> 0, 21);
  
  // IDAT chunk - compressed image data
  const zlib = require("zlib");
  
  // Raw image data (filter byte + RGB for each pixel)
  const rawData = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const offset = y * (1 + width * 3);
    rawData[offset] = 0; // filter type (none)
    for (let x = 0; x < width; x++) {
      const pxOffset = offset + 1 + x * 3;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
    }
  }
  
  const compressed = zlib.deflateSync(rawData);
  const idat = Buffer.alloc(12 + compressed.length);
  idat.writeUInt32BE(compressed.length, 0);
  idat.write("IDAT", 4);
  compressed.copy(idat, 8);
  const idatCrc = crc32(Buffer.concat([Buffer.from("IDAT"), compressed]));
  idat.writeUInt32BE(idatCrc >>> 0, 8 + compressed.length);
  
  // IEND chunk
  const iend = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

// Create placeholder images
const publicDir = path.join(__dirname, "../public");

// Simple solid color placeholders
const images = [
  { name: "icon.png", w: 1024, h: 1024, r: 59, g: 130, b: 246 },
  { name: "icon-192.png", w: 192, h: 192, r: 59, g: 130, b: 246 },
  { name: "icon-512.png", w: 512, h: 512, r: 59, g: 130, b: 246 },
  { name: "splash.png", w: 200, h: 200, r: 10, g: 10, b: 18 },
  { name: "hero.png", w: 500, h: 500, r: 59, g: 130, b: 246 },
  { name: "og.png", w: 1200, h: 630, r: 10, g: 10, b: 18 },
  { name: "screenshot1.png", w: 390, h: 844, r: 10, g: 10, b: 18 },
];

for (const img of images) {
  const png = createMinimalPNG(img.w, img.h, img.r, img.g, img.b);
  fs.writeFileSync(path.join(publicDir, img.name), png);
  console.log(`Created ${img.name}`);
}

console.log("Done!");
