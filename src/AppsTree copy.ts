import * as vscode from 'vscode';

const isNumeric = (num: any) => (typeof(num) === 'number' || typeof(num) === "string" && num.trim() !== '') && !isNaN(num as number);

import nodeHierarchy from "./config/structure.json";
import { Heroku } from './Heroku';

export class AppsTree implements vscode.TreeDataProvider<Dependency> {
    private hierarchy = {};
    constructor(private heroku: Heroku) {
        this.hierarchy = nodeHierarchy;
    }

    getTreeItem(element: Dependency): vscode.TreeItem {
        return element;
    }

    getChildren(element?: Dependency): Thenable<Dependency[]> {
        if (element)   {
            return this.getSubNodes(element);
        }

        // Creates dummy start element to load the menu
        let root : Dependency = new Dependency  (
            'root', {'ids': [], 'title' : 'root'}, vscode.TreeItemCollapsibleState.Collapsed, 'root'
        );

        return this.getSubNodes(root);
    }

    private async getSubNodes(element: Dependency): Promise<Dependency[]> {
        let nodes : Dependency[] = [];
        let newNodes = this.hierarchy[element.nodeType];

        if (newNodes.resource)  {
            const results = await this.heroku.apiFetch(this.hierarchy[element.nodeType].resource, element.node['ids'])
            if (results)    {
                results.forEach((data) => {
                    let nodeType = newNodes.nodeType;
                    let nodeLabelField = this.hierarchy[nodeType].index || 'name';
                    data['ids'] = { ...element.node['ids']};
                    data['ids'][data.type || element.nodeType] = data.id;  
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
                    let subNode = new Dependency(
                        data[nodeLabelField],
                        data,
                        collapsable,
                        nodeType,
                        null,
                        command,
                        this.hierarchy[nodeType].componentType, 
                    );
                    nodes.push(subNode);
                });
            };
        }
        if (newNodes.subMenus) {
            newNodes.subMenus.forEach((nodeType: string) => {
                // Check if submenus?
                let collapsable = (this.hierarchy[nodeType].subMenus || false)
                        ? vscode.TreeItemCollapsibleState.Collapsed
                        : vscode.TreeItemCollapsibleState.None;
                let newNode = {
                    ids: element.node['ids'],
                    title: element.node['title'] + ' > ' + (this.hierarchy[nodeType].label),
                };
                // Action?
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
        }
        return Promise.resolve(nodes);
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
    ) {
        super(label, collapsibleState);
        let tooltip = this.label;
        if (this.node)   {
            tooltip += '-' + this.node.id;
        }
        this.contextValue = this.details ? 'details' : '';
        this.tooltip = tooltip;
    }
}
