/*globals define, _, requirejs, WebGMEGlobal, Raphael*/

define(['./DiagramDesignerWidget.Constants'], function (DiagramDesignerWidgetConstants) {

    "use strict";

    var DiagramDesignerWidgetMouse,
        EVENT_POSTFIX = 'DiagramDesignerWidget';

    DiagramDesignerWidgetMouse = function () {
    };

    DiagramDesignerWidgetMouse.prototype.initialize = function (el) {
        this.$el = el;

        this._activateMouseListeners();
    };

    DiagramDesignerWidgetMouse.prototype._activateMouseListeners = function () {
        var self = this,
            logger = this.logger;

        //handle click on designer-items
        this.$el.on('mousedown.' + EVENT_POSTFIX, 'div.' + DiagramDesignerWidgetConstants.DESIGNER_ITEM_CLASS,  function (event) {
            var itemId = $(this).attr("id"),
                eventDetails = self._processMouseEvent(event, true, true, true, true);

            logger.debug('mousedown.item, ItemID: ' + itemId + ' eventDetails: ' + JSON.stringify(eventDetails));

            if (self.onItemMouseDown) {
                self.onItemMouseDown.call(self, itemId, eventDetails);
            } else {
                logger.warning('onItemMouseDown(itemId, eventDetails) is undefined, ItemID: ' + itemId + ' eventDetails: ' + JSON.stringify(eventDetails));
            }
        });

        //handle click on designer-connections
        this.$el.on('mousedown.' + EVENT_POSTFIX, 'path[class~="' + DiagramDesignerWidgetConstants.DESIGNER_CONNECTION_CLASS +'"]',  function (event) {
            var connId = $(this).attr("id").replace(DiagramDesignerWidgetConstants.PATH_SHADOW_ARROW_END_ID_PREFIX, "").replace(DiagramDesignerWidgetConstants.PATH_SHADOW_ID_PREFIX, ""),
                eventDetails = self._processMouseEvent(event, true, true, true, true);

            logger.debug('mousedown.connection, connId: ' + connId + ' eventDetails: ' + JSON.stringify(eventDetails));

            if (self.onConnectionMouseDown) {
                self.onConnectionMouseDown.call(self, connId, eventDetails);
            } else {
                logger.warning('onConnectionMouseDown(connId, eventDetails) is undefined, connId: ' + connId + ' eventDetails: ' + JSON.stringify(eventDetails));
            }
        });

        //handle mouse down on background
        this.$el.on('mousedown.' + EVENT_POSTFIX, function (event) {
            var eventDetails = self._processMouseEvent(event, true, true, true, true);

            logger.debug('mousedown.background, eventDetails: ' + JSON.stringify(eventDetails));

            if (self.onBackgroundMouseDown) {
                self.onBackgroundMouseDown.call(self, eventDetails);
            } else {
                logger.warning('onBackgroundMouseDown(eventDetails) is undefined, eventDetails: ' + JSON.stringify(eventDetails));
            }
        });

        //handle double-click on background
        this.$el.on('dblclick.' + EVENT_POSTFIX, function (event) {
            var eventDetails = self._processMouseEvent(event, true, true, true, true);

            if (self.onBackgroundDblClick) {
                self.onBackgroundDblClick.call(self, eventDetails);
            } else {
                logger.warning('onBackgroundDblClick(eventDetails) is undefined, eventDetails: ' + JSON.stringify(eventDetails));
            }

            logger.warning('dblclick.background, eventDetails: ' + JSON.stringify(eventDetails));
        });

        //disable context-menu on right-click
        this.$el.on('contextmenu.' + EVENT_POSTFIX, function (event) {
            //prevent default actions
            event.preventDefault();
            event.stopImmediatePropagation();
        });
    };

    DiagramDesignerWidgetMouse.prototype._processMouseEvent = function (event, triggerUIActivity, preventDefault, stopPropagation, stopImmediatePropagation) {
        //trigger that the user switched to this widget
        if (triggerUIActivity === true) {
            this._triggerUIActivity();
        }

        if (preventDefault === true) {
            event.preventDefault();
        }

        if (stopPropagation === true) {
            event.stopPropagation();
        }

        if (stopImmediatePropagation === true) {
            event.stopImmediatePropagation();
        }

        return this._getMouseEventDetails(event);
    };

    DiagramDesignerWidgetMouse.prototype._getMouseEventDetails = function (event) {
        var mousePos = this.getAdjustedMousePos(event),
            eventDetails = { 'rightClick': event.which === 3,
                             'ctrlKey': event.ctrlKey,
                             'metaKey': event.metaKey,
                             'altKey': event.altKey,
                             'shiftKey': event.shiftKey,
                             'mouseX': mousePos.mX,
                             'mouseY': mousePos.mY };

        return eventDetails;
    };

    DiagramDesignerWidgetMouse.prototype.trackMouseMoveMouseUp = function (fnMouseMove, fnMouseUp) {
        var self = this;

        $(document).on('mousemove.' + EVENT_POSTFIX, function (event) {
            var mouseDetails = self._processMouseEvent(event, false, true, true, true);

            if (fnMouseMove) {
                fnMouseMove.call(self, mouseDetails);
            }
        });

        $(document).on('mouseup.' + EVENT_POSTFIX, function (event) {
            var mouseDetails = self._processMouseEvent(event, false, true, true, true);

            $(document).off('mousemove.' + EVENT_POSTFIX);
            $(document).off('mouseup.' + EVENT_POSTFIX);

            if (fnMouseUp) {
                fnMouseUp.call(self, mouseDetails);
            }
        });
    };

    return DiagramDesignerWidgetMouse;
});
