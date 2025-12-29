# How to Start the Bloodline Server

## Quick Start

1. **Open a new Terminal/PowerShell window** in the project folder:
   - Right-click in the folder → "Open in Terminal" or "Open PowerShell window here"
   - Or navigate to: `C:\Users\DELL\Desktop\Bloodline Web App`

2. **Stop any running server** (if needed):
   - Press `Ctrl+C` in the terminal where server is running
   - Or close that terminal window

3. **Start the server**:
   ```powershell
   node server.js
   ```

4. **You should see**:
   ```
   🚀 Bloodline server running on http://localhost:3000
   📊 API endpoints available at http://localhost:3000/api
   Connected to SQLite database.
   Users table ready.
   Organizations table ready.
   Blood requests table ready.
   ```

5. **Keep the terminal open** - the server must stay running while you use the app

6. **Open your browser** and go to: `http://localhost:3000`

## Troubleshooting

- If port 3000 is already in use, change the port in `server.js` (line 16)
- Make sure you've run `npm install` first
- Check that Node.js is installed: `node --version`

