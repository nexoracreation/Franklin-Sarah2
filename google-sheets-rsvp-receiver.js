function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // ─────────────────────────────────────────────────────────────
    // BRANCH 1: Sarah & Franklin (Sangeet & Wedding Reception Site)
    // ─────────────────────────────────────────────────────────────
    if (data.source === "sangeet-wedding-site" || data.source === "sangeet-site") {
      var isAttending = (data.attending === "yes" || data.attendance === "attending");
      
      // If declining, skip completely as requested
      if (!isAttending) {
        return ContentService.createTextOutput(JSON.stringify({ "result": "success", "skipped": "declined" }))
                             .setMimeType(ContentService.MimeType.JSON);
      }

      // Dedicated separate tab/slide for this website
      var tabName = "Sarah & Franklin (Sangeet & Wedding)";
      var sheetSF = ss.getSheetByName(tabName) || ss.insertSheet(tabName);

      // Create headers if tab is brand new
      if (sheetSF.getLastRow() === 0) {
        sheetSF.appendRow([
          "Timestamp",
          "Name",
          "Phone",
          "Attending",
          "Total Guests"
        ]);
        sheetSF.getRange("A1:E1")
               .setFontWeight("bold")
               .setBackground("#ff4f8b")
               .setFontColor("#ffffff")
               .setHorizontalAlignment("center");
      }

      // Append attendee record
      sheetSF.appendRow([
        new Date(),
        data.name || "",
        data.phone || "",
        "Yes",
        data.guestCount || 1
      ]);

      // Format attendance cell
      sheetSF.getRange(sheetSF.getLastRow(), 4)
             .setHorizontalAlignment("center")
             .setFontWeight("bold")
             .setFontColor("#27ae60");

      return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }

    // ─────────────────────────────────────────────────────────────
    // BRANCH 2: Your Other Website (Accepted / Declined Guests tabs)
    // ─────────────────────────────────────────────────────────────
    var name = data.name;
    var phone = data.phone || "";
    var attending = data.attending; // "yes" or "no"
    var events = data.events || []; // array of values like "grooms-eve", "brides-eve", "church", "reception"
    var message = data.message || "";
    var timestamp = new Date();

    var sheet;
    if (attending === "yes") {
      sheet = ss.getSheetByName("Accepted Guests") || ss.insertSheet("Accepted Guests");

      // Ensure headers are present
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          "Timestamp", 
          "Name", 
          "Phone", 
          "Attending", 
          "Groom's Wedding Eve", 
          "Bride's Wedding Eve", 
          "Holy Matrimony", 
          "Grand Reception", 
          "Message"
        ]);
        sheet.getRange("A1:I1").setFontWeight("bold").setBackground("#faf5e8").setFontColor("#9c7c38").setHorizontalAlignment("center");
      }

      // Map event selection to tick (✓) or cross (✗)
      var groomsEve = events.indexOf("grooms-eve") !== -1 ? "✓" : "✗";
      var bridesEve = events.indexOf("brides-eve") !== -1 ? "✓" : "✗";
      var church = events.indexOf("church") !== -1 ? "✓" : "✗";
      var reception = events.indexOf("reception") !== -1 ? "✓" : "✗";

      // Append row
      sheet.appendRow([
        timestamp, 
        name, 
        phone, 
        "Yes", 
        groomsEve, 
        bridesEve, 
        church, 
        reception, 
        message
      ]);

      // Format the tick/cross marks with colors (Green for ✓, Red for ✗)
      var lastRow = sheet.getLastRow();
      var range = sheet.getRange(lastRow, 5, 1, 4); // Columns E, F, G, H for the last row
      var values = range.getValues()[0];

      for (var col = 0; col < 4; col++) {
        var cell = range.getCell(1, col + 1);
        cell.setHorizontalAlignment("center").setFontWeight("bold");
        if (values[col] === "✓") {
          cell.setFontColor("#27ae60"); // Green
        } else {
          cell.setFontColor("#c0392b"); // Red
        }
      }

    } else {
      sheet = ss.getSheetByName("Declined Guests") || ss.insertSheet("Declined Guests");
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Timestamp", "Name", "Phone", "Attending", "Message"]);
        sheet.getRange("A1:E1").setFontWeight("bold").setBackground("#f2f5f1").setFontColor("#6e7d69").setHorizontalAlignment("center");
      }
      sheet.appendRow([timestamp, name, phone, "No", message]);
      sheet.getRange(sheet.getLastRow(), 4).setHorizontalAlignment("center").setFontWeight("bold").setFontColor("#c0392b");
    }

    // Clean up empty default sheet if it exists
    var sheet1 = ss.getSheetByName("Sheet1");
    if (sheet1 && sheet1.getLastRow() === 0 && ss.getSheets().length > 1) {
      ss.deleteSheet(sheet1);
    }

    return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}
