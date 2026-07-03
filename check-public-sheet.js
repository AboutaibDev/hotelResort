const fetch = require('node-fetch');

const SPREADSHEET_ID = '1R5JtrLjY7ogyz58jMakeHwekUEg66q1gk6iMDkoWXNw';

// Use Google's public CSV export to check the sheet (works for public sheets)
async function checkPublicSheet() {
  try {
    console.log('Checking public Google Sheet...');
    console.log('Spreadsheet ID:', SPREADSHEET_ID);
    
    // Try to get the first sheet as CSV
    const testUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv`;
    const response = await fetch(testUrl);
    
    if (response.ok) {
      console.log('\n✅ Sheet is publicly accessible!');
      console.log('To see all tabs, visit the sheet in your browser:');
      console.log(`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`);
      console.log('\nThen update GOOGLE_SHEET_ENTERTAINMENT_TAB, GOOGLE_SHEET_MENU_TAB, and GOOGLE_SHEET_REQUESTS_TAB in your .env to match the actual tab names!');
    } else {
      console.log('\n❌ Could not access sheet publicly (check sharing settings)');
    }
  } catch (error) {
    console.error('\n❌ Error checking public sheet:', error);
  }
}

checkPublicSheet();
