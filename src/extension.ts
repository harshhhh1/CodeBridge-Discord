import * as vscode from 'vscode';
import * as https from 'https';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    const shareFileCommand = vscode.commands.registerCommand('discord-share.shareFile', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            shareContent(document.getText(), document.fileName);
        } else {
            vscode.window.showInformationMessage('No active editor found.');
        }
    });

    const shareSelectionCommand = vscode.commands.registerCommand('discord-share.shareSelection', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
            const text = editor.document.getText(selection);
            if (text) {
                shareContent(text, editor.document.fileName);
            } else {
                vscode.window.showInformationMessage('No text selected.');
            }
        } else {
            vscode.window.showInformationMessage('No active editor found.');
        }
    });

    context.subscriptions.push(shareFileCommand, shareSelectionCommand);
}

function shareContent(content: string, fileName: string) {
    const config = vscode.workspace.getConfiguration('discord-share');
    const webhookUrl = config.get<string>('webhookUrl');

    if (!webhookUrl) {
        vscode.window.showErrorMessage('Discord webhook URL not configured. Please set it in the settings.');
        return;
    }

    const extension = path.extname(fileName).substring(1);
    const codeBlock = '```' + extension + '\n' + content + '\n```';

    const data = JSON.stringify({
        content: `File: ${path.basename(fileName)}\n${codeBlock}`
    });

    const url = new URL(webhookUrl);

    const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = https.request(options, res => {
        if (res.statusCode === 204) {
            vscode.window.showInformationMessage('Successfully shared to Discord.');
        } else {
            vscode.window.showErrorMessage(`Failed to share to Discord. Status code: ${res.statusCode}`);
        }
    });

    req.on('error', error => {
        vscode.window.showErrorMessage(`Failed to share to Discord: ${error.message}`);
    });

    req.write(data);
    req.end();
}

export function deactivate() {}
