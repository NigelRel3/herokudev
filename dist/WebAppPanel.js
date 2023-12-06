"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebAppPanel = void 0;
const vscode = __importStar(require("vscode"));
const get_nonce_1 = require("get-nonce");
const html_entities_1 = require("html-entities");
const helpers_1 = require("./helpers");
class WebAppPanel {
    constructor(panel, extensionUri, config, node, storageUri) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.config = config;
        this.node = node;
        this.storageUri = storageUri;
        this.disposables = [];
        if (WebAppPanel.storedConfig == null) {
            WebAppPanel.storeURI = vscode.Uri.joinPath(storageUri, '/herokuConfig.json');
            // Load config data
            vscode.workspace.fs.readFile(WebAppPanel.storeURI).then(existing => {
                const existingData = Buffer.from(existing).toString();
                WebAppPanel.storedConfig = JSON.parse(existingData) || [];
                this.update();
            });
        }
        else {
            this.update();
        }
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        // Update the content based on view changes 
        this.panel.onDidChangeViewState(e => {
            if (this.panel.visible) {
                this.update();
            }
        }, null, this.disposables);
        // Handle messages from the webview  
        this.panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'alert': //vscode.window.showErrorMessage(message.text); 
                    return;
                case 'addUser':
                    this.updateUsers(message.sourceID, message.data);
                    return;
                case 'updateWPPassword':
                    this.updateWPPassword(message.data.email, message.data.password);
                    return;
            }
        }, null, this.disposables);
    }
    static createOrShow(extensionUri, config, node, storageUri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn : undefined;
        const title = node.title;
        // If we already have a panel, show it.    
        if (WebAppPanel.panels[title]) {
            WebAppPanel.panels[title].panel.reveal(column);
            return;
        }
        // Otherwise, create a new panel. 
        const panel = vscode.window.createWebviewPanel("vscodevuecli:panel", node.title, column || vscode.ViewColumn.One, WebAppPanel.getWebviewOptions(extensionUri));
        WebAppPanel.panels[title] = new WebAppPanel(panel, extensionUri, config, node, storageUri);
    }
    static getWebviewOptions(extensionUri) {
        return {
            // Enable javascript in the webview
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(extensionUri, 'media'),
                vscode.Uri.joinPath(extensionUri, 'dist-web'),
            ]
        };
    }
    static kill() {
        WebAppPanel.panels.forEach(panel => {
            panel.dispose();
        });
        WebAppPanel.panels = [];
    }
    static revive(panel, extensionUri, config, node, storageUri) {
        WebAppPanel.panels[node.title] = new WebAppPanel(panel, extensionUri, config, node, storageUri);
    }
    updateWPPassword(email, password) {
        let terminal = vscode.window.createTerminal('Reset WP password for ' + email);
        const userName = email.split('@')[0];
        const ids = Object.assign(Object.assign({}, this.node.ids), { email: email, password: password, userName: userName });
        terminal.show();
        const consoleCommand = 'heroku run bash --app={app}\r\nwp user create {userName} {email} --role=administrator --user_pass={password}\r\nwp user update {userName} --user_pass={password}\r\nexit\r\nexit';
        const cmdLine = (0, helpers_1.updateIDS)(consoleCommand, ids);
        terminal.sendText(cmdLine);
    }
    updateViewsStoredData(dataType) {
        // Loop through static panels
        Object.values(WebAppPanel.panels).forEach((panel) => {
            let sections = panel.config.additionalData.split(',');
            if (sections.includes(dataType)) {
                panel.panel.webview.postMessage({
                    command: 'update',
                    data: WebAppPanel.storedConfig[dataType],
                    type: dataType,
                });
            }
        });
    }
    updateUsers(sourceID, content) {
        vscode.workspace.fs.readFile(WebAppPanel.storeURI).then(existing => {
            WebAppPanel.storedConfig.users = Object.assign(Object.assign({}, WebAppPanel.storedConfig.users), content);
            vscode.workspace.fs.writeFile(WebAppPanel.storeURI, Buffer.from(JSON.stringify(WebAppPanel.storedConfig, null, 4)));
            this.updateViewsStoredData('users');
        }, newFile => {
            vscode.workspace.fs.writeFile(WebAppPanel.storeURI, Buffer.from(JSON.stringify({ users: content }, null, 4)));
        });
    }
    dispose() {
        WebAppPanel.panels = [];
        // Clean up resources  
        this.panel.dispose();
        while (this.disposables.length) {
            const x = this.disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    update() {
        return __awaiter(this, void 0, void 0, function* () {
            const webview = this.panel.webview;
            this.panel.webview.html = this.getHtmlForWebview(webview);
        });
    }
    getHtmlForWebview(webview) {
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "media", "reset.css"));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "media", "vscode.css"));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "dist-web", "js/app.js"));
        const scriptVendorUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "dist-web", "assets/index.js"));
        const cssVendorUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "dist-web", "assets/index.css"));
        const nonce = (0, get_nonce_1.getNonce)();
        const baseUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'dist-web')).toString().replace('%22', '');
        const storageUri = webview.asWebviewUri(vscode.Uri.joinPath(this.storageUri, 'dist-web')).toString().replace('%22', '');
        const config = vscode.workspace.getConfiguration('herokudev');
        let herokuConfig = '';
        if (this.config.resource) {
            herokuConfig = (0, html_entities_1.encode)(JSON.stringify({
                uri: this.config.resource,
                node: this.node,
                token: config.get('token'),
            }));
        }
        let extraDataElement = '';
        if (this.config.additionalData) {
            // Add extra data to request
            let extraData = {};
            let sections = this.config.additionalData.split(',');
            for (const group of sections) {
                extraData[group] = WebAppPanel.storedConfig[group];
            }
            if (extraData) {
                extraDataElement = '<input hidden data-extra-data="' +
                    (0, html_entities_1.encode)(JSON.stringify(extraData)) +
                    '" />';
            }
        }
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, 
                    initial-scale=1" />
                <meta http-equiv="Content-Security-Policy"
                    content="navigate-to .heroku.com;" />
                <link href="${styleResetUri}" rel="stylesheet">
                <link href="${styleVSCodeUri}" rel="stylesheet">
                <link href="${cssVendorUri}" rel="stylesheet">
                <title>${this.node.title}</title>
                <style>
                    html, body, #app {
                        width: 100%;
                        height: 100%;
                    }
                </style>
            </head>
            <body>
                <input hidden data-uri="${baseUri}" />
                <input hidden data-storage-uri="${storageUri}" />
                <input hidden data-component="${this.config.componentType}" />
                <input hidden data-content="${herokuConfig}" />

                ${extraDataElement}
                <div id="app"></div>  
                <script type="text/javascript"
                    src="${scriptVendorUri}" nonce="${nonce}"></script>  
                <script type="text/javascript"
                    src="${scriptUri}" nonce="${nonce}"></script>
            </body>
            </html> 
        `;
    }
}
exports.WebAppPanel = WebAppPanel;
WebAppPanel.panels = [];
// Data from localstorage
WebAppPanel.storedConfig = null;
WebAppPanel.storeURI = null;
//# sourceMappingURL=WebAppPanel.js.map