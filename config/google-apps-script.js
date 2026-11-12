/**
 * -------------------------------------------------------------------------
 * GOOGLE APPS SCRIPT CODE WITH DIRECT DRIVE SAVE & RETRIEVAL
 * (گوگل ڈرائیو محفوظ کرنے اور واپس ڈاؤن لوڈ/لوڈ کرنے کا مکمل کوڈ)
 * -------------------------------------------------------------------------
 */

function doGet(e) {
  try {
    var action = e.parameter ? e.parameter.action : null;
    if (action === "get_database") {
      var files = DriveApp.getFilesByName("veterinary_portal_database.json");
      if (files.hasNext()) {
        var file = files.next();
        var content = file.getBlob().getDataAsString();
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          data: JSON.parse(content)
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({
          status: "not_found",
          message: "No database backup found on Drive yet."
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "online",
      message: "Google Apps Script Web App is active and ready for uploads & retrieval!"
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Retrieve database from Drive
    if (data.action === "get_database") {
      var files = DriveApp.getFilesByName("veterinary_portal_database.json");
      if (files.hasNext()) {
        var file = files.next();
        var content = file.getBlob().getDataAsString();
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          data: JSON.parse(content)
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({
          status: "not_found",
          message: "No database backup found on Drive yet."
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    var folderId = data.folderId || ""; 
    var folder;

    if (folderId && folderId.trim() !== "") {
      folder = DriveApp.getFolderById(folderId);
    } else {
      folder = DriveApp.getRootFolder();
    }

    // Overwrite previous database file to keep single clean backup
    if (data.filename === "veterinary_portal_database.json") {
      var existing = folder.getFilesByName("veterinary_portal_database.json");
      while (existing.hasNext()) {
        var oldFile = existing.next();
        oldFile.setTrashed(true);
      }
    }

    var bytes = Utilities.base64Decode(data.base64);
    var blob = Utilities.newBlob(bytes, data.mimeType, data.filename);
    var file = folder.createFile(blob);

    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileId = file.getId();
    var result = {
      status: "success",
      fileId: fileId,
      url: "https://lh3.googleusercontent.com/d/" + fileId
    };

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    var errResult = {
      status: "error",
      error: error.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
