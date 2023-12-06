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
    constructor(heroku) {
        this.heroku = heroku;
        this.hierarchy = {};
        this.hierarchy = structure_json_1.default;
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
            if (newNodes.resource) {
                const results = yield this.heroku.apiFetch(this.hierarchy[element.nodeType].resource, element.node['ids']);
                if (results) {
                    results.forEach((data) => {
                        let nodeType = newNodes.nodeType;
                        let nodeLabelField = this.hierarchy[nodeType].index || 'name';
                        data['ids'] = Object.assign({}, element.node['ids']);
                        data['ids'][data.type || element.nodeType] = data.id;
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
                        let subNode = new Dependency(data[nodeLabelField], data, collapsable, nodeType, null, command, this.hierarchy[nodeType].componentType);
                        nodes.push(subNode);
                    });
                }
                ;
            }
            if (newNodes.subMenus) {
                newNodes.subMenus.forEach((nodeType) => {
                    // Check if submenus?
                    let collapsable = (this.hierarchy[nodeType].subMenus || false)
                        ? vscode.TreeItemCollapsibleState.Collapsed
                        : vscode.TreeItemCollapsibleState.None;
                    let newNode = {
                        ids: element.node['ids'],
                        title: element.node['title'] + ' > ' + (this.hierarchy[nodeType].label),
                    };
                    // Action?
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
                    nodes.push(new Dependency(this.hierarchy[nodeType].label, newNode, collapsable, nodeType, null, command, this.hierarchy[nodeType].componentType, this.hierarchy[nodeType].details));
                });
            }
            return Promise.resolve(nodes);
        });
    }
}
exports.AppsTree = AppsTree;
class Dependency extends vscode.TreeItem {
    constructor(label, node, collapsibleState, nodeType, subNodes, command, componentType, details) {
        super(label, collapsibleState);
        this.label = label;
        this.node = node;
        this.collapsibleState = collapsibleState;
        this.nodeType = nodeType;
        this.subNodes = subNodes;
        this.command = command;
        this.componentType = componentType;
        this.details = details;
        let tooltip = this.label;
        if (this.node) {
            tooltip += '-' + this.node.id;
        }
        this.contextValue = this.details ? 'details' : '';
        this.tooltip = tooltip;
    }
}
exports.Dependency = Dependency;
//# sourceMappingURL=AppsTree%20copy.js.map