import * as vscode from 'vscode';
import { I18nManagerPanel } from './i18nManagerPanel';

export function activate(context: vscode.ExtensionContext) {
  const openFolderCommand = vscode.commands.registerCommand(
    'lozi.openFolder',
    async (uri?: vscode.Uri) => {
      let targetUri = uri;

      if (!targetUri) {
        const selected = await vscode.window.showOpenDialog({
          canSelectFiles: false,
          canSelectFolders: true,
          canSelectMany: false,
          openLabel: 'Open i18n Folder',
        });
        if (selected && selected.length > 0) {
          targetUri = selected[0];
        }
      }

      if (targetUri) {
        I18nManagerPanel.createOrShow(context.extensionUri, targetUri);
      }
    }
  );

  context.subscriptions.push(openFolderCommand);
}

export function deactivate() {}
