# CodeCast to Discord

Share files and code snippets from VS Code directly to Discord with syntax highlighting.

## Features

*   **Share Code with Context:** Send entire files or just selected code snippets to Discord.
*   **Smart Splitting:** Automatically splits large code blocks into multiple messages to fit Discord's limits.
*   **Syntax Highlighting:** Automatic language detection for beautiful syntax highlighting.
*   **Author Attribution:** Optionally show who sent the code.
*   **Timestamps:** Embeds include a timestamp.
*   **Line Numbers:** Option to include line numbers in the code.
*   **Workspace Webhooks:** Configure different webhooks for different projects.
*   **Add Comments:** Include a comment with your code.
*   **Simple Context Menu:** A single "Send to Discord" command in the context menu.

## Requirements

You will need a Discord webhook URL to use this extension. You can get one by going to `Server Settings > Integrations > Webhooks > New Webhook`.

## Extension Settings

This extension contributes the following settings:

*   `discord-share.webhookUrl`: The Discord webhook URL to post to. This can be set per workspace.
*   `discord-share.showAuthor`: (Default: `true`) Show the author in the embed.
*   `discord-share.authorName`: The name to show as the author. If empty, the extension will try to use a name from the environment.
*   `discord-share.showLineNumbers`: (Default: `false`) Show line numbers in the code block.
*   `discord-share.promptForComment`: (Default: `false`) Prompt for a comment before sending.

## How to Configure

1.  Install the "CodeCast to Discord" extension.
2.  Open your VS Code settings (`Ctrl+,`).
3.  Search for "discord-share".
4.  Enter your Discord webhook URL in the `Discord-share: Webhook Url` setting.
5.  (Optional) You can also configure a different webhook for each of your workspaces in the "Workspace" tab of your settings.

## Release Notes

### 1.0.0

Initial release of CodeCast to Discord.

**Enjoy!**
