import * as vscode from 'vscode';
import * as https from 'https';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    const shareCommand = vscode.commands.registerCommand('discord-share.share', async () => {
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
                const choice = await vscode.window.showQuickPick(['Embed', 'Plain Message'], {
                    placeHolder: 'How would you like to share your code?'
                });

                if (choice) {
                    try {
                        if (choice === 'Embed') {
                            await shareAsEmbed(content, document.fileName, context);
                        } else {
                            await shareAsPlainMessage(content, document.fileName, context);
                        }
                        vscode.window.showInformationMessage(`Successfully shared to Discord as a ${choice.toLowerCase()}.`);
                    } catch (error) {
                        if (error instanceof Error) {
                            vscode.window.showErrorMessage(`Failed to share to Discord: ${error.message}`);
                        } else {
                            vscode.window.showErrorMessage(`Failed to share to Discord: ${String(error)}`);
                        }
                    }
                }
            } else {
                vscode.window.showInformationMessage('No content to share.');
            }
        } else {
            vscode.window.showInformationMessage('No active editor found.');
        }
    });

    context.subscriptions.push(shareCommand);
}

async function shareAsEmbed(content: string, fileName: string, context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('discord-share');
    const webhookUrl = config.get<string>('webhookUrl');

    if (!webhookUrl) {
        throw new Error('Discord webhook URL not configured. Please set it in the settings.');
    }

    const extension = vscode.extensions.getExtension('icodis.discord-share');
    const extensionVersion = extension ? extension.packageJSON.version : '1.0';
    const extensionName = extension ? extension.packageJSON.displayName : 'Discord Share';

    const ext = path.extname(fileName).substring(1);
    const codeBlockHeader = '```' + ext + '\n';
    const codeBlockFooter = '\n```';
    const MAX_DESCRIPTION_LENGTH = 4096;
    const MAX_CONTENT_LENGTH = MAX_DESCRIPTION_LENGTH - codeBlockHeader.length - codeBlockFooter.length;

    const contentChunks = [];
    for (let i = 0; i < content.length; i += MAX_CONTENT_LENGTH) {
        contentChunks.push(content.substring(i, i + MAX_CONTENT_LENGTH));
    }

    for (let i = 0; i < contentChunks.length; i++) {
        const chunk = contentChunks[i];
        const codeBlock = codeBlockHeader + chunk + codeBlockFooter;

        const embed = {
            title: `File: ${path.basename(fileName)}` + (contentChunks.length > 1 ? ` (Part ${i + 1}/${contentChunks.length})` : ''),
            description: codeBlock,
            color: 0x0099ff,
            footer: {
                icon_url: "https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png",
                text: `${extensionName} v${extensionVersion}| Developed by Harshhhh1 `
            }
        };
        await sendEmbed(webhookUrl, embed);
    }
}

async function shareAsPlainMessage(content: string, fileName: string, context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('discord-share');
    const webhookUrl = config.get<string>('webhookUrl');

    if (!webhookUrl) {
        throw new Error('Discord webhook URL not configured. Please set it in the settings.');
    }

    const ext = path.extname(fileName).substring(1);
    const codeBlockHeader = '```' + ext + '\n';
    const codeBlockFooter = '\n```';
    const MAX_LENGTH = 2000;
    const MAX_CONTENT_LENGTH = MAX_LENGTH - codeBlockHeader.length - codeBlockFooter.length;

    const contentChunks = [];
    for (let i = 0; i < content.length; i += MAX_CONTENT_LENGTH) {
        contentChunks.push(content.substring(i, i + MAX_CONTENT_LENGTH));
    }

    for (const chunk of contentChunks) {
        await sendPlainMessage(webhookUrl, codeBlockHeader + chunk + codeBlockFooter);
    }
}

function sendEmbed(webhookUrl: string, embed: any): Promise<void> {
    return new Promise((resolve, reject) => {
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
                resolve();
            } else {
                res.on('data', (d) => {
                    console.error(d.toString());
                });
                reject(new Error(`Status code: ${res.statusCode}`));
            }
        });

        req.on('error', error => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

function sendPlainMessage(webhookUrl: string, message: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ content: message });
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
                resolve();
            } else {
                res.on('data', (d) => {
                    console.error(d.toString());
                });
                reject(new Error(`Status code: ${res.statusCode}`));
            }
        });

        req.on('error', error => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

export function deactivate() {}

