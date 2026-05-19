/************************************************
 * BUSTER | OFFICIAL FORM HANDLER & AUTOMATION
 ************************************************/

// Rate limit window in milliseconds (10 minutes)
const RATE_LIMIT_MS = 10 * 60 * 1000;

/**
 * Checks if a key has submitted too recently.
 * Returns true if the request should be blocked.
 */
function isRateLimited(key) {
  const props = PropertiesService.getScriptProperties();
  const safeKey = 'rl_' + key.replace(/[^a-zA-Z0-9@._-]/g, '_');
  const lastStr = props.getProperty(safeKey);
  const now = Date.now();
  if (lastStr && (now - parseInt(lastStr)) < RATE_LIMIT_MS) return true;
  props.setProperty(safeKey, String(now));
  return false;
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const params = e.parameter;
  const action = params.action || params.formType;

  // HONEYPOT CHECK — bots fill hidden fields, humans don't
  if (params['bot-field'] && params['bot-field'].trim() !== '') {
    return jsonResponse({ success: true }); // Silently ignore
  }

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
    if (!params.email) return jsonResponse({ success: false, error: "Missing email" });
    if (isRateLimited('fan_' + params.email.toLowerCase())) {
      return jsonResponse({ success: true }); // Silently ignore repeat submissions
    }
    const sheet = getOrCreateSheet(ss, "Fans");
    sheet.appendRow([new Date(), params.name, params.email, params.zipCode]);
    try { sendWelcomeEmail(params.email, params.name); } catch(err) {}
    return jsonResponse({ success: true });
  }

  // 4. BOOKING REQUESTS
  if (action === "booking" || params.venue) {
    if (!params.email) return jsonResponse({ success: false, error: "Missing email" });
    if (isRateLimited('booking_' + params.email.toLowerCase())) {
      return jsonResponse({ success: false, error: "Please wait before submitting another request." });
    }
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

function sendWelcomeEmail(recipientEmail, fanName) {
  const subject = "Welcome to the Inner Circle, " + fanName + "!";
  const alias = "buster@bustertheband.com";

  const htmlTemplate = HtmlService.createTemplateFromFile("WelcomeTemplate");
  htmlTemplate.fanName = fanName;

  GmailApp.sendEmail(
    recipientEmail,
    subject,
    "Welcome to Buster, " + fanName + "!",
    {
      htmlBody: htmlTemplate.evaluate().getContent(),
      from: alias
    }
  );
}

function sendBookingAlert(venue, email, phone, message) {
  const myEmail = "buster@bustertheband.com";
  const myPhone = "8012011095@tmomail.net";

  GmailApp.sendEmail(
    myEmail,
    "NEW BOOKING REQUEST: " + venue,
    "New Booking!\n\nVENUE: " + venue + "\nCONTACT: " + email + "\nPHONE: " + phone + "\n\nDETAILS:\n" + message
  );

  GmailApp.sendEmail(
    myPhone,
    "Buster",
    "New booking request — check your email for details."
  );
}

/************************************************
 * AGENT EMAIL AUTOMATION
 ************************************************/

function installableOnEdit(e) {
  if (!e || !e.range) return;

  const sheet = e.range.getSheet();
  if (sheet.getName() !== "Agents") return;

  const row = e.range.getRow();
  if (row === 1) return;

  const values = sheet.getRange(row, 1, 1, 6).getValues()[0];

  const agentEmail = values[1];
  const agentName = values[2];
  const venueName = values[3];
  const status = values[4];

  if (!agentEmail || !agentName || !venueName || status) return;

  if (row > 2) {
    const priorEmails = sheet
      .getRange(2, 2, row - 2, 1)
      .getValues()
      .flat();

    if (priorEmails.includes(agentEmail)) {
      markStatus(sheet, row, "DUPLICATE", "#fff2cc");
      return;
    }
  }

  try {
    sendAgentEmail(agentEmail, agentName, venueName);
    sheet.getRange(row, 1).setValue(new Date());
    markStatus(sheet, row, "SENT", "#d9ead3");
  } catch (err) {
    markStatus(sheet, row, "ERROR", "#f4cccc");
    sheet.getRange(row, 6).setValue(err.message);
    throw err;
  }
}

function sendAgentEmail(agentEmail, agentName, venueName) {
  const subject = "Booking Inquiry - Buster";
  const alias = "buster@bustertheband.com";

  const template = HtmlService.createTemplateFromFile("AgentTemplate");
  template.agentName = agentName;
  template.venueName = venueName;

  GmailApp.sendEmail(
    agentEmail,
    subject,
    "Booking Inquiry",
    {
      htmlBody: template.evaluate().getContent(),
      from: alias
    }
  );
}

function markStatus(sheet, row, text, color) {
  sheet
    .getRange(row, 5)
    .setValue(text)
    .setBackground(color)
    .setFontWeight("bold");
}

/************************************************
 * UPCOMING SHOWS FAN NOTIFIER
 ************************************************/

var CALENDAR_ID = 'busterthebandslc@gmail.com';
var NOTIFIED_KEY = 'notifiedEventIds';

function checkForNewShowsAndNotify() {
  var newEvents = getNewCalendarEvents();
  if (newEvents.length === 0) {
    Logger.log('No new events found. Nothing sent.');
    return;
  }

  Logger.log('Found ' + newEvents.length + ' new event(s). Sending fan emails...');
  var allUpcomingEvents = getAllUpcomingEvents();
  var fans = getFanList();

  fans.forEach(function(fan) {
    sendShowEmail(fan.name, fan.email, allUpcomingEvents);
  });

  markEventsAsNotified(newEvents);
  Logger.log('Done. Emails sent to ' + fans.length + ' fans.');
}

function getNewCalendarEvents() {
  var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  var now = new Date();
  var oneYearOut = new Date();
  oneYearOut.setFullYear(now.getFullYear() + 1);
  var upcomingEvents = calendar.getEvents(now, oneYearOut);
  var notifiedIds = getNotifiedIds();
  return upcomingEvents.filter(function(event) {
    return notifiedIds.indexOf(event.getId()) === -1;
  });
}

function getAllUpcomingEvents() {
  var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  var now = new Date();
  var oneYearOut = new Date();
  oneYearOut.setFullYear(now.getFullYear() + 1);
  return calendar.getEvents(now, oneYearOut).map(function(event) {
    return {
      title: event.getTitle(),
      date: event.getStartTime(),
      location: event.getLocation() || '',
      description: event.getDescription() || ''
    };
  });
}

function getFanList() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Fans');
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var data = sheet.getRange(2, 2, lastRow - 1, 2).getValues();
  return data
    .filter(function(row) { return row[0] && row[1]; })
    .map(function(row) { return { name: row[0], email: row[1] }; });
}

