/* global Polymer */

(function(Polymer) {
    "use strict";

    Polymer("padlock-shutter", {
        publish: {
            open: {
                value: false,
                reflect: true
            }
        },
        blurFilterInput: function() {
            this.$.header.blurFilterInput();
        },
        focusFilterInput: function() {
            this.$.header.focusFilterInput();
        },
        openChanged: function() {
            if (this.open) {
                this.$.lockView.reset();
            }
        },
        focusPwdInput: function() {
            this.$.lockView.focusPwdInput();
        },
        cancelFilter: function() {
            this.$.header.cancelFilter();
        }
    });

})(Polymer);