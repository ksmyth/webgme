"use strict";

define(['js/PanelBase/PanelBaseWithHeader',
    'js/Widgets/AspectDesigner/AspectDesignerWidget'
], function (PanelBaseWithHeader,
             AspectDesignerWidget) {

    var AspectDesignerPanel,
        __parent__ = PanelBaseWithHeader;

    AspectDesignerPanel = function (layoutManager, params) {
        var options = {};
        //set properties from options
        options[PanelBaseWithHeader.OPTIONS.LOGGER_INSTANCE_NAME] = "AspectDesignerPanel";
        options[PanelBaseWithHeader.OPTIONS.HEADER_TITLE] = true;
        options[PanelBaseWithHeader.OPTIONS.HEADER_TOOLBAR] = true;

        //call parent's constructor
        __parent__.apply(this, [options]);

        this._client = params.client;

        //initialize UI
        this._initialize();

        this.logger.debug("AspectDesignerPanel ctor finished");
    };

    //inherit from PanelBaseWithHeader
    _.extend(AspectDesignerPanel.prototype, __parent__.prototype);

    AspectDesignerPanel.prototype._initialize = function () {
        var self = this;

        //set Widget title
        this.setTitle("AspectDesigner");

        this.widget = new AspectDesignerWidget(this.$el, {'toolBar': this.toolBar});

        this.widget.setTitle = function (title) {
            self.setTitle(title);
        };
    };

    /* OVERRIDE FROM WIDGET-WITH-HEADER */
    /* METHOD CALLED WHEN THE WIDGET'S READ-ONLY PROPERTY CHANGES */
    AspectDesignerPanel.prototype.onReadOnlyChanged = function (isReadOnly) {
        //apply parent's onReadOnlyChanged
        __parent__.prototype.onReadOnlyChanged.call(this, isReadOnly);

        this.widget.setReadOnly(isReadOnly);
    };

    AspectDesignerPanel.prototype.onResize = function (width, height) {
        this.logger.debug('onResize --> width: ' + width + ', height: ' + height);
        this.widget.onWidgetContainerResize(width, height);
    };

    return AspectDesignerPanel;
});