/************************************************
 * BUSTER | OFFICIAL FORM HANDLER & AUTOMATION
 ************************************************/

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const params = e.parameter;
  // This captures 'action' from your manual JS or 'formType' from your HTML forms
  const action = params.action || params.formType; 

  // ==========================================
  // 1. SHOW INTEREST & AUTO-REGISTRATION
  // =========================-================
  if (action === "register" || action === "interest") {
    let sheet = getOrCreateSheet(ss, "ShowInterest");
    const eventId = params.eventId;
    const eventTitle = params.eventTitle;
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    // Find if the show is already in the sheet
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] == eventId) { 
        rowIndex = i + 1; 
        break; 
      }
    }

    // If page just loaded, ensure the show is registered
    if (action === "register") {
      if (rowIndex === -1) {
        sheet.appendRow([eventId, eventTitle, 0]);
      }
      return jsonResponse({ success: true });
    }

    // If fan clicked 'Interested', increment the count
    if (action === "interest") {
      if (rowIndex !== -1) {
        let countRange = sheet.getRange(rowIndex, 3);
        let newCount = (Number(countRange.getValue()) || 0) + 1;
        countRange.setValue(newCount);
        return jsonResponse({ success: true, newCount: newCount });
      } else {
        // Fallback: If show wasn't registered yet, add it now with 1
        sheet.appendRow([eventId, eventTitle, 1]);
        return jsonResponse({ success: true, newCount: 1 });
      }
    }
  }

  // ==========================================
  // 2. SONG POLL (CAST YOUR VOTE)
  // ==========================================
  if (action === "poll" || params.favoriteSong) {
    const sheet = getOrCreateSheet(ss, "Polls");
    sheet.appendRow([new Date(), params.favoriteSong || params.song]);
    return jsonResponse({ success: true });
  }

  // ==========================================
  // 3. INNER CIRCLE (MAILING LIST)
  // ==========================================
  if (action === "fan" || (params.email && params.zipCode)) {
    const sheet = getOrCreateSheet(ss, "Fans");
    sheet.appendRow([new Date(), params.name, params.email, params.zipCode]);
    
    // Attempt to send the welcome email automations
    try { sendWelcomeEmail(params.email, params.name); } catch(err) { console.log("Email error: " + err); }
    
    return jsonResponse({ success: true });
  }

  // ==========================================
  // 4. BOOKING REQUESTS
  // ==========================================
  if (action === "booking" || params.venue) {
    const sheet = getOrCreateSheet(ss, "Bookings");
    sheet.appendRow([new Date(), params.venue, params.email, params.phone, params.message]);
    
    // Send alerts to the band
    try { sendBookingAlert(params.venue, params.email, params.phone, params.message); } catch(err) { console.log("Alert error: " + err); }
    
    return jsonResponse({ success: true });
  }

  // FALLBACK: If no action matched
  return jsonResponse({ success: false, error: "Invalid action type: " + action });
}

/************************************************
 * EMAIL & UTILS (PRESERVED)
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