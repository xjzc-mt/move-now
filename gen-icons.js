const { app, BrowserWindow, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 44,
    height: 44,
    show: false,
    transparent: true,
    webPreferences: { offscreen: true }
  });

  const svgPath = path.join(__dirname, 'assets', 'tray-icon.svg');
  const svgData = fs.readFileSync(svgPath, 'utf8');
  const html = `
    <html>
      <body style="margin:0;padding:0;background:transparent;overflow:hidden;display:flex;align-items:center;justify-content:center;">
        ${svgData}
      </body>
    </html>
  `;
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  
  // Wait a moment for render
  setTimeout(async () => {
    const image = await win.capturePage();
    const pngBuffer = image.toPNG();
    fs.writeFileSync(path.join(__dirname, 'assets', 'tray-iconTemplate@2x.png'), pngBuffer);
    
    // Also 22x22
    const resized = image.resize({ width: 22, height: 22 });
    fs.writeFileSync(path.join(__dirname, 'assets', 'tray-iconTemplate.png'), resized.toPNG());
    console.log('Tray icons generated successfully!');
    app.quit();
  }, 300);
});
