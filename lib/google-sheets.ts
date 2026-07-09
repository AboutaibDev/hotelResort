import { google } from "googleapis";

// Extract spreadsheet ID from URL
const SPREADSHEET_ID = "1R5JtrLjY7ogyz58jMakeHwekUEg66q1gk6iMDkoWXNw";

// Tab names (using environment variables)
export const TAB_NAMES = {
  entertainment: process.env.GOOGLE_SHEET_ENTERTAINMENT_TAB || "Entertainment",
  menu: process.env.GOOGLE_SHEET_MENU_TAB || "Menu",
  requests: process.env.GOOGLE_SHEET_REQUESTS_TAB || "Requests",
};

// Helper to get Google Sheets client (for write operations)
async function getAuthenticatedSheetsClient() {
  // Safely handle private key with proper newline parsing
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
    ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n").replace(/"/g, "")
    : "";

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  return sheets;
}

// Helper to get Google Sheets client for read-only (can use API key)
async function getReadOnlySheetsClient() {
  // If API key is available, use that for simpler read access
  if (process.env.GOOGLE_API_KEY) {
    return google.sheets({ version: "v4", auth: process.env.GOOGLE_API_KEY });
  }
  
  // Fall back to service account if available
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return getAuthenticatedSheetsClient();
  }

  throw new Error("No Google Sheets credentials available for read access");
}

// Helper to parse Google Sheets date to YYYY-MM-DD format (local time)
function parseGoogleSheetDate(dateStr: string): string {
  if (!dateStr) return "";
  
  // Try to parse date (handles both MM/DD/YYYY and YYYY/MM/DD formats)
  const parts = dateStr.split(/[\/\-]/);
  if (parts.length === 3) {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);
    
    let year: number, month: number, day: number;
    
    // Detect format: if first part > 31, it's YYYY/MM/DD
    // Otherwise, it's MM/DD/YYYY
    if (p0 > 31) {
      // YYYY/MM/DD format
      year = p0;
      month = p1 - 1; // months are 0-indexed in JS
      day = p2;
    } else if (p2 > 31) {
      // DD/MM/YYYY format (if needed in future)
      year = p2;
      month = p1 - 1;
      day = p0;
    } else {
      // MM/DD/YYYY format (most common in US)
      year = p2;
      month = p0 - 1;
      day = p1;
    }
    
    // Handle 2-digit years
    if (year < 100) {
      year = 2000 + year;
    }
    
    // Create date in local timezone
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      // Format as YYYY-MM-DD in local time
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  
  // Fallback: try parsing as ISO date
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) {
    // Format as YYYY-MM-DD in local time
    const y = isoDate.getFullYear();
    const m = String(isoDate.getMonth() + 1).padStart(2, '0');
    const d = String(isoDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  
  // Return original string if all parsing fails
  return dateStr;
}

// Helper to parse time string to HH:MM format (for input type="time")
function parseTimeTo24h(timeStr: string): string {
  if (!timeStr) return "";
  
  // If already in HH:MM format, return as is
  if (/^\d{1,2}:\d{2}$/.test(timeStr.trim())) {
    const [h, m] = timeStr.trim().split(':');
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  }
  
  // Parse from 12h format (e.g., "11:15 AM")
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = (match[3] || "").toUpperCase();
    
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  
  return timeStr;
}

// Helper to format time from HH:MM to 12h format (e.g., "11:15 AM")
function formatTimeTo12h(timeStr: string): string {
  if (!timeStr) return "";
  
  // If already in 12h format, return as is
  if (/AM|PM/i.test(timeStr)) return timeStr;
  
  // Parse from HH:MM format
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = hours >= 12 ? "PM" : "AM";
    
    hours = hours % 12;
    if (hours === 0) hours = 12;
    
    return `${hours}:${String(minutes).padStart(2, '0')} ${period}`;
  }
  
  return timeStr;
}