function sendShowEmail(name, email, events) {
  var showRows = events.map(function(event) {
    var dateStr = Utilities.formatDate(event.date, 'America/Denver', 'EEEE, MMMM d, yyyy @ h:mm a');
    var location = event.location ? '<br><span style="color:#aaaaaa;">' + event.location + '</span>' : '';
    var description = event.description ? '<br><span style="color:#cccccc;font-size:13px;">' + event.description + '</span>' : '';
    return '<tr><td style="padding:14px 0;border-bottom:1px solid #2a2a2a;">'
      + '<div style="color:#e8001c;font-weight:bold;font-size:16px;">' + event.title + '</div>'
      + '<div style="color:#ffffff;font-size:14px;margin-top:4px;">' + dateStr + location + description + '</div>'
      + '</td></tr>';
  }).join('');

  var html = '<!DOCTYPE html><html><body style="margin:0;padding:0;background-color:#000000;font-family:Arial,sans-serif;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;">'
    + '<tr><td align="center" style="padding:30px 20px;">'
    + '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#111111;border:1px solid #2a2a2a;">'
    + '<tr><td style="background-color:#e8001c;padding:24px;text-align:center;">'
    + '<div style="color:#ffffff;font-size:28px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;">BUSTER</div>'
    + '<div style="color:#ffffff;font-size:12px;letter-spacing:2px;margin-top:4px;text-transform:uppercase;">Salt Lake City, UT</div>'
    + '</td></tr>'
    + '<tr><td style="padding:30px 30px 10px 30px;">'
    + '<p style="color:#ffffff;font-size:18px;margin:0;">Hey ' + name + '! \uD83E\uDD18</p>'
    + '<p style="color:#cccccc;font-size:15px;line-height:1.6;margin:14px 0 0 0;">We\'ve got some shows lined up and we want to see your face in the crowd! Here\'s what\'s coming up \u2014 mark your calendars and get ready.</p>'
    + '</td></tr>'
    + '<tr><td style="padding:10px 30px 20px 30px;">'
    + '<table width="100%" cellpadding="0" cellspacing="0">' + showRows + '</table>'
    + '</td></tr>'
    + '<tr><td style="padding:10px 30px 30px 30px;text-align:center;">'
    + '<p style="color:#cccccc;font-size:15px;line-height:1.6;">Know someone who likes to rock? Bring them along \u2014 the more the better! Share the word and check out the full schedule at:</p>'
    + '<a href="https://bustertheband.com" style="display:inline-block;margin-top:10px;padding:14px 30px;background-color:#e8001c;color:#ffffff;font-weight:bold;font-size:15px;text-decoration:none;letter-spacing:1px;text-transform:uppercase;">bustertheband.com</a>'
    + '</td></tr>'
    + '<tr><td style="background-color:#0a0a0a;padding:20px 30px;text-align:center;border-top:1px solid #2a2a2a;">'
    + '<p style="color:#555555;font-size:12px;margin:0;">You\'re receiving this because you\'re part of the Buster Inner Circle. \uD83E\uDD18<br>Salt Lake City, UT &nbsp;|&nbsp; bustertheband.com</p>'
    + '</td></tr>'
    + '</table></td></tr></table></body></html>';

  GmailApp.sendEmail(email, 'Are you ready to rock? \uD83E\uDD18', '', {
    htmlBody: html,
    from: 'buster@bustertheband.com'
  });
}

function getNotifiedIds() {
  var stored = PropertiesService.getScriptProperties().getProperty(NOTIFIED_KEY);
  return stored ? JSON.parse(stored) : [];
}

function markEventsAsNotified(events) {
  var existing = getNotifiedIds();
  var newIds = events.map(function(e) { return e.getId(); });
  var combined = existing.concat(newIds).filter(function(id, index, self) {
    return self.indexOf(id) === index;
  });
  PropertiesService.getScriptProperties().setProperty(NOTIFIED_KEY, JSON.stringify(combined));
}

function installDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'checkForNewShowsAndNotify') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('checkForNewShowsAndNotify')
    .timeBased()
    .everyDays(1)
    .atHour(16)
    .create();
  Logger.log('Daily trigger installed.');
}