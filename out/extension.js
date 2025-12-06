"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const http = __importStar(require("http"));
let server = null;
let panel = null;
function activate(context) {
    console.log('PromptGrab is now active!');
    const startCommand = vscode.commands.registerCommand('grab-and-ask.start', async () => {
        if (server) {
            vscode.window.showInformationMessage('Server already running on port 4123');
            return;
        }
        server = http.createServer(async (req, res) => {
            console.log('Request received:', req.method, req.url);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            if (req.method === 'POST' && req.url === '/grab') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        console.log('Body received:', body.substring(0, 100));
                        const data = JSON.parse(body);
                        await showCapture(data);
                        res.writeHead(200);
                        res.end(JSON.stringify({ success: true }));
                    }
                    catch (e) {
                        console.error('Error:', e);
                        res.writeHead(500);
                        res.end(JSON.stringify({ error: e.message }));
                    }
                });
            }
            else {
                res.writeHead(404);
                res.end();
            }
        });
        server.listen(4123, () => {
            vscode.window.showInformationMessage('PromptGrab ready on port 4123!');
        });
    });
    const stopCommand = vscode.commands.registerCommand('grab-and-ask.stop', () => {
        if (server) {
            server.close();
            server = null;
            vscode.window.showInformationMessage('Server stopped.');
        }
    });
    context.subscriptions.push(startCommand, stopCommand);
    vscode.commands.executeCommand('grab-and-ask.start');
}
async function showCapture(data) {
    const { html, text, url, tool } = data;
    if (!panel) {
        panel = vscode.window.createWebviewPanel('promptgrab', 'PromptGrab Capture', vscode.ViewColumn.Beside, { enableScripts: true });
        panel.onDidDispose(() => {
            panel = null;
        });
    }
    panel.webview.html = getWebviewContent(html, text, url);
    panel.webview.onDidReceiveMessage(async (message) => {
        switch (message.command) {
            case 'copy':
                await vscode.env.clipboard.writeText(html);
                vscode.window.showInformationMessage('HTML copied to clipboard!');
                break;
            case 'openChat':
                const toolName = message.tool;
                await vscode.env.clipboard.writeText(html);
                vscode.window.showInformationMessage(`HTML copied! Paste into ${toolName} chat.`);
                break;
            case 'openLink':
                vscode.env.openExternal(vscode.Uri.parse(message.url));
                break;
        }
    });
    // If user selected a tool from bookmarklet, auto-copy and show action
    if (tool) {
        await vscode.env.clipboard.writeText(html);
        if (tool === 'clipboard') {
            vscode.window.showInformationMessage('✓ HTML copied to clipboard!');
        }
        else if (tool === 'ampcode') {
            const action = await vscode.window.showInformationMessage('✓ HTML copied! Ready to paste in Ampcode.', 'Open Ampcode Chat', 'Done');
            if (action === 'Open Ampcode Chat') {
                vscode.commands.executeCommand('ampcode.openChat');
            }
        }
        else if (tool === 'antigravity') {
            const action = await vscode.window.showInformationMessage('✓ HTML copied! Ready to paste in Antigravity.', 'Open Antigravity Chat', 'Done');
            if (action === 'Open Antigravity Chat') {
                vscode.commands.executeCommand('antigravity.openChat');
            }
        }
    }
}
function getWebviewContent(html, text, url) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PromptGrab Capture</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell;
            padding: 20px;
            margin: 0;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
        }
        h2 { margin-top: 0; }
        .info {
            background: var(--vscode-editorCodeLens-foreground, rgba(120, 120, 120, 0.3));
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 16px;
            font-size: 12px;
        }
        .code-block {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-editorGroup-border);
            border-radius: 4px;
            padding: 12px;
            overflow-x: auto;
            max-height: 400px;
            overflow-y: auto;
            margin-bottom: 16px;
        }
        code {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.5;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .buttons {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Captured Element</h2>
        <div class="info">
            <strong>From:</strong> ${url}
        </div>
        <div class="code-block">
            <code>${escapeHtml(html)}</code>
        </div>
        <div class="buttons">
            <button onclick="copyToClipboard()">📋 Copy HTML</button>
            <button onclick="sendToChat('Ampcode')">→ Ampcode</button>
            <button onclick="sendToChat('Antigravity')">→ Antigravity</button>
            <button onclick="sendToChat('Other')">→ Other Tool</button>
            <button onclick="openLink('${url}')">🌐 Open Source</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function copyToClipboard() {
            vscode.postMessage({ command: 'copy' });
        }

        function sendToChat(tool) {
            vscode.postMessage({ command: 'openChat', tool });
        }

        function openLink(url) {
            vscode.postMessage({ command: 'openLink', url });
        }
    </script>
</body>
</html>`;
}
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}
function deactivate() {
    if (server)
        server.close();
}
//# sourceMappingURL=extension.js.map