/*globals define, console*/
/**
 * @author nabana / https://github.com/nabana
 * @author lattmann / https://github.com/lattmann
 */

define([
    'util/guid',
    'js/Utils/ExportManager',
    'js/Utils/ImportManager'
],
    function (
        GUID,
        ExportManager,
        ImportManager
    ) {
        "use strict";

        var TreeNavigatorController,
            defaultConfig;

        defaultConfig = {
            scopeSelector: {
                hidden: true,
                items: [
                    {
                        id: 'project',
                        label: 'Project',
                        action: function () {
                            console.log('Show projects');
                        },
                        menu: [
                            {
                                items: [
                                    {
                                        id: 'preferences 1',
                                        label: 'Preferences 1'
                                    },
                                    {
                                        id: 'preferences 2',
                                        label: 'Preferences 2'
                                    },
                                    {
                                        id: 'preferences 3',
                                        label: 'Preferences 3',
                                        menu: [
                                            {
                                                items: [
                                                    {
                                                        id: 'sub_preferences 1',
                                                        label: 'Sub preferences 1'
                                                    },
                                                    {
                                                        id: 'sub_preferences 2',
                                                        label: 'Sub preferences 2'
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'composition',
                        label: 'Composition',
                        action: function () {
                            console.log('Show composition');
                        }
                    }
                ]
            },

            collapsedIconClass: 'fa fa-chevron-right',
            expandedIconClass: 'fa fa-chevron-down'

        };

        TreeNavigatorController = function ($scope, gmeClient) {
            var self = this;

            // this controller identifier
            self.guid = 'TreeNavigatorController_' + GUID();

            self.$scope = $scope;
            self.gmeClient = gmeClient;

            // internal data representation for fast access to objects
            self.treeNodes = {};

            self.initialize();
        };

        TreeNavigatorController.prototype.update = function () {
            if (!this.$scope.$$phase) {
                this.$scope.$apply();
            }
        };

        TreeNavigatorController.prototype.initialize = function () {
            var self = this;

            // initialize model structure for view
            self.$scope.treeData = {};

            self.$scope.config = defaultConfig;

            self.$scope.contextMenuData = null;

            self.$scope.onContextMenu = function(theNode) {
                var j,
                    childrenTypes,

                    createNewMenu,
                    createNewSubMenu,

                    createNewNode;

                console.log(theNode);

                if ( theNode ) {

                    createNewMenu = theNode.contextMenu[0].items[0];
                    createNewMenu.menu = [];
                    createNewMenu.menu.push({items: []});
                    createNewSubMenu = createNewMenu.menu[0].items; // select create new sub menu

                    if (self.gmeClient) {
                        createNewNode = function (data) {
                            var newId = self.gmeClient.createChild(data);
                            self.gmeClient.setAttributes(newId, 'name', 'New ' + self.gmeClient.getNode(data.baseId).getAttribute('name'));
                        };

                        childrenTypes = self.gmeClient.getValidChildrenTypes(theNode.id);

                        for (j = 0; j < childrenTypes.length; j += 1) {
                            createNewSubMenu.push({
                                id: childrenTypes[j],
                                label: self.gmeClient.getNode(childrenTypes[j]).getAttribute('name'),
                                actionData: {
                                    parentId: theNode.id,
                                    baseId: childrenTypes[j]
                                },
                                action: createNewNode
                            });
                        }
                    } else {
                        // TODO: generate test data
                        createNewNode = function (data) {
                            self.addNode(self.treeNodes[data.parentId], 'New node ' + GUID());
                        };

                        if (Math.random() > 0.5) {
                            createNewSubMenu.push({
                                id: 'newNodeHere',
                                label: 'New node here',
                                actionData: {
                                    parentId: theNode.id,
                                    baseId: null
                                },
                                action: createNewNode
                            });
                        }
                    }

                    if (createNewSubMenu.length > 0) {
                        createNewMenu.disabled = false;
                    } else {
                        createNewMenu.disabled = true;
                        createNewMenu.menu = [];
                    }

                    self.$scope.contextMenuData = theNode.contextMenu;
                } else {
                    self.$scope.contextMenuData = null;
                }
            };

            if (self.gmeClient) {
                self.initWithClient();
            } else {
                self.initTestData();
            }

            //console.log(self.$scope.treeData);
        };

        TreeNavigatorController.prototype.initTestData = function () {
            var self = this;

            // create a root node
            self.addNode(null, 'ROOT');

            // create some dummy nodes in the tree
            self.dummyTreeDataGenerator(self.$scope.treeData, 'Node item ', 5, 3);
        };

        TreeNavigatorController.prototype.initWithClient = function () {
            var self = this;

            // if branch changes then we need to reinitialize the tree data
            self.gmeClient.addEventListener(self.gmeClient.events.BRANCH_CHANGED, function (client, branchId) {

                //console.log(self.gmeClient.events.BRANCH_CHANGED, branchId);

                if (self.territoryId) {
                    // if there was a territory specified before it up
                    self.gmeClient.removeUI(self.territoryId);
                    self.territoryId = null;
                }

                // clear tree data structure
                self.$scope.treeData = {};
                self.treeNodes = {};

                // register patterns ROOT object + its siblings
                self.territoryPattern = {};
                self.territoryPattern[''] = { children: 1};

                // add this instance for listening to events
                self.territoryId = self.gmeClient.addUI(self, function (events) {
                    var i,
                        j,
                        event,
                        treeNode,
                        parentId,
                        parentNode,

                        childrenTypes,

                        createNewSubMenu;

                    for (i = 0; i < events.length; i += 1) {
                        event = events[i];
                        //console.log(event);

                        if (event.etype === 'load' || event.etype === 'update') {
                            if (self.treeNodes.hasOwnProperty(event.eid)) {
                                // we already have the tree node
                                treeNode = self.treeNodes[event.eid];
                                if (treeNode.parentId !== null && self.treeNodes.hasOwnProperty(treeNode.parentId)) {
                                    parentNode = self.treeNodes[treeNode.parentId];
                                }
                            } else {
                                // we have to create a new node in the tree
                                // get the parentId
                                parentId = self.gmeClient.getNode(event.eid).getParentId();
                                parentNode = parentId;

                                if (parentId || parentId === '') {
                                    // parent is not null or it is the root
                                    // get parent node from map
                                    parentNode = self.treeNodes[parentId];

                                } else {
                                    // this node has no parent, i.e. this is the root node
                                    parentNode = null;
                                }

                                // add the new node to the tree
                                treeNode = self.addNode(parentNode, event.eid);

                            }

                            // update all relevant properties
                            treeNode.label = self.gmeClient.getNode(event.eid).getAttribute('name');
                            treeNode.childrenCount = self.gmeClient.getNode(event.eid).getChildrenIds().length;

                            if (parentNode) {
                                // if parent node exists then the loading is done
                                // NOTE: loading is only done once the for loop ends
                                //       since UI is not updated before that it is ok to
                                //       update the flags here
                                parentNode.isLoading = false;
                                parentNode.loaded = true;

                                self.sortChildren(parentNode.children);
                            }

                        } else if (event.etype === 'unload') {
                            self.removeNode(event.eid);
                        }
                    }

                    // indicate data model changes
                    self.update();

                }, self.guid);

                // update the territory with the new rules
                self.gmeClient.updateTerritory(self.territoryId, self.territoryPattern);
            });
        };

        /**
         * Adds a new node to the tree
         * @param parentTreeNode parent node, if null then it creates a root node
         * @param id unique id of the tree node if gmeClient exists otherwise label
         * @returns {*} the newly created node
         */
        TreeNavigatorController.prototype.addNode = function (parentTreeNode, id) {
            var self = this,
                newTreeNode,
                children = [],

                nodeClick,
                expanderClick;

            nodeClick = function (theNode) {
                console.log(theNode.id + ' ' + theNode.label + ' was clicked');
            };

            if (self.gmeClient) {
                expanderClick = function (theNode) {
                    console.log(theNode.id + ' ' + theNode.label + ' was expander-clicked');

                    if (theNode.children.length === 0 && !theNode.isLoading && !theNode.loaded) {

                        theNode.isLoading = true;

                        self.update();

                        // add new rules to territory
                        self.territoryPattern[theNode.id] = { children: 1};
                        self.gmeClient.updateTerritory(self.territoryId, self.territoryPattern);

                        if (self.gmeClient.getNode(theNode.id).getChildrenIds().length === 0) {
                            // if there are no children we are done
                            theNode.isLoading = false;
                            theNode.loaded = true;
                        }

                        // this node is expanded now
                        theNode.expanded = true;

                    } else {
                        // Expand-collapse
                        theNode.expanded = !theNode.expanded;
                    }
                };
            } else {
                expanderClick = function (theNode) {
                    console.log(theNode.id + ' ' + theNode.label + ' was expander-clicked');

                    if (theNode.children.length === 0 && !theNode.isLoading && !theNode.loaded) {

                        theNode.isLoading = true;

                        self.update();

                        // emulate async loading of objects
                        setTimeout(
                            function () {
                                self.dummyTreeDataGenerator(theNode, 'Async ' + id, 5, 0);

                                theNode.isLoading = false;
                                theNode.loaded = true;
                                theNode.expanded = true;

                                self.update();
                            },
                            2000
                        );
                    } else {
                        // Expand-collapse
                        theNode.expanded = !theNode.expanded;
                    }
                };
            }

            // node structure
            newTreeNode = {
                label: id,
                extraInfo: 'Extra info',
                children: children,
                childrenCount: 0,
                expanded: false,
                isLoading: false,
                loaded: false,
                nodeData: {
                },
                nodeClick: nodeClick,
                expanderClick: expanderClick,
                iconClass: 'fa fa-file-o',
                contextMenu: [],                            // defined below
                onContextMenu: self.$scope.onContextMenu
            };

            // get a unique id for tree node
            if (self.gmeClient) {
                newTreeNode.id = id;
            } else {
                // for testing use a random GUID
                newTreeNode.id = GUID();
            }

            // add the new node to the map
            self.treeNodes[newTreeNode.id] = newTreeNode;


            // define context menu
            newTreeNode.contextMenu = [
                {
                    items: [
                        {
                            id: 'create',
                            label: 'Create new',
                            disabled: true,
                            iconClass: 'fa fa-plus',
                            menu: []
                        },
//                            {
//                                id: 'toggleCollapse',
//                                label: theNode.expanded ? 'Collapse' : 'Expand',
//                                actionData: newTreeNode,
//                                action: expanderClick
//                            },
                        {
                            id: 'dummy',
                            label: 'Just for test ' + newTreeNode.id
                        },
                        {
                            id: 'rename',
                            label: 'Rename'
                        },
                        {
                            id: 'delete',
                            label: 'Delete',
                            iconClass: 'fa fa-minus',
                            actionData: {
                                id: newTreeNode.id
                            },
                            action: function (data) {
                                if (self.gmeClient) {
                                    self.gmeClient.delMoreNodes([data.id]);
                                } else {
                                    self.removeNode(data.id);
                                }
                            }
                        },
                        {
                            id: 'exportObject',
                            label: 'Export object ...'
                        },
                        {
                            id: 'importHere',
                            label: 'Import here ...'
                        },
                        {
                            id: 'mergeHere',
                            label: 'Merge here ...'
                        },
                        {
                            id: 'exportContext',
                            label: 'Export context ...'
                        },
                        {
                            id: 'library',
                            label: 'Library',
                            menu: [
                                {
                                    items: [
                                        {
                                            id: 'exportAsLibrary',
                                            label: 'Export as library ...',
                                            actionData: {
                                                id: newTreeNode.id
                                            },
                                            action: function (data) {
                                                if (self.gmeClient) {
                                                    ExportManager.expLib(data.id);
                                                } else {
                                                    console.log('Export as a library ', data);
                                                }
                                            }
                                        },
                                        {
                                            id: 'updateLibraryFromFile',
                                            label: 'Update library from file ...',
                                            actionData: {
                                                id: newTreeNode.id
                                            },
                                            action: function (data) {
                                                if (self.gmeClient) {
                                                    ImportManager.importLibrary(data.id);
                                                } else {
                                                    console.log('Update library from file ', data);
                                                }
                                            }
                                        },
                                        {
                                            id: 'importLibraryHere',
                                            label: 'Import library here ...',
                                            actionData: {
                                                id: newTreeNode.id
                                            },
                                            action: function (data) {
                                                if (self.gmeClient) {
                                                    ImportManager.addLibrary(data.id);
                                                } else {
                                                    console.log('Import library here ', data);
                                                }
                                            }
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            id: 'preferences 3',
                            label: 'Preferences 3',
                            menu: [
                                {
                                    items: [
                                        {
                                            id: 'sub_preferences 1',
                                            label: 'Sub preferences 1'
                                        },
                                        {
                                            id: 'sub_preferences 2',
                                            label: 'Sub preferences 2'
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ];


            // TODO: add context menu
            // TODO: add delete - on delete and in context menu
            // TODO: add create new object (using meta model rules) - disabled and enabled types?
            // TODO: add copy to clipboard
            // TODO: add open in Visualizer
            // TODO: add rename
            // TODO: add library business (export as library, update library from file, import library here)
            // TODO: collapse expand
            // TODO: handle double click
            // TODO: show meta types - config
            // TODO: show icon

            if (parentTreeNode) {
                // if a parent was given add the new node as a child node
                parentTreeNode.iconClass = undefined;
                parentTreeNode.children.push(newTreeNode);


                parentTreeNode.childrenCount = parentTreeNode.children.length;

                if (self.gmeClient) {
                    //newTreeNode.id = id;
                    newTreeNode.childrenCount = self.gmeClient.getNode(id).getChildrenIds().length;
                } else {
                    // for testing use a random GUID
                    if ( newTreeNode.childrenCount === 0 ) {
                        newTreeNode.childrenCount = Math.round(Math.random());
                    }
                }

                if (newTreeNode.childrenCount) {
                    newTreeNode.iconClass = undefined;
                }

                self.sortChildren(parentTreeNode.children);

                newTreeNode.parentId = parentTreeNode.id;
            } else {

                // if no parent is given replace the current root node with this node
                self.$scope.treeData = newTreeNode;
                newTreeNode.parentId = null;
            }

            return newTreeNode;
        };

        TreeNavigatorController.prototype.removeNode = function (id) {
            var self = this,
                parentNode,
                nodeToDelete = self.treeNodes[id];

            if (nodeToDelete) {
                if (nodeToDelete.parentId !== null && self.treeNodes[nodeToDelete.parentId] !== undefined) {
                    // find parent node
                    parentNode = self.treeNodes[nodeToDelete.parentId];

                    // remove nodeToDelete from parent node's children
                    parentNode.children = parentNode.children.filter(function (el) {
                        return el.id !== id;
                    });

                    if (self.gmeClient) {
                        parentNode.childrenCount = self.gmeClient.getNode(nodeToDelete.parentId).getChildrenIds().length;
                    } else {
                        parentNode.childrenCount = parentNode.children.length;
                    }

                    if (parentNode.childrenCount === 0) {
                        parentNode.iconClass = 'fa fa-file-o';
                    }
                }

                delete self.treeNodes[id];
            }

        };

        TreeNavigatorController.prototype.collapseAll = function () {
            var self = this,
                id;

            for (id in self.treeNodes) {
                if (self.treeNodes.hasOwnProperty(id)) {
                    self.treeNodes[id].expanded = false;
                }
            }

            self.update();
        };

        TreeNavigatorController.prototype.expandNodes = function (nodeIdList) {
            var self = this,
                i,
                id;

            nodeIdList = nodeIdList || [];

            for (i = 0; i < nodeIdList.length; i += 1) {
                id = nodeIdList[i].id;
                if (self.treeNodes.hasOwnProperty(id)) {
                    self.treeNodes[id].expanded = true;
                }
            }

            self.update();
        };

        TreeNavigatorController.prototype.dummyTreeDataGenerator = function (
            treeNode,
            name,
            maxCount,
            levels
        ) {
            var self = this,
                i,
                id,
                count,
                childNode;

            levels = levels || 0;

            count = Math.round(
                Math.random(
                ) * maxCount
            ) + 1;

            for (i = 0; i < count; i += 1) {
                id = name + i;

                childNode = self.addNode(treeNode, id);

                if (levels > 0) {
                    self.dummyTreeDataGenerator(childNode, id + '.', maxCount, levels - 1);
                }
            }
        };

        TreeNavigatorController.prototype.sortChildren = function (values) {
            var orderBy = ['label', 'id'];

            values.sort(function (a, b) {
                var i,
                    key,
                    result;

                for (i = 0; i < orderBy.length; i += 1) {
                    key = orderBy[i];
                    if (a.hasOwnProperty(key) && b.hasOwnProperty(key)) {
                        result = a[key].toLowerCase().localeCompare(b[key].toLowerCase());
                        if (result !== 0) {
                            return result;
                        }
                    }
                }

                // a must be equal to b
                return 0;
            });

            return values;
        };

        return TreeNavigatorController;
    });