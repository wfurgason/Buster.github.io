/************************************************
 * BUSTER | OFFICIAL FORM HANDLER & AUTOMATION
 ************************************************/

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const params = e.parameter;
  const action = params.action || params.formType; 

  // 1. SHOW INTEREST & AUTO-REGISTRATION
  if (action === "register" || action === "interest") {
    let sheet = getOrCreateSheet(ss, "ShowInterest");
    const eventId = params.eventId;
    const eventTitle = params.eventTitle;
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 0; i < data.length; i++) {
      if (data[i][0] == eventId) { rowIndex = i + 1; break; }
    }

    if (action === "register") {
      if (rowIndex === -1) sheet.appendRow([eventId, eventTitle, 0]);
      return jsonResponse({ success: true });
    }

    if (action === "interest") {
      if (rowIndex !== -1) {
        let countRange = sheet.getRange(rowIndex, 3);
        let newCount = (Number(countRange.getValue()) || 0) + 1;
        countRange.setValue(newCount);
        return jsonResponse({ success: true, newCount: newCount });
      } else {
        sheet.appendRow([eventId, eventTitle, 1]);
        return jsonResponse({ success: true, newCount: 1 });
      }
    }
  }

  // 2. SONG POLL
  if (action === "poll" || params.favoriteSong) {
    const sheet = getOrCreateSheet(ss, "Polls");
    sheet.appendRow([new Date(), params.favoriteSong || params.song]);
    return jsonResponse({ success: true });
  }

  // 3. INNER CIRCLE
  if (action === "fan" || (params.email && params.zipCode)) {
    const sheet = getOrCreateSheet(ss, "Fans");
    sheet.appendRow([new Date(), params.name, params.email, params.zipCode]);
    try { sendWelcomeEmail(params.email, params.name); } catch(err) {}
    return jsonResponse({ success: true });
  }

  // 4. BOOKING REQUESTS
  if (action === "booking" || params.venue) {
    const sheet = getOrCreateSheet(ss, "Bookings");
    sheet.appendRow([new Date(), params.venue, params.email, params.phone, params.message]);
    try { sendBookingAlert(params.venue, params.email, params.phone, params.message); } catch(err) {}
    return jsonResponse({ success: true });
  }

  return jsonResponse({ success: false, error: "Invalid action type: " + action });
}

/**
 * GET HANDLER: Pulls Global Interest Counts and Poll Results
 * Supports JSONP to bypass CORS errors.
 */
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const action = e.parameter.action;
  let dataOut = {};

  if (action === "topSong") {
    const sheet = ss.getSheetByName("Polls");
    if (sheet) {
      const votes = sheet.getDataRange().getValues().slice(1).map(r => r[1]);
      const counts = votes.reduce((a, b) => (a[b] = (a[b] || 0) + 1, a), {});
      const maxVotes = Math.max(...Object.values(counts));
      const winners = Object.keys(counts).filter(k => counts[k] === maxVotes);
      dataOut = { success: true, topSongs: winners, tie: winners.length > 1 };
    }
  } else {
    // Default: Show Interest Counts for the Shows section
    const sheet = ss.getSheetByName("ShowInterest");
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) { dataOut[data[i][0]] = data[i][2]; }
    }
  }

  // JSONP Wrapper logic
  const callback = e.parameter.callback;
  if (callback) {
    const result = callback + "(" + JSON.stringify(dataOut) + ")";
    return ContentService.createTextOutput(result).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return jsonResponse(dataOut);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/************************************************
 * EMAIL & UTILS
 ************************************************/
function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === "Fans") sheet.appendRow(["Timestamp", "Name", "Email", "Zip Code"]); 
    if (name === "Bookings") sheet.appendRow(["Timestamp", "Venue", "Email", "Phone", "Message"]);
    if (name === "Polls") sheet.appendRow(["Timestamp", "Song Choice"]);
    if (name === "ShowInterest") sheet.appendRow(["ShowID", "ShowTitle", "InterestCount"]);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function sendWelcomeEmail(recipientEmail, name) {
  const subject = `Welcome to the Inner Circle, ${name}!`;
  const alias = "buster@bustertheband.com";
  const htmlTemplate = HtmlService.createTemplateFromFile('WelcomeTemplate');
  htmlTemplate.fanName = name;
  GmailApp.sendEmail(recipientEmail, subject, `Welcome to Buster, ${name}!`, { htmlBody: htmlTemplate.evaluate().getContent(), from: alias });
}

function sendBookingAlert(venue, email, phone, message) {
  const myEmail = "busterthebandslc@gmail.com";
  try { GmailApp.sendEmail(myEmail, `NEW BOOKING REQUEST: ${venue}`, `New Booking!\n\nVENUE: ${venue}\nCONTACT: ${email}\nPHONE: ${phone}\n\nDETAILS:\n${message}`); } catch(e){}
}