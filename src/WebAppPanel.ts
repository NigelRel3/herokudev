import * as vscode from "vscode";
import { getNonce } from "get-nonce";
import {encode} from 'html-entities';
import { updateIDS } from './helpers';

interface StringIndexedPanels {
    [index: string]: any;
}
export class WebAppPanel {

    private static panels: StringIndexedPanels = [];

    private disposables: vscode.Disposable[] = [];

    // Data from localstorage
    private static storedConfig: any = null;

    private static storeURI: vscode.Uri | null = null;

    public static createOrShow(
        extensionUri: vscode.Uri, 
        config: any,
        node: any,
        storageUri: vscode.Uri,
        ) 
    { 
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn: undefined;

        const title = node.title;
        // If we already have a panel, show it.    
        if (WebAppPanel.panels[title]) {
            WebAppPanel.panels[title].panel.reveal(column);
            return;     
        }
        
        // Otherwise, create a new panel. 
        const panel = vscode.window.createWebviewPanel(
            "vscodevuecli:panel",
            node.title,
            column || vscode.ViewColumn.One,
            WebAppPanel.getWebviewOptions(extensionUri),
        );
        
        WebAppPanel.panels[title] = new WebAppPanel(panel, extensionUri, config, node, storageUri);     
    }

    private static getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions 
    {
        return {
            // Enable javascript in the webview
            enableScripts: true,

            localResourceRoots: [
                vscode.Uri.joinPath(extensionUri, 'media'),
                vscode.Uri.joinPath(extensionUri, 'dist-web'),
            ]
        };
    }

    public static kill() { 
        WebAppPanel.panels.forEach(panel => {
            panel.dispose();
        });
        WebAppPanel.panels = [];
    }

    public static revive(
            panel: vscode.WebviewPanel,
            extensionUri: vscode.Uri, 
            config: any,
            node: any,
            storageUri: vscode.Uri,
        ) 
    {    
        WebAppPanel.panels[node.title] = new WebAppPanel(panel, extensionUri, config, node, storageUri);     
    }

    private constructor(
        private panel: vscode.WebviewPanel,
        private extensionUri: vscode.Uri,
        private config: any,
        private node: any,
        private storageUri: vscode.Uri,
        ) 
    {
        if (WebAppPanel.storedConfig == null)   {
            WebAppPanel.storeURI = vscode.Uri.joinPath(storageUri,
                '/herokuConfig.json');

            // Load config data
            vscode.workspace.fs.readFile(WebAppPanel.storeURI).then(existing => {
                const existingData = Buffer.from(existing).toString();
                WebAppPanel.storedConfig = JSON.parse(existingData) || [];

                this.update();
            });
        } else  {
            this.update();
        }


        this.panel.onDidDispose(() => this.dispose(), 
            null, this.disposables);
        
        // Update the content based on view changes 
        this.panel.onDidChangeViewState(  
            e => {
                if (this.panel.visible) {  
                    this.update();
                }
            },
            null,
            this.disposables
        );

        // Handle messages from the webview  
        this.panel.webview.onDidReceiveMessage(    
            message => {
                switch (message.command) {
                    case 'alert': //vscode.window.showErrorMessage(message.text); 
                                return;
                    case 'addUser': this.updateUsers(message.sourceID, message.data); 
                                return;
                    case 'updateWPPassword': this.updateWPPassword(message.data.email, message.data.password); 
                                return;
                }
            },
            null,
            this.disposables 
        );
    }

    public updateWPPassword(email: string, password: string)
    {
        let terminal = vscode.window.createTerminal('Reset WP password for ' + email);
        const userName = email.split('@')[0];
        const ids = {...this.node.ids, email : email, password : password, userName : userName};
        terminal.show();
        const consoleCommand = 'heroku run bash --app={app}\r\nwp user create {userName} {email} --role=administrator --user_pass={password}\r\nwp user update {userName} --user_pass={password}\r\nexit\r\nexit';
        const cmdLine = updateIDS(consoleCommand, ids);
        terminal.sendText(cmdLine);
    }

    public updateViewsStoredData(dataType: string)
    {
        // Loop through static panels
        Object.values(WebAppPanel.panels).forEach((panel) => {
            let sections = panel.config.additionalData.split(',');
            if (sections.includes(dataType))    {
                panel.panel.webview.postMessage({
                    command: 'update', 
                    data: WebAppPanel.storedConfig[dataType],
                    type: dataType,
                });
            }
        });
    }

    public updateUsers(sourceID: string, content: any)  
    {
        vscode.workspace.fs.readFile(WebAppPanel.storeURI).then(existing => {
                WebAppPanel.storedConfig.users = { ...WebAppPanel.storedConfig.users, ...content};
                vscode.workspace.fs.writeFile(WebAppPanel.storeURI, 
                    Buffer.from(JSON.stringify(WebAppPanel.storedConfig, null, 4)));
                this.updateViewsStoredData('users');
            },
            newFile => {
                vscode.workspace.fs.writeFile(WebAppPanel.storeURI, 
                    Buffer.from(JSON.stringify({users: content}, null, 4)));
            }
        );
    }

    public dispose() 
    {    
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

    private async update() 
    {
        const webview = this.panel.webview;    
        this.panel.webview.html = this.getHtmlForWebview(webview);  
    }
    
    private getHtmlForWebview(webview: vscode.Webview) 
    {    
        const styleResetUri = webview.asWebviewUri(      
            vscode.Uri.joinPath(this.extensionUri, "media", "reset.css")   
        );

        const styleVSCodeUri = webview.asWebviewUri(    
            vscode.Uri.joinPath(this.extensionUri, "media", "vscode.css")
        );
        const scriptUri = webview.asWebviewUri( 
            vscode.Uri.joinPath(this.extensionUri, "dist-web", "js/app.js")
        );
        
        const scriptVendorUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, "dist-web", 
                "assets/index.js")
        );
        const cssVendorUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, "dist-web", 
                "assets/index.css")
        );

        const nonce = getNonce();  
        const baseUri = webview.asWebviewUri(vscode.Uri.joinPath(
            this.extensionUri, 'dist-web')
            ).toString().replace('%22', '');
        const storageUri = webview.asWebviewUri(vscode.Uri.joinPath(
            this.storageUri, 'dist-web')
            ).toString().replace('%22', '');

        const config = vscode.workspace.getConfiguration('herokudev');

        let herokuConfig = '';
        if (this.config.resource)   {
            herokuConfig = encode(JSON.stringify({
                uri: this.config.resource, 
                node: this.node, 
                token : config.get('token'),
            }));
        }
            
        let extraDataElement = '';
        if(this.config.additionalData)  {
            // Add extra data to request
            let extraData = {};
            let sections = this.config.additionalData.split(',');
            for (const group of sections)   {
                extraData[group] = WebAppPanel.storedConfig[group];
            }
            if (extraData)  {
                extraDataElement = '<input hidden data-extra-data="' +
                    encode(JSON.stringify(extraData)) + 
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


