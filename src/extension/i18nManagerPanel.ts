import * as vscode from 'vscode';
import * as path from 'path';
import { FileService } from './fileService';
import {
  ExtensionToWebviewMessage,
  I18nFolderState,
  WebviewToExtensionMessage,
} from './types';

export class I18nManagerPanel {
  public static currentPanels: Map<string, I18nManagerPanel> = new Map();
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _folderPath: string;
  private _folderState?: I18nFolderState;
  private _disposables: vscode.Disposable[] = [];
  private _fileWatcher?: vscode.FileSystemWatcher;

  public static createOrShow(extensionUri: vscode.Uri, folderUri: vscode.Uri) {
    const folderPath = folderUri.fsPath;
    const existingPanel = I18nManagerPanel.currentPanels.get(folderPath);

    if (existingPanel) {
      existingPanel._panel.reveal(vscode.ViewColumn.One);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'lozi',
      `i18n: ${path.basename(folderPath)}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'dist', 'webview'),
        ],
      }
    );

    const manager = new I18nManagerPanel(panel, extensionUri, folderPath);
    I18nManagerPanel.currentPanels.set(folderPath, manager);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    folderPath: string
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._folderPath = folderPath;

    this._updateHtml();
    this._setupMessageListener();
    this._setupFileWatcher();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  private async _loadAndSendData() {
    try {
      this._folderState = await FileService.loadFolder(this._folderPath);
      this._postMessage({
        type: 'INIT_DATA',
        payload: this._folderState,
      });
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to load i18n folder: ${err.message}`);
    }
  }

  private _postMessage(message: ExtensionToWebviewMessage) {
    this._panel.webview.postMessage(message);
  }

  private _setupMessageListener() {
    this._panel.webview.onDidReceiveMessage(
      async (message: WebviewToExtensionMessage) => {
        switch (message.type) {
          case 'READY':
            await this._loadAndSendData();
            break;
          case 'SAVE_REQUEST':
            if (!this._folderState) return;
            try {
              await FileService.saveFolder(this._folderState, message.payload.rows);
              this._postMessage({
                type: 'SAVE_SUCCESS',
                payload: { timestamp: Date.now() },
              });
              vscode.window.showInformationMessage('i18n translations saved successfully.');
              await this._loadAndSendData();
            } catch (err: any) {
              this._postMessage({
                type: 'SAVE_ERROR',
                payload: { error: err.message },
              });
              vscode.window.showErrorMessage(`Error saving translations: ${err.message}`);
            }
            break;
          case 'ADD_LANGUAGE_REQUEST':
            try {
              await FileService.createLanguageFile(
                this._folderPath,
                message.payload.filename
              );
              vscode.window.showInformationMessage(
                `Created language file ${message.payload.filename}`
              );
              await this._loadAndSendData();
            } catch (err: any) {
              vscode.window.showErrorMessage(`Failed to create language file: ${err.message}`);
            }
            break;
          case 'COPY_TO_CLIPBOARD':
            await vscode.env.clipboard.writeText(message.payload.text);
            vscode.window.showInformationMessage(`Copied "${message.payload.text}" to clipboard.`);
            break;
          case 'SHOW_NOTIFICATION':
            if (message.payload.level === 'warn') {
              vscode.window.showWarningMessage(message.payload.message);
            } else if (message.payload.level === 'error') {
              vscode.window.showErrorMessage(message.payload.message);
            } else {
              vscode.window.showInformationMessage(message.payload.message);
            }
            break;
        }
      },
      null,
      this._disposables
    );
  }

  private _setupFileWatcher() {
    const pattern = new vscode.RelativePattern(this._folderPath, '*.json');
    this._fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

    this._fileWatcher.onDidChange(async () => {
      await this._loadAndSendData();
    });
    this._fileWatcher.onDidCreate(async () => {
      await this._loadAndSendData();
    });
    this._fileWatcher.onDidDelete(async () => {
      await this._loadAndSendData();
    });

    this._disposables.push(this._fileWatcher);
  }

  private _updateHtml() {
    const webview = this._panel.webview;
    const webviewDistUri = vscode.Uri.joinPath(
      this._extensionUri,
      'dist',
      'webview'
    );

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(webviewDistUri, 'assets', 'index.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(webviewDistUri, 'assets', 'index.css')
    );

    webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>i18n Manager</title>
  <link rel="stylesheet" href="${styleUri}">
</head>
<body class="bg-base-100 text-base-content min-h-screen">
  <div id="root"></div>
  <script type="module" src="${scriptUri}"></script>
</body>
</html>`;
  }

  public dispose() {
    I18nManagerPanel.currentPanels.delete(this._folderPath);
    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) d.dispose();
    }
  }
}
