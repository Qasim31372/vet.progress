const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Upload file to Google Drive using Google Apps Script Web App
 */
async function uploadViaGoogleAppsScript(file, scriptUrl) {
  const fileBuffer = fs.readFileSync(file.path);
  const base64Data = fileBuffer.toString('base64');

  const payload = {
    filename: `${Date.now()}_${file.originalname}`,
    mimeType: file.mimetype,
    base64: base64Data,
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || ''
  };

  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    redirect: 'manual'
  });

  let finalRes = response;
  if (response.status === 302 || response.status === 301 || response.status === 307) {
    const redirectUrl = response.headers.get('location');
    if (redirectUrl) {
      finalRes = await fetch(redirectUrl);
    }
  }

  const responseText = await finalRes.text();

  if (finalRes.status === 401 || responseText.includes('Unable to open the file') || responseText.includes('<!DOCTYPE html>')) {
    throw new Error("Google Apps Script Permission Error: Please set 'Who has access' to 'Anyone' in your Apps Script Deployment settings.");
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (parseErr) {
    throw new Error('Invalid JSON response from Google Apps Script Web App: ' + responseText.substring(0, 100));
  }

  if (fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }

  if (data.status === 'success' && data.fileId) {
    return {
      url: `https://lh3.googleusercontent.com/d/${data.fileId}`,
      driveFileId: data.fileId,
      isDrive: true,
      originalName: file.originalname
    };
  } else if (data.url) {
    return {
      url: data.url,
      driveFileId: data.fileId || null,
      isDrive: true,
      originalName: file.originalname
    };
  }

  throw new Error(data.error || 'Google Apps Script upload returned failure.');
}

/**
 * Upload & Sync Database JSON Payload (Doctors, Admins, Cases) to Google Drive
 */
async function syncDatabaseToDrive(data) {
  const scriptUrl = process.env.GOOGLE_SCRIPT_WEB_APP_URL;
  if (!scriptUrl || !scriptUrl.startsWith('http')) return;

  try {
    const jsonString = JSON.stringify(data, null, 2);
    const base64Data = Buffer.from(jsonString, 'utf8').toString('base64');

    const payload = {
      filename: `veterinary_portal_database.json`,
      mimeType: 'application/json',
      base64: base64Data,
      folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || ''
    };

    console.log('[Google Drive Sync] Backing up Doctor, Admin, & Case Database to Google Drive...');

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'manual'
    });

    let finalRes = response;
    if (response.status === 302 || response.status === 301 || response.status === 307) {
      const redirectUrl = response.headers.get('location');
      if (redirectUrl) {
        finalRes = await fetch(redirectUrl);
      }
    }

    const resText = await finalRes.text();
    const parsed = JSON.parse(resText);
    if (parsed.status === 'success') {
      console.log(`[Google Drive Sync SUCCESS] Full Database synced to Google Drive! File ID: ${parsed.fileId}`);
    }
  } catch (err) {
    console.error('[Google Drive DB Sync Error]:', err.message);
  }
}

/**
 * Retrieve & Restore Database JSON Payload from Google Drive
 */
async function fetchDatabaseFromDrive() {
  const scriptUrl = process.env.GOOGLE_SCRIPT_WEB_APP_URL;
  if (!scriptUrl || !scriptUrl.startsWith('http')) return null;

  try {
    console.log('[Google Drive Sync] Fetching database backup from Google Drive...');

    const payload = { action: 'get_database' };
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'manual'
    });

    let finalRes = response;
    if (response.status === 302 || response.status === 301 || response.status === 307) {
      const redirectUrl = response.headers.get('location');
      if (redirectUrl) {
        finalRes = await fetch(redirectUrl);
      }
    }

    const resText = await finalRes.text();
    const parsed = JSON.parse(resText);
    if (parsed.status === 'success' && parsed.data) {
      console.log('[Google Drive Sync SUCCESS] Successfully restored database from Google Drive!');
      return parsed.data;
    }
  } catch (err) {
    console.error('[Google Drive DB Fetch Error]:', err.message);
  }
  return null;
}

