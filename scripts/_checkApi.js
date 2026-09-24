const { Jimp } = require('jimp');
(async () => {
  const img = new Jimp({ width: 100, height: 100, color: 0xff0000ff });
  console.log('resize method:', typeof img.resize);
  // Test resize with object arg
  try {
    img.resize({ w: 50, h: 50 });
    console.log('resize({w,h}) works, size:', img.bitmap.width, img.bitmap.height);
  } catch(e) {
    console.log('resize({w,h}) failed:', e.message);
    // try positional
    try {
      const img2 = new Jimp({ width: 100, height: 100, color: 0xff0000ff });
      img2.resize(50, 50);
      console.log('resize(w,h) works, size:', img2.bitmap.width, img2.bitmap.height);
    } catch(e2) {
      console.log('resize(w,h) also failed:', e2.message);
    }
  }
  console.log('AUTO constant:', Jimp.AUTO);
  // test greyscale
  try { img.greyscale(); console.log('greyscale() ok'); } catch(e) { console.log('greyscale err:', e.message); }
  // test blur
  try { const img3 = new Jimp({width:10,height:10,color:0xff0000ff}); img3.blur(3); console.log('blur(3) ok'); } catch(e) { console.log('blur err:', e.message); }
  // test brightness
  try { const img4 = new Jimp({width:10,height:10,color:0xff0000ff}); img4.brightness(0.2); console.log('brightness(0.2) ok'); } catch(e) { console.log('brightness err:', e.message); }
  // test sepia
  try { const img5 = new Jimp({width:10,height:10,color:0xff0000ff}); img5.sepia(); console.log('sepia() ok'); } catch(e) { console.log('sepia err:', e.message); }
})();
