# Connect the RSVP to Google Sheets

1. Create a new Google Sheet for Sara and Franklin's RSVPs.
2. In that Sheet, choose **Extensions → Apps Script**. Replace the starter code with the contents of `google-sheets-rsvp-receiver.js`.
3. Click **Deploy → New deployment → Web app**. Choose **Execute as: Me**, and set access to the appropriate guest-facing option for your event. Deploy, authorize it, then copy the URL ending in `/exec`.
4. In `script.js`, paste that URL between the quotes in:

   ```js
   const GOOGLE_SHEETS_WEB_APP_URL = '';
   ```

Each RSVP will create a row with the guest's name, attendance response, party size, and timestamp. Declines are stored with a guest count of `0`.

Tip: share the `/exec` link with the website, not the Apps Script editor link.