// Read all rows from a specific tab
export async function readSheetRows(tabName: string) {
  try {
    const sheets = await getReadOnlySheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tabName}!A:Z`,
    });

    const rows = response.data.values || [];
    if (rows.length < 2) return [];

    const headers = rows[0];
    let validRowIndex = 0;
    return rows.slice(1).filter(row => {
      // Skip empty or almost empty rows
      const trimmedRow = row.map(cell => (cell || "").trim());
      const hasImportantData = trimmedRow.some(cell => 
        cell.length > 1 && cell !== "." && cell !== "-"
      );
      return hasImportantData;
    }).map((row) => {
      validRowIndex++;
      const obj: any = { id: validRowIndex };
      
      headers.forEach((header, i) => {
        const value = row[i] || "";
        // Normalize header name to match what UI expects
        let normalizedHeader = header.toLowerCase();
        
        // Map to exact field names
        if (normalizedHeader === "date") obj.date = parseGoogleSheetDate(value);
        else if (normalizedHeader === "activity") obj.activity = value;
        else if (normalizedHeader === "time") obj.time = parseTimeTo24h(value); // Parse time to 24h for UI
        else if (normalizedHeader === "description") obj.description = value;
        else if (normalizedHeader === "registration") obj.registration = value;
        else if (normalizedHeader === "meal") obj.meal = value;
        else if (normalizedHeader === "title") obj.title = value;
        else if (normalizedHeader === "id") obj.guest_id = value;
        else if (normalizedHeader === "request type" || normalizedHeader === "request_type") obj.request_type = value;
        else if (normalizedHeader === "status") obj.status = value;
        else {
          // Keep original header as fallback
          obj[header] = value;
        }
      });
      
      return obj;
    });
  } catch (error) {
    console.error("Error reading Google Sheet:", error);
    return [];
  }
}

// Helper to get all rows with their actual positions in the sheet
async function getRowsWithPositions(tabName: string) {
  const sheets = await getAuthenticatedSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tabName}!A:Z`,
  });

  const allRows = response.data.values || [];
  if (allRows.length === 0) {
    return { headers: [], validRows: [], allRows: [] };
  }

  const headers = allRows[0];
  if (allRows.length < 2) {
    return { headers, validRows: [], allRows };
  }
  const validRows = [];

  for (let i = 1; i < allRows.length; i++) {
    const row = allRows[i];
    const trimmedRow = row.map(cell => (cell || "").trim());
    const hasImportantData = trimmedRow.some(cell => 
      cell.length > 1 && cell !== "." && cell !== "-"
    );
    if (hasImportantData) {
      validRows.push({
        data: row,
        sheetRowIndex: i // actual row index in the sheet (0-based, headers at 0)
      });
    }
  }

  return { headers, validRows, allRows };
}

// Write/update a row in a tab
export async function writeSheetRow(tabName: string, rowIndex: number | null, data: any) {
  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error("Google Sheets service account credentials required for write operations");
    }
    const sheets = await getAuthenticatedSheetsClient();
    const { headers, validRows, allRows } = await getRowsWithPositions(tabName);

    if (!headers || headers.length === 0) {
      throw new Error(`Sheet "${tabName}" has no headers. Please ensure the sheet has a header row.`);
    }

    // Map UI field names back to original header names
    const headerFieldMap: any = {};
    headers.forEach(header => {
      let normalizedHeader = header.toLowerCase();
      if (normalizedHeader === "date") headerFieldMap["date"] = header;
      else if (normalizedHeader === "activity") headerFieldMap["activity"] = header;
      else if (normalizedHeader === "time") headerFieldMap["time"] = header;
      else if (normalizedHeader === "description") headerFieldMap["description"] = header;
      else if (normalizedHeader === "registration") headerFieldMap["registration"] = header;
      else if (normalizedHeader === "meal") headerFieldMap["meal"] = header;
      else if (normalizedHeader === "title") headerFieldMap["title"] = header;
      else if (normalizedHeader === "id") headerFieldMap["guest_id"] = header;
      else if (normalizedHeader === "request type" || normalizedHeader === "request_type") headerFieldMap["request_type"] = header;
      else if (normalizedHeader === "status") headerFieldMap["status"] = header;
      else headerFieldMap[header] = header;
    });

    // Prepare new row data in order of headers
    const newRow = headers.map((header) => {
      // Find matching field in data (check both original header and mapped name)
      let value = data[header] || "";
      // Check mapped fields
      if (!value) {
        const mappedField = Object.keys(headerFieldMap).find(key => headerFieldMap[key] === header);
        if (mappedField) {
          value = data[mappedField] || "";
        }
      }
      // If still no value, check if we have a field with different case
      if (!value) {
        for (const key of Object.keys(data)) {
          if (key.toLowerCase() === header.toLowerCase()) {
            value = data[key];
            break;
          }
        }
      }
      // Convert time to 12h format when saving
      if (header.toLowerCase() === "time") {
        value = formatTimeTo12h(value);
      }
      return value || "";
    });

    let range: string;
    if (rowIndex === null) {
      // Append new row
      range = `${tabName}!A${allRows.length + 1}`;
    } else {
      // Find actual sheet row index from valid row index (rowIndex starts at 1)
      const targetRow = validRows[rowIndex - 1];
      if (!targetRow) throw new Error("Row not found");
      range = `${tabName}!A${targetRow.sheetRowIndex + 1}`; // +1 because sheet rows are 1-indexed
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: "RAW",
      requestBody: {
        values: [newRow],
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error writing to Google Sheet:", error);
    throw error;
  }
}

// Delete a row from a tab
export async function deleteSheetRow(tabName: string, rowIndex: number) {
  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error("Google Sheets service account credentials required for delete operations");
    }
    const sheets = await getAuthenticatedSheetsClient();
    
    // Get sheet metadata to find sheet ID
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    const sheet = spreadsheet.data.sheets?.find((s) => s.properties?.title === tabName);
    if (!sheet) throw new Error("Sheet not found");
    const sheetId = sheet.properties?.sheetId;
    if (sheetId === undefined || sheetId === null) throw new Error("Sheet not found");

    // Get actual sheet row index
    const { validRows } = await getRowsWithPositions(tabName);
    const targetRow = validRows[rowIndex - 1];
    if (!targetRow) throw new Error("Row not found");

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: targetRow.sheetRowIndex, // actual row index in sheet
                endIndex: targetRow.sheetRowIndex + 1,
              },
            },
          },
        ],
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting from Google Sheet:", error);
    throw error;
  }
}
