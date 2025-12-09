# PromptGrab

Inspect and capture HTML elements from any browser, then feed them directly into your favorite AI tools (Ampcode, Antigravity, ChatGPT, Claude, etc.) for instant context-aware editing.

## Features

- **Browser Inspector**: Click any HTML element in your browser to capture it
- **Instant Context**: Captured HTML automatically appears in VS Code with the source URL
- **Multi-AI Support**: Send captured context to Ampcode, Antigravity, or any AI tool
- **No API Keys Required**: No external API calls or authentication needed
- **One-Click Copy**: Copy HTML to clipboard and paste into your preferred AI chat
- **Zero Configuration**: Works out of the box

## How It Works

```
1. Browser → Capture HTML element (bookmarklet)
2. Local server → Receives capture
3. VS Code → Shows webview panel with captured HTML
4. Copy & Paste → Paste into your AI tool chat
5. AI Tool → Get instant suggestions/edits

```

## Bookmarklet

javascript:(d=>{s=d.createElement('script');s.src='https://cdn.jsdelivr.net/gh/Interpoolx/promptgrab@main/bookmarklet-v14.js?v=1%27;d.body.appendChild(s)})(document)

## Installation

1. Clone or download this extension
2. Open VS Code
3. Run: `npm install`
4. Run: `npm run compile`
5. Press `F5` to launch extension in debug mode, or package it for distribution

## Setup

### 1. Start the Server

- Open VS Code Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
- Run: **PromptGrab: Start Server**
- You should see: "PromptGrab ready on port 4123!"

### 2. Add the Bookmarklet to Your Browser

Copy the code from `bookmarklet.js` and create a new bookmark in your browser:

**Chrome/Edge/Firefox:**
1. Right-click the bookmark bar → "Add page..."
2. For **Name**: `PromptGrab`
3. For **URL**: Paste the entire contents of `bookmarklet.js`
4. Click Save

**Safari:**
1. Bookmarks → "Add Bookmark..."
2. Name: `PromptGrab`
3. URL: Paste contents of `bookmarklet.js`

### 3. Use It

1. Visit any webpage
2. **Right-click the element** you want to capture
3. Click the **PromptGrab** bookmark in your bookmark bar
4. The HTML appears in VS Code automatically
5. Click one of these buttons:
   - **📋 Copy HTML** - Copy to clipboard to manually paste
   - **→ Ampcode** - Copies HTML (paste in Ampcode chat)
   - **→ Antigravity** - Copies HTML (paste in Antigravity chat)
   - **→ Other Tool** - Copies HTML (paste in any AI chat)

## Workflow Examples

### Example 1: Edit with Ampcode

1. Visit a website
2. Right-click a button → Click PromptGrab bookmark
3. In VS Code, see the captured HTML in the webview
4. Click "→ Ampcode" button
5. Go to your Ampcode chat and paste
6. Ampcode suggests edits in real-time

### Example 2: Manual Editing

1. Capture HTML element from browser
2. Click "📋 Copy HTML" button
3. Paste into your AI chat manually
4. Get AI suggestions
5. Manually apply changes to your code

### Example 3: Multi-Tool Workflow

1. Capture element once
2. Use "→ Ampcode" to send to Ampcode
3. Use "→ Antigravity" to send to Antigravity
4. Use "→ Other Tool" to send to Claude/ChatGPT
5. Compare suggestions from multiple AI tools

## Requirements

- VS Code 1.85.0 or later
- Modern web browser (Chrome, Edge, Firefox, Safari)
- Node.js (for development)

## Commands

| Command | Description |
|---------|-------------|
| `PromptGrab: Start Server` | Starts the local server on port 4123 |
| `PromptGrab: Stop Server` | Stops the server |

## Troubleshooting

**"Server already running on port 4123"**
- Port 4123 is in use. Either stop the server or change the port in extension.ts

**Bookmarklet doesn't work**
- Make sure the server is running (see "Start Server" command)
- Check browser console for errors (F12 → Console)
- Verify the bookmarklet contains the full code from `bookmarklet.js`

**HTML doesn't appear in VS Code**
- Check that the server is running
- Verify port 4123 is not blocked by firewall
- Try restarting VS Code

**Can't find the webview panel**
- It opens in the sidebar. Look for the "PromptGrab Capture" tab
- If missing, try capturing an element again

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Launch extension (F5 in VS Code debug mode)
```

## License

MIT License - See LICENSE file for details

## Support

For issues or feature requests, please visit the repository or contact the maintainer.
