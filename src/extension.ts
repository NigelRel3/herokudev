import * as vscode from 'vscode';
import { WebAppPanel } from './WebAppPanel';
import { AppsTree, Dependency } from './AppsTree';
import { Heroku } from './Heroku';
import { updateIDS } from './helpers';

export function activate(context: vscode.ExtensionContext) {
    const storageUri: vscode.Uri = context.globalStorageUri;

    const commandHandler = (node: any, menuItem: any) => {
        WebAppPanel.createOrShow(context.extensionUri, menuItem, node, storageUri);
    };
    context.subscriptions.push(   
        vscode.commands.registerCommand('heroku:openVueApp', commandHandler)
    );
    const terminalHandler = (node: any, menuItem: any) => {
        let terminal = vscode.window.createTerminal('Console for ' + node.ids.appName);
        let cmdLine = updateIDS(menuItem.consoleCommand, node.ids);
        terminal.show();

        terminal.sendText(cmdLine);
    };
    context.subscriptions.push(   
        vscode.commands.registerCommand('heroku:console', terminalHandler)
    );

    //Called from > on a menu item (if displayed)
    const displayDetailsHandler = (item: Dependency) => {
        let config = { resource: item.details, componentType: item.componentType };
        WebAppPanel.createOrShow(context.extensionUri, config, item.node, storageUri);
    };
    context.subscriptions.push(   
        vscode.commands.registerCommand('heroku:displayDetails', displayDetailsHandler)
    );
    
    let heroku = new Heroku();
    const tree = new AppsTree(heroku, context);
    const appTree = vscode.window.createTreeView('herokuApps', {
        treeDataProvider: tree
    });

    // Called when checkbox is changed
    const checkBoxListener = appTree.onDidChangeCheckboxState(async event => {
        tree.updatePinned(event.items[0][0].label, event.items[0][1]);
    });
}

// This method is called when the extension is deactivated
export function deactivate() {}

