/*globals define, Raphael, window, WebGMEGlobal, _*/

/**
 * @author rkereskenyi / https://github.com/rkereskenyi
 */

define(['js/PanelBase/PanelBaseWithHeader',
    'js/Widgets/PartBrowser/PartBrowserWidget',
    './PartBrowserPanelControl'], function (PanelBaseWithHeader,
                                            PartBrowserWidget,
                                            PartBrowserPanelControl) {

    "use strict";

    var PartBrowserPanel,
        __parent__ = PanelBaseWithHeader;

    PartBrowserPanel = function (layoutManager, params) {
        var options = {};
        //set properties from options
        options[PanelBaseWithHeader.OPTIONS.LOGGER_INSTANCE_NAME] = "PartBrowserPanel";
        options[PanelBaseWithHeader.OPTIONS.HEADER_TITLE] = false;

        //call parent's constructor
        __parent__.apply(this, [options]);

        this._client = params.client;

        //initialize UI
        this._initialize();

        this.logger.debug("PartBrowserPanel ctor finished");
    };

    //inherit from PanelBaseWithHeader
    _.extend(PartBrowserPanel.prototype, __parent__.prototype);

    PartBrowserPanel.prototype._initialize = function () {
        //set Widget title
        this.setTitle("Part Browser");

        this._partBrowserWidget = new PartBrowserWidget(this.$el);

        var cControl = new PartBrowserPanelControl(this._client, this._partBrowserWidget);
    };

    /* OVERRIDE FROM WIDGET-WITH-HEADER */
    /* METHOD CALLED WHEN THE WIDGET'S READ-ONLY PROPERTY CHANGES */
    PartBrowserPanel.prototype.onReadOnlyChanged = function (isReadOnly) {
        //apply parent's onReadOnlyChanged
        __parent__.prototype.onReadOnlyChanged.call(this, isReadOnly);

        this._partBrowserWidget.setReadOnly(isReadOnly);
    };

    return PartBrowserPanel;
});
