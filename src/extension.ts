import * as vscode from 'vscode';
import * as https from 'https';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    const shareCommand = vscode.commands.registerCommand('discord-share.share', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
            const document = editor.document;
            let content = '';
            if (!selection.isEmpty) {
                content = document.getText(selection);
            } else {
                content = document.getText();
            }

            if (content) {
                shareAsEmbed(content, document.fileName, context);
            } else {
                vscode.window.showInformationMessage('No content to share.');
            }
        } else {
            vscode.window.showInformationMessage('No active editor found.');
        }
    });

    context.subscriptions.push(shareCommand);
}

function shareAsEmbed(content: string, fileName: string, context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('discord-share');
    const webhookUrl = config.get<string>('webhookUrl');

    if (!webhookUrl) {
        vscode.window.showErrorMessage('Discord webhook URL not configured. Please set it in the settings.');
        return;
    }

    const extension = vscode.extensions.getExtension('discord-share');
    const extensionVersion = extension ? extension.packageJSON.version : 'N/A';
    const extensionName = extension ? extension.packageJSON.displayName : 'Discord Share';

    const ext = path.extname(fileName).substring(1);
    const codeBlock = '```' + ext + '\n' + content + '\n```';

    const embed = {
        title: `File: ${path.basename(fileName)}`,
        description: codeBlock,
        color: 0x0099ff,
        footer: {
            text: `${extensionName} v${extensionVersion}`
        }
    };

    const data = JSON.stringify({ embeds: [embed] });

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
            vscode.window.showInformationMessage('Successfully shared to Discord as an embed.');
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

