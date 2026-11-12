require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function testFetch() {
  const scriptUrl = process.env.GOOGLE_SCRIPT_WEB_APP_URL;
  const testFilePath = path.join(__dirname, 'test_sample.png');
  const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  fs.writeFileSync(testFilePath, Buffer.from(base64Png, 'base64'));

  const payload = {
    filename: `${Date.now()}_test.png`,
    mimeType: 'image/png',
    base64: base64Png
  };

  console.log('Posting payload to:', scriptUrl);
  
  // Test manual redirect handling
  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    redirect: 'manual'
  });

  console.log('Response Status:', response.status);
  console.log('Response Location:', response.headers.get('location'));

  let finalRes = response;
  if (response.status === 302 || response.status === 301 || response.status === 307) {
    const redirectUrl = response.headers.get('location');
    if (redirectUrl) {
      console.log('Following redirect to:', redirectUrl);
      finalRes = await fetch(redirectUrl);
    }
  }

  const text = await finalRes.text();
  console.log('Raw Output:', text);

  if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
}

testFetch();
