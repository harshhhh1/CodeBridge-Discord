import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../extension';
import * as https from 'https';
import { Writable } from 'stream';

class MockOutgoingMessage extends Writable {
    _write(chunk: any, encoding: string, callback: (error?: Error | null) => void): void {
        // NO-OP
        callback();
    }
}

suite('Extension Test Suite', () => {
    let showInformationMessage: typeof vscode.window.showInformationMessage;
    let showErrorMessage: typeof vscode.window.showErrorMessage;
    let getConfiguration: typeof vscode.workspace.getConfiguration;

    let originalRequest: typeof https.request;
    let requestBody: string;

    suiteSetup(() => {
        showInformationMessage = vscode.window.showInformationMessage;
        showErrorMessage = vscode.window.showErrorMessage;
        getConfiguration = vscode.workspace.getConfiguration;
        originalRequest = https.request;
    });

    suiteTeardown(() => {
        (vscode.window as any).showInformationMessage = showInformationMessage;
        (vscode.window as any).showErrorMessage = showErrorMessage;
        (vscode.workspace as any).getConfiguration = getConfiguration;
        (https as any).request = originalRequest;
    });

    setup(() => {
        requestBody = '';

        (vscode.window as any).showInformationMessage = (message: string) => {
            console.log(`showInformationMessage: ${message}`);
            return Promise.resolve(undefined);
        };

        (vscode.window as any).showErrorMessage = (message: string) => {
            console.log(`showErrorMessage: ${message}`);
            return Promise.resolve(undefined);
        };

        (https as any).request = (options: https.RequestOptions, callback?: (res: any) => void) => {
            const req = new MockOutgoingMessage();
            req.on('finish', () => {
                if (callback) {
                    callback({
                        statusCode: 204,
                        on: () => { }
                    });
                }
            });
            const originalWrite = req.write;
            req.write = function (chunk: any, encoding?: any, callback?: any) {
                requestBody += chunk.toString();
                return originalWrite.call(this, chunk, encoding, callback);
            };
            return req;
        };
    });

    test('Share File Command with no active editor', async () => {
        const spy = vscode.window.showInformationMessage;
        await vscode.commands.executeCommand('discord-share.shareFile');
        assert.strictEqual((spy as any).calledWith('No active editor found.'), true);
    });

    test('Share Selection Command with no active editor', async () => {
        const spy = vscode.window.showInformationMessage;
        await vscode.commands.executeCommand('discord-share.shareSelection');
        assert.strictEqual((spy as any).calledWith('No active editor found.'), true);
    });

    test('Share File Command with webhook URL', async () => {
        (vscode.workspace as any).getConfiguration = (section: string) => {
            return {
                get: (key: string) => {
                    if (section === 'discord-share' && key === 'webhookUrl') {
                        return 'https://discord.com/api/webhooks/123/abc';
                    }
                    return undefined;
                }
            };
        };

        const document = await vscode.workspace.openTextDocument({ content: 'Hello World', language: 'text' });
        await vscode.window.showTextDocument(document);

        await vscode.commands.executeCommand('discord-share.shareFile');

        const expectedBody = {
            content: 'File: Untitled-1\n```text\nHello World\n```'
        };
        assert.strictEqual(requestBody, JSON.stringify(expectedBody));
    });

    test('Share Selection Command with webhook URL', async () => {
        (vscode.workspace as any).getConfiguration = (section: string) => {
            return {
                get: (key: string) => {
                    if (section === 'discord-share' && key === 'webhookUrl') {
                        return 'https://discord.com/api/webhooks/123/abc';
                    }
                    return undefined;
                }
            };
        };

        const document = await vscode.workspace.openTextDocument({ content: 'Hello World', language: 'text' });
        const editor = await vscode.window.showTextDocument(document);
        editor.selection = new vscode.Selection(0, 0, 0, 5); // Select 'Hello'

        await vscode.commands.executeCommand('discord-share.shareSelection');

        const expectedBody = {
            content: 'File: Untitled-1\n```text\nHello\n```'
        };
        assert.strictEqual(requestBody, JSON.stringify(expectedBody));
    });


    test('Share File Command with no webhook URL', async () => {
        (vscode.workspace as any).getConfiguration = (section: string) => {
            return {
                get: (key: string) => {
                    return undefined;
                }
            };
        };

        const spy = vscode.window.showErrorMessage;

        const document = await vscode.workspace.openTextDocument({ content: 'Hello World', language: 'text' });
        await vscode.window.showTextDocument(document);

        await vscode.commands.executeCommand('discord-share.shareFile');

        assert.strictEqual((spy as any).calledWith('Discord webhook URL not configured. Please set it in the settings.'), true);
    });
});
