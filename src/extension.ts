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
            let startingLine = 0;
            if (!selection.isEmpty) {
                content = document.getText(selection);
                startingLine = selection.start.line;
            } else {
                content = document.getText();
                startingLine = 0;
            }

            if (content) {
                try {
                    const config = vscode.workspace.getConfiguration('discord-share');
                    const promptForComment = config.get<boolean>('promptForComment');
                    let comment: string | undefined;
                    if (promptForComment) {
                        comment = await vscode.window.showInputBox({
                            prompt: "Enter a comment to include with your code",
                            placeHolder: "e.g. Needs review"
                        });
                        // If the user cancels the input box, stop the process
                        if (comment === undefined) {
                            return;
                        }
                    }

                    await share(content, document.fileName, startingLine, comment);
                    vscode.window.showInformationMessage(`Successfully shared to Discord.`);
                } catch (error) {
                    if (error instanceof Error) {
                        vscode.window.showErrorMessage(`Failed to share to Discord: ${error.message}`);
                    } else {
                        vscode.window.showErrorMessage(`Failed to share to Discord: ${String(error)}`);
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

async function share(content: string, fileName: string, startingLine: number, comment?: string) {
    const config = vscode.workspace.getConfiguration('discord-share');
    const webhookUrl = config.get<string>('webhookUrl');

    if (!webhookUrl) {
        throw new Error('Discord webhook URL not configured. Please set it in the settings.');
    }

    const showAuthor = config.get<boolean>('showAuthor');
    let authorName = config.get<string>('authorName');
    if (showAuthor && !authorName) {
        authorName = process.env.USERNAME || process.env.USER || 'Anonymous';
    }

    const showLineNumbers = config.get<boolean>('showLineNumbers');
    if (showLineNumbers) {
        const lines = content.split('\n');
        const numberedLines = lines.map((line, index) => `${String(startingLine + index + 1).padStart(4, ' ')} | ${line}`);
        content = numberedLines.join('\n');
    }

    const extension = vscode.extensions.getExtension('icodis.discord-share');
    const extensionVersion = extension ? extension.packageJSON.version : '1.0.0';
    const extensionName = extension ? extension.packageJSON.displayName : 'Discord Share';

    const ext = path.extname(fileName).substring(1);
    const language = getLanguageName(ext);

    const codeBlockHeader = '```' + ext + '\n';
    const codeBlockFooter = '\n```';
    const MAX_DESCRIPTION_LENGTH = 4096;
    const fileNameLine = `**File:** \`${path.basename(fileName)}\`\n`;
    const MAX_CONTENT_LENGTH = MAX_DESCRIPTION_LENGTH - codeBlockHeader.length - codeBlockFooter.length - fileNameLine.length;

    const contentChunks = [];
    for (let i = 0; i < content.length; i += MAX_CONTENT_LENGTH) {
        contentChunks.push(content.substring(i, i + MAX_CONTENT_LENGTH));
    }

    for (let i = 0; i < contentChunks.length; i++) {
        const chunk = contentChunks[i];
        const codeBlock = codeBlockHeader + chunk + codeBlockFooter;

        const embed: any = {
            title: language ? `${language} Code` : 'Code Snippet',
            description: fileNameLine + codeBlock,
            color: 0x0099ff,
            timestamp: new Date().toISOString(),
            footer: {
                icon_url: "https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png",
                text: `${extensionName} v${extensionVersion} | Developed by Harshhhh1`
            }
        };

        if (showAuthor) {
            embed.author = { name: authorName };
        }

        if (i === 0 && comment) {
             embed.fields = [{ name: 'Comment', value: comment }];
        }
        
        if (contentChunks.length > 1) {
            embed.title += ` (Part ${i + 1}/${contentChunks.length})`;
        }

        await sendEmbed(webhookUrl, embed);
    }
}

function getLanguageName(extension: string): string {

    const languageMap: { [key: string]: string } = {

        'py': 'Python',

        'js': 'JavaScript',

        'ts': 'TypeScript',

        'java': 'Java',

        'c': 'C',

        'cpp': 'C++',

        'cs': 'C#',

        'go': 'Go',

        'php': 'PHP',

        'rb': 'Ruby',

        'rs': 'Rust',

        'swift': 'Swift',

        'kt': 'Kotlin',

        'html': 'HTML',

        'css': 'CSS',

        'scss': 'SCSS',

        'less': 'Less',

        'json': 'JSON',

        'xml': 'XML',

        'yml': 'YAML',

        'md': 'Markdown',

        'sh': 'Shell',

        'bat': 'Batch',

        'sql': 'SQL',

        'pl': 'Perl',

        'lua': 'Lua',

        'r': 'R',

        'dart': 'Dart',

        'dockerfile': 'Dockerfile'

    };

    return languageMap[extension.toLowerCase()] || extension.toUpperCase();

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



export function deactivate() {}

