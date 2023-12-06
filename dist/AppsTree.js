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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dependency = exports.AppsTree = void 0;
const vscode = __importStar(require("vscode"));
const isNumeric = (num) => (typeof (num) === 'number' || typeof (num) === "string" && num.trim() !== '') && !isNaN(num);
const structure_json_1 = __importDefault(require("./config/structure.json"));
class AppsTree {
    constructor(heroku, context) {
        this.heroku = heroku;
        this.context = context;
        this.hierarchy = {};
        this.persistantData = null;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.hierarchy = structure_json_1.default;
        this.loadStoredData();
    }
    refresh(offset) {
        this._onDidChangeTreeData.fire(undefined);
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element) {
            return this.getSubNodes(element);
        }
        // Creates dummy start element to load the menu
        let root = new Dependency('root', { 'ids': [], 'title': 'root' }, vscode.TreeItemCollapsibleState.Collapsed, 'root');
        return this.getSubNodes(root);
    }
    getSubNodes(element) {
        return __awaiter(this, void 0, void 0, function* () {
            let nodes = [];
            let newNodes = this.hierarchy[element.nodeType];
            if (newNodes.subMenusTop) {
                nodes.push(...this.loadMenu(element, newNodes.subMenusTop));
            }
            if (newNodes.resource) {
                let dataNodes = [];
                const results = yield this.heroku.apiFetch(this.hierarchy[element.nodeType].resource, element.node['ids']);
                if (results) {
                    let checkUsed = false;
                    results.forEach((data) => {
                        let nodeType = newNodes.nodeType;
                        let nodeLabelField = this.hierarchy[nodeType].index || 'name';
                        data['ids'] = Object.assign({}, element.node['ids']);
                        data['ids'][nodeType] = data.id;
                        data['title'] = element.node['title'] + ' > ' + data[nodeLabelField];
                        // Action?
                        let command = null;
                        if (this.hierarchy[nodeType].command) {
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
                        if (nodeType == 'team') {
                            checkUsed = true;
                            if (this.persistantData.pinnedApps.includes(data[nodeLabelField])) {
                                checked = { state: vscode.TreeItemCheckboxState.Checked, tooltip: 'click to unpin' };
                            }
                            else {
                                checked = { state: vscode.TreeItemCheckboxState.Unchecked, tooltip: 'click to pin' };
                            }
                        }
                        let subNode = new Dependency(data[nodeLabelField], data, collapsable, nodeType, null, command, this.hierarchy[nodeType].componentType, null, checked);
                        dataNodes.push(subNode);
                    });
                    if (checkUsed) {
                        // Sort by selected and then label
                        dataNodes.sort((a, b) => {
                            const aState = a.checked.state || vscode.TreeItemCheckboxState.Unchecked;
                            const bState = b.checked.state || vscode.TreeItemCheckboxState.Unchecked;
                            if (aState == bState) {
                                return a.label.localeCompare(b.label);
                            }
                            return aState == vscode.TreeItemCheckboxState.Checked ? -1 : 1;
                        });
                    }
                    nodes.push(...dataNodes);
                }
                ;
            }
            if (newNodes.subMenus) {
                nodes.push(...this.loadMenu(element, newNodes.subMenus));
            }
            return Promise.resolve(nodes);
        });
    }
    loadMenu(element, subMenus) {
        let nodes = [];
        subMenus.forEach((nodeType) => {
            let newNode = {
                ids: element.node['ids'],
                title: element.node['title'] + ' > ' + (this.hierarchy[nodeType].label),
            };
            // Is there an action?
            let command = null;
            if (this.hierarchy[nodeType].command) {
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
            nodes.push(new Dependency(this.hierarchy[nodeType].label, newNode, collapsable, nodeType, null, command, this.hierarchy[nodeType].componentType, this.hierarchy[nodeType].details));
        });
        return nodes;
    }
    loadStoredData() {
        return __awaiter(this, void 0, void 0, function* () {
            const storageUri = this.context.globalStorageUri;
            this.storeURI = vscode.Uri.joinPath(storageUri, '/herokuConfig.json');
            // Load config data
            const existing = yield vscode.workspace.fs.readFile(this.storeURI);
            const persistantData = Buffer.from(existing).toString();
            this.persistantData = JSON.parse(persistantData);
        });
    }
    updatePinned(label, operation) {
        return __awaiter(this, void 0, void 0, function* () {
            if (operation) {
                this.persistantData.pinnedApps.push(label);
            }
            else {
                this.persistantData.pinnedApps = this.persistantData.pinnedApps.filter(arrayLabel => arrayLabel != label);
            }
            vscode.workspace.fs.writeFile(this.storeURI, Buffer.from(JSON.stringify(this.persistantData, null, 4)));
            this.refresh();
        });
    }
}
exports.AppsTree = AppsTree;
class Dependency extends vscode.TreeItem {
    constructor(label, node, collapsibleState, nodeType, subNodes, command, componentType, details, checked) {
        super(label, collapsibleState);
        this.label = label;
        this.node = node;
        this.collapsibleState = collapsibleState;
        this.nodeType = nodeType;
        this.subNodes = subNodes;
        this.command = command;
        this.componentType = componentType;
        this.details = details;
        this.checked = checked;
        let tooltip = this.label;
        if (this.node) {
            tooltip += '-' + this.node.id;
        }
        this.contextValue = this.details ? 'details' : '';
        this.tooltip = tooltip;
        if (checked !== null) {
            this.checkboxState = checked;
        }
    }
}
exports.Dependency = Dependency;
//# sourceMappingURL=AppsTree.js.map