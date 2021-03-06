/*globals define, _, requirejs, WebGMEGlobal, Raphael*/

define(['logManager',
    'js/Widgets/DiagramDesigner/DiagramDesignerWidget.Constants'], function (logManager,
                                                                             DiagramDesignerWidgetConstants) {

    "use strict";

    var SearchManager;

    SearchManager = function (options) {
        this.logger = logManager.create(((options && options.loggerName) || "SearchManager"));

        this._diagramDesigner = options ? options.diagramDesigner : null;

        if (this._diagramDesigner === undefined || this._diagramDesigner === null) {
            this.logger.error("Trying to initialize a SearchManager without a diagramDesigner...");
            throw ("SearchManager can not be created");
        }

        this._highlightedElements = [];

        this.logger.debug("SearchManager ctor finished");
    };

    SearchManager.prototype.initialize = function (el) {
        var self = this;

        this.$el = el;

        this._diagramDesigner.addEventListener(this._diagramDesigner.events.ON_COMPONENT_DELETE, function (__diagramDesigner, componentId) {
            self._onComponentDelete(componentId);
        });
    };

    SearchManager.prototype.activate = function () {
        if (this._diagramDesigner.toolbarItems && this._diagramDesigner.toolbarItems.filterBox) {
            this._diagramDesigner.toolbarItems.filterBox.enabled(true);
            this._diagramDesigner.toolbarItems.filterBox.setText('');
        }
        this.filterItems('');
    };

    SearchManager.prototype.deactivate = function () {
        if (this._diagramDesigner.toolbarItems && this._diagramDesigner.toolbarItems.filterBox) {
            this._diagramDesigner.toolbarItems.filterBox.setText('');
            this._diagramDesigner.toolbarItems.filterBox.enabled(false);
        }
        this.filterItems('');
    };

    SearchManager.prototype.filterItems = function (searchDesc) {
        if (searchDesc && searchDesc !== '') {
            this.$el.addClass(DiagramDesignerWidgetConstants.HIGHLIGHT_MODE_CLASS);
            this._doSearch(searchDesc);
        } else {
            this.$el.removeClass(DiagramDesignerWidgetConstants.HIGHLIGHT_MODE_CLASS);
            this._clear();
        }
    };

    SearchManager.prototype._doSearch = function (searchDesc) {
        var results = [],
            itemIDs = this._diagramDesigner.itemIds,
            items = this._diagramDesigner.items,
            len,
            id,
            diff,
            idx;

        //go through the items first
        len = itemIDs.length;
        while (len--) {
            id = itemIDs[len];
            if (items[id].doSearch(searchDesc)) {
                results.push(id);
            }
        }

        //check deleted nodes
        diff = _.difference(this._highlightedElements, results);
        len = diff.length;
        while (len--) {
            id = diff[len];
            if (items[id]) {
                items[id].unHighlight();
            }
            idx = this._highlightedElements.indexOf(id);
            this._highlightedElements.splice(idx, 1);
        }

        //check added nodes
        diff = _.difference(results, this._highlightedElements);
        len = diff.length;
        while (len--) {
            id = diff[len];
            if (items[id]) {
                items[id].highlight();
            }
            this._highlightedElements.push(id);
        }
    };


    SearchManager.prototype._onComponentDelete = function (componentId) {
        var idx = this._highlightedElements.indexOf(componentId);

        if (idx !== -1) {
            this._highlightedElements.splice(idx, 1);
        }
    };

    SearchManager.prototype._clear = function () {
        //unhighlight all the highlighted
        var i = this._highlightedElements.length;

        while (i--) {
            this._diagramDesigner.items[this._highlightedElements[i]].unHighlight();
        }
        this._highlightedElements = [];
    };

    return SearchManager;
});
