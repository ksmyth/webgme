/*globals define, console, WebGMEGlobal*/
/**
 * @author nabana / https://github.com/nabana
 * @author lattmann / https://github.com/lattmann
 */

define([
    'util/guid',
    'js/Utils/GMEConcepts',
    'logManager',
    'js/Constants'
], function (
    GUID,
    GMEConcepts,
    logManager,
    CONSTANTS
) {
    'use strict';

    var PropertyGridController = function ( $scope, gmeClient ) {
        var self = this;

        // this controller identifier
        self.guid = 'PropertyGridController_' + GUID();

        self.logger = logManager.create( self.guid );

        self.$scope = $scope;
        self.gmeClient = gmeClient;

        // gmeClient specific objects
        self.currentObjectId = null;
        self.territoryId = null;

        self.initialize();
    };

    PropertyGridController.prototype.update = function () {
        if ( !this.$scope.$$phase ) {
            this.$scope.$apply();
        }
    };

    PropertyGridController.prototype.initialize = function () {
        var self = this,
            onChange,

            attributes,
            visualizationProperties,
            propertyGroup1,
            propertyGroup2,
            propertyGroups;

        // initialize default configuration
        self.config = {
            propertyLabelPostfix: ':',
            mode: 'read'
        };

        // data model
        self.$scope.grid = {};

        if ( self.gmeClient ) {
            // initialize with gmeClient
            self.$scope.grid = {};

            // TODO: in destroy function WebGMEGlobal.State.off
            WebGMEGlobal.State.on('change:' + CONSTANTS.STATE_ACTIVE_OBJECT, self.stateActiveObjectChanged, self);

        } else {
            // initialize test with data

            onChange = function (item) {
                console.log('Item changed > ' + item.label, item);
            };

            attributes = [
                {
                    id: 'Name',
                    label: 'Name',
                    values: [
                        {
                            value: 'This is my name'
                        }
                    ],
                    onChange: onChange
                },
                {

                    id: 'compound',
                    label: 'Compound something',
                    cssClass: '',
                    values: [
                        {
                            value: [
                                {
                                    items: [
                                        {
                                            id: 'Position_x',
                                            label: 'X',
                                            value: 10
                                            //valueWidget: integerValueWidget,
                                        },
                                        {
                                            id: 'Position_y',
                                            label: 'Y',
                                            value: 30
                                            //valueWidget: integerValueWidget,
                                        }
                                    ]
                                }
                            ],
                            widget: {
                                type: 'compound'
                            }
                        }
                    ],
                    onChange: onChange
                },
                {
                    id: 'is_happy',
                    label: 'Happy or not?',
                    values: [
                        { value: true }
                    ]
                },
                {
                    id: 'country',
                    label: 'Country',
                    values: [
                        {
                            value: 'usa',
                            widget: {
                                type: 'select',
                                defaultValue: 'pol',
                                config: {
                                    multi: false,
                                    options: [
                                        {
                                            label: 'U.S.A.',
                                            value: 'usa'
                                        },
                                        {
                                            label: 'Poland',
                                            value: 'pol'
                                        },
                                        {
                                            label: 'England',
                                            value: 'eng'
                                        }
                                    ]
                                }
                            }

                        }
                    ],
                    onChange: onChange
                }
            ];
            visualizationProperties = [
                {
                    id: 'color',
                    label: 'Color',
                    values: [
                        {
                            value: '#ff0066',
                            widget: {
                                type: 'colorPicker'
                            }
                        }
                    ],
                    onChange: onChange
                },

                {

                    id: 'Position',
                    label: 'Position',
                    cssClass: '',
                    values: [

                        {
                            id: 'Position_x',
                            label: 'X',
                            value: 10
                            //valueWidget: integerValueWidget,
                        },
                        {
                            id: 'Position_y',
                            label: 'Y',
                            value: 30
                            //valueWidget: integerValueWidget,
                        }
                    ],
                    onChange: onChange
                }

            ];

            propertyGroup1 = {
                label: 'Attributes',
                expanded: true,
                items: attributes
            };
            propertyGroup2 = {
                label: 'Visualization properties',
                expanded: true,
                items: visualizationProperties
            };
            propertyGroups = [ propertyGroup1, propertyGroup2 ];

            self.$scope.grid = {
                propertyGroups: propertyGroups,
                config: self.config,
                id: 'propertyGrid1'
            };
        }
    };

    PropertyGridController.prototype.setReadOnly = function (isReadOnly) {
        console.warn('TODO: change read only state to isReadOnly: ', isReadOnly);
    };

    PropertyGridController.prototype.stateActiveObjectChanged = function (model, activeObjectId) {
        var self = this,
            pattern;

        if (self.currentObjectId === activeObjectId) {
            return;
        }

        if (self.territoryId) {
            // TODO: clean up the territory
            self.gmeClient.removeUI(self.territoryId);
            self.territoryId = null;

            self.$scope.grid = {};
        }

        self.currentObjectId = activeObjectId;

        if (self.currentObjectId || self.currentObjectId === CONSTANTS.PROJECT_ROOT_ID) {

            pattern = {};
            pattern[self.currentObjectId] = { "children": 0 };

            self.territoryId = self.gmeClient.addUI(self, function (events) {
                var event;

                if (events.length === 0) {
                    return;
                }

                event = events[0];

                if (event.etype === 'load' || event.etype === 'update') {
                    self.updateProperties(event.eid);

                } else if (event.etype === 'unload') {
                    self.$scope.grid = {};

                    self.update();
                } else {
                    self.logger.error('Unhandled event type: ' + event.etype + ' (id) ' + event.eid);
                }

            }, self.guid);

            self.gmeClient.updateTerritory(self.territoryId, pattern);

        } else {
            self.logger.warning('No active object.');
        }
    };

    PropertyGridController.prototype.updateProperties = function (nodeId) {
        var self = this,
            nodeObj = self.gmeClient.getNode(nodeId),
            i,

            attributes,
            attributeNames,
            registry,
            registryNames,
            pointers,
            pointerNames,

            propertyGroupGeneral,
            propertyGroupAttributes,
            propertyGroupRegistry,
            propertyGroupPointers,

            propertyGroups,

            onChange;

        onChange = function () {
            self.logger.warning('TODO: handle property change event: ' + JSON.stringify(arguments));
        };


        // general properties
        propertyGroupGeneral = {
            label   : 'General',
            expanded: true,
            items   : []
        };

        // TODO: this is read-only
        propertyGroupGeneral.items.push({
            id      : 'guid',
            label   : 'GUID',
            values  : {
                value : nodeObj.getGuid()
            },
            onChange: null
        });

        // TODO: this should be a link, when we copy the value
        propertyGroupGeneral.items.push({
            id      : 'id',
            label   : 'ID',
            values  : {
                value: nodeObj.getId()
            },
            onChange: null
        });


        // attributes
        propertyGroupAttributes = {
            label   : 'Attributes',
            expanded: true,
            items   : []
        };

        attributeNames = nodeObj.getAttributeNames();

        for (i = 0; i < attributeNames.length; i += 1) {
            // TODO: handle types and complex values

            propertyGroupAttributes.items.push({
                id      : attributeNames[i],
                label   : attributeNames[i],
                values  : {
                    value: nodeObj.getAttribute( attributeNames[i] )
                }
            });
        }

        // pointers
        propertyGroupPointers = {
            label   : 'Pointers',
            expended: false,
            items   : []
        };

        pointerNames = nodeObj.getPointerNames();

        for (i = 0; i < pointerNames.length; i += 1) {
            // TODO: handle types and complex values
            propertyGroupPointers.items.push({
                id      : pointerNames[i],
                label   : pointerNames[i],
                values  : {
                    value: nodeObj.getPointer( pointerNames[i] )
                }
            });
        }

        // registry
        propertyGroupRegistry = {
            label   : 'Registry',
            expended: false,
            items   : []
        };

        registryNames = nodeObj.getRegistryNames();

        for (i = 0; i < registryNames.length; i += 1) {
            // TODO: handle types and complex values
            propertyGroupRegistry.items.push({
                id      : registryNames[i],
                label   : registryNames[i],
                values  : {
                    value: nodeObj.getRegistry(registryNames[i])
                }
            });
        }


        propertyGroups = [
            propertyGroupGeneral,
            propertyGroupAttributes,
            propertyGroupPointers,
            propertyGroupRegistry
        ];

        self.$scope.grid = {
            propertyGroups: propertyGroups,
            config: self.config,
            id: self.guid
        };

        self.update();
    };

    return PropertyGridController;
}
);