/**
 * Upload file to Google Drive using Service Account JSON Key
 */
async function uploadViaServiceAccount(file, keyPath, folderId) {
  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/drive']
  });

  const drive = google.drive({ version: 'v3', auth });

  const fileMetadata = {
    name: `${Date.now()}_${file.originalname}`,
    parents: folderId ? [folderId] : []
  };

  const media = {
    mimeType: file.mimetype,
    body: fs.createReadStream(file.path)
  };

  const res = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id, webViewLink'
  });

  const fileId = res.data.id;

  await drive.permissions.create({
    fileId: fileId,
    requestBody: { role: 'reader', type: 'anyone' }
  });

  if (fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }

  return {
    url: `https://lh3.googleusercontent.com/d/${fileId}`,
    driveFileId: fileId,
    isDrive: true,
    originalName: file.originalname
  };
}

/**
 * Upload file to Google Drive using OAuth2 Refresh Token
 */
async function uploadViaOAuth2(file) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
  );

  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  const drive = google.drive({ version: 'v3', auth });

  const fileMetadata = {
    name: `${Date.now()}_${file.originalname}`,
    parents: process.env.GOOGLE_DRIVE_FOLDER_ID ? [process.env.GOOGLE_DRIVE_FOLDER_ID] : []
  };

  const media = {
    mimeType: file.mimetype,
    body: fs.createReadStream(file.path)
  };

  const res = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id, webViewLink'
  });

  const fileId = res.data.id;

  await drive.permissions.create({
    fileId: fileId,
    requestBody: { role: 'reader', type: 'anyone' }
  });

  if (fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }

  return {
    url: `https://lh3.googleusercontent.com/d/${fileId}`,
    driveFileId: fileId,
    isDrive: true,
    originalName: file.originalname
  };
}

/**
 * Main Upload Router - Tries Direct Google Drive Methods
 */
async function uploadFile(file) {
  const scriptUrl = process.env.GOOGLE_SCRIPT_WEB_APP_URL;
  if (scriptUrl && scriptUrl.startsWith('http')) {
    try {
      console.log(`[Google Drive] Uploading ${file.originalname} via Google Apps Script Web App...`);
      return await uploadViaGoogleAppsScript(file, scriptUrl);
    } catch (err) {
      console.error('[Google Apps Script Drive Upload Error]:', err.message);
    }
  }

  const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || path.join(__dirname, 'google-service-account.json');
  if (fs.existsSync(serviceAccountPath)) {
    try {
      console.log(`[Google Drive] Uploading ${file.originalname} via Service Account...`);
      return await uploadViaServiceAccount(file, serviceAccountPath, process.env.GOOGLE_DRIVE_FOLDER_ID);
    } catch (err) {
      console.error('[Service Account Drive Upload Error]:', err.message);
    }
  }

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REFRESH_TOKEN) {
    try {
      console.log(`[Google Drive] Uploading ${file.originalname} via OAuth2...`);
      return await uploadViaOAuth2(file);
    } catch (err) {
      console.error('[OAuth2 Drive Upload Error]:', err.message);
    }
  }

  console.log(`[Local Upload] Saving ${file.originalname} locally in /uploads...`);
  const destFilename = `${Date.now()}_${path.basename(file.originalname).replace(/\s+/g, '_')}`;
  const destPath = path.join(UPLOADS_DIR, destFilename);

  if (file.path && fs.existsSync(file.path)) {
    fs.renameSync(file.path, destPath);
  } else if (file.buffer) {
    fs.writeFileSync(destPath, file.buffer);
  }

  return {
    url: `/uploads/${destFilename}`,
    driveFileId: null,
    isDrive: false,
    originalName: file.originalname
  };
}

module.exports = {
  uploadFile,
  syncDatabaseToDrive,
  fetchDatabaseFromDrive
};
