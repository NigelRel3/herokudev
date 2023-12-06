import * as vscode from 'vscode';

const isNumeric = (num: any) => (typeof(num) === 'number' || typeof(num) === "string" && num.trim() !== '') && !isNaN(num as number);

import nodeHierarchy from "./config/structure.json";
import { Heroku } from './Heroku';

export class AppsTree implements vscode.TreeDataProvider<Dependency> {
    private hierarchy = {};
    private persistantData: any = null;
    private storeURI: vscode.Uri;
    private _onDidChangeTreeData: vscode.EventEmitter<Dependency | void> = new vscode.EventEmitter<Dependency | void>();
    readonly onDidChangeTreeData: vscode.Event<Dependency | void> = this._onDidChangeTreeData.event;

    constructor(
            private heroku: Heroku,
            private context: vscode.ExtensionContext,
    ) 
    {
        this.hierarchy = nodeHierarchy;
        this.loadStoredData();
    }

    refresh(offset?: number): void 
    {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: Dependency): vscode.TreeItem 
    {
        return element;
    }

    getChildren(element?: Dependency): Thenable<Dependency[]> 
    {
        if (element)   {
            return this.getSubNodes(element);
        }

        // Creates dummy start element to load the menu
        let root : Dependency = new Dependency  (
            'root', {'ids': [], 'title' : 'root'}, vscode.TreeItemCollapsibleState.Collapsed, 'root'
        );

        return this.getSubNodes(root);
    }

    private async getSubNodes(element: Dependency): Promise<Dependency[]> 
    {
        let nodes : Dependency[] = [];
        let newNodes = this.hierarchy[element.nodeType];

        if (newNodes.subMenusTop) {
            nodes.push(...this.loadMenu(element, newNodes.subMenusTop));
        }
        if (newNodes.resource)  {
            let dataNodes : Dependency[] = [];
            const results = await this.heroku.apiFetch(this.hierarchy[element.nodeType].resource, element.node['ids'])
            if (results)    {
                let checkUsed = false;
                results.forEach((data) => {
                    let nodeType = newNodes.nodeType;
                    let nodeLabelField = this.hierarchy[nodeType].index || 'name';
                    data['ids'] = { ...element.node['ids']};
                    data['ids'][nodeType] = data.id;  
                    data['title'] = element.node['title'] + ' > ' + data[nodeLabelField];
                    // Action?
                    let command = null;
                    if (this.hierarchy[nodeType].command)    {
                        command = {
                            command: this.hierarchy[nodeType].command,
                            arguments: [
                                data,
                                this.hierarchy[nodeType]
                            ],
                        };
                    }                
                    let collapsable = (this.hierarchy[nodeType].componentType || false)
                        ? vscode.TreeItemCollapsibleState.None
                        : vscode.TreeItemCollapsibleState.Collapsed;
                    let checked = null;
                    if (nodeType == 'team')     {
                        checkUsed = true;
                        if (this.persistantData.pinnedApps.includes(data[nodeLabelField]))    {
                            checked = {state: vscode.TreeItemCheckboxState.Checked, tooltip: 'click to unpin'};
                        }
                        else    {
                            checked = {state: vscode.TreeItemCheckboxState.Unchecked, tooltip: 'click to pin'};
                        }
                    }
                    let subNode = new Dependency(
                        data[nodeLabelField],
                        data,
                        collapsable,
                        nodeType,
                        null,
                        command,
                        this.hierarchy[nodeType].componentType, 
                        null,
                        checked,
                    );
                    dataNodes.push(subNode);
                });
                if (checkUsed)  {
                    // Sort by selected and then label
                    dataNodes.sort((a : Dependency, b : Dependency) => {
                        const aState = a.checked.state || vscode.TreeItemCheckboxState.Unchecked;
                        const bState = b.checked.state || vscode.TreeItemCheckboxState.Unchecked;
                        if (aState == bState) {
                            return a.label.localeCompare(b.label);
                        }
                        return aState == vscode.TreeItemCheckboxState.Checked ? -1 : 1;
                    });
                }
                nodes.push(...dataNodes);
            };
        }
        if (newNodes.subMenus) {
            nodes.push(...this.loadMenu(element, newNodes.subMenus));
        }
        return Promise.resolve(nodes);
    }

    private loadMenu(element : any, subMenus : any): Dependency[]    
    {
        let nodes: Dependency[] = [];
        subMenus.forEach((nodeType: string) => {
            let newNode = {
                ids: element.node['ids'],
                title: element.node['title'] + ' > ' + (this.hierarchy[nodeType].label),
            };
            // Is there an action?
            let command: any = null;
            if (this.hierarchy[nodeType].command)    {
                command = {
                    command: this.hierarchy[nodeType].command,
                    arguments: [
                        newNode,
                        this.hierarchy[nodeType]
                    ],
                };
            }
            let collapsable = (this.hierarchy[nodeType].subMenus || false)
                    ? vscode.TreeItemCollapsibleState.Collapsed
                    : vscode.TreeItemCollapsibleState.None;
            nodes.push( new Dependency(
                this.hierarchy[nodeType].label,
                newNode,
                collapsable,
                nodeType,
                null,
                command,
                this.hierarchy[nodeType].componentType,
                this.hierarchy[nodeType].details,
            ));
        });

        return nodes;
    }

    private async loadStoredData()
    {
        const storageUri: vscode.Uri = this.context.globalStorageUri;
        this.storeURI = vscode.Uri.joinPath(storageUri, '/herokuConfig.json');

        // Load config data
        const existing = await vscode.workspace.fs.readFile(this.storeURI);
        const persistantData = Buffer.from(existing).toString();
        this.persistantData = JSON.parse(persistantData);
    }

    public async updatePinned(label : string, operation : number)
    {
        if (operation)  {
            this.persistantData.pinnedApps.push(label);
        }
        else    {
            this.persistantData.pinnedApps = this.persistantData.pinnedApps.filter(arrayLabel => arrayLabel != label);
        }
        vscode.workspace.fs.writeFile(this.storeURI, 
            Buffer.from(JSON.stringify(this.persistantData, null, 4)));
            this.refresh();
    }
}

export class Dependency extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly node: any,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly nodeType: string,
        public readonly subNodes?: Dependency[],
        public readonly command?: vscode.Command,
        public readonly componentType?: String,
        public readonly details?: string,
        public readonly checked?: {state: vscode.TreeItemCheckboxState, tooltip?: string},
    ) {
        super(label, collapsibleState);
        let tooltip = this.label;
        if (this.node)   {
            tooltip += '-' + this.node.id;
        }
        this.contextValue = this.details ? 'details' : '';
        this.tooltip = tooltip;
        if (checked !== null) {
            this.checkboxState = checked;
        }
    }
}
