/* jshint browser: true */
/* global Polymer, padlock */

(function(Polymer, platform) {
    "use strict";

    Polymer("padlock-settings-view", {
        headerOptions: {
            show: true,
            leftIconShape: "left",
            rightIconShape: ""
        },
        titleText: "Settings",
        leftHeaderButton: function() {
            this.fire("back");
        },
        //* Opens the change password dialog and resets the corresponding input elements
        changePassword: function() {
            this.$.changePasswordErrorDialog.open = false;
            this.$.currPwdInput.value = "";
            this.$.newPwdInput.value = "";
            this.$.confirmNewPwdInput.value = "";
            this.$.changePasswordDialog.open = true;
        },
        confirmChangePassword: function() {
            this.$.changePasswordDialog.open = false;
            // TODO: Add a better check for the current password
            if (this.$.currPwdInput.value != this.collection.defaultPassword) {
                this.$.changePasswordErrorMsg.innerHTML = "You entered the wrong current password.";
                this.$.changePasswordErrorDialog.open = true;
            } else if (this.$.newPwdInput.value != this.$.confirmNewPwdInput.value) {
                this.$.changePasswordErrorMsg.innerHTML =
                    "The new password you entered did not match the one in the confirmation input.";
                this.$.changePasswordErrorDialog.open = true;
            } else {
                this.collection.setPassword(this.$.newPwdInput.value);
                this.$.changePasswordSuccessDialog.open = true;
            }
        },
        closeChangePasswordErrorDialog: function() {
            this.$.changePasswordErrorDialog.open = false;
        },
        closeChangePasswordSuccessDialog: function() {
            this.$.changePasswordSuccessDialog.open = false;
        },
        //* Opens the dialog for connecting to the Padlock Cloud
        cloudConnect: function() {
            this.$.emailInput.value = this.settings.sync_email || "";
            this.$.deviceNameInput.value = this.settings.sync_device || "";
            this.$.connectDialog.open = true;
        },
        confirmConnect: function() {
            this.$.connectDialog.open = false;
            this.settings.sync_email = this.$.emailInput.value;
            this.settings.sync_device = this.$.deviceNameInput.value;
            this.settings.save();
            this.requestApiKey();
        },
        cloudDisconnect: function() {
            this.$.disconnectDialog.open = true;
        },
        confirmDisconnect: function() {
            this.$.disconnectDialog.open = false;
            this.settings.sync_connected = false;
            this.settings.sync_key = "";
            this.settings.save();
        },
        cancelDisconnect: function() {
            this.$.disconnectDialog.close();
        },
        //* Requests an api key from the cloud api with the entered email and device name
        requestApiKey: function() {
            var req = new XMLHttpRequest(),
                url = this.settings.sync_host + "auth/",
                email = this.$.emailInput.value,
                deviceName = this.$.deviceNameInput.value;

            // Show progress indicator
            this.$.progress.show();

            req.onreadystatechange = function() {
                if (req.readyState === 4) {
                    // Hide progress indicator
                    this.$.progress.hide();
                    if (req.status === 200) {
                        var apiKey = JSON.parse(req.responseText);
                        // We're getting back the api key directly, but it will valid only
                        // after the user has visited the activation link in the email he was sent
                        this.settings.sync_key = apiKey.key;
                        this.settings.sync_connected = true;
                        this.settings.save();
                        this.alert("Almost done! An email was sent to " + email + ". Please follow the " +
                            "instructions to complete the connection process!");
                    } else {
                        this.alert("Something went wrong. Please make sure your internet " +
                            "connection is working and try again!");
                    }
                }
            }.bind(this);

            req.open("POST", url, true);
            req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            req.setRequestHeader("Accept", "application/json");
            req.send("email=" + email + "&device_name=" + deviceName);
        },
        //* Shows an alert dialog with a given _message_
        alert: function(message) {
            this.$.alertText.innerHTML = message;
            this.$.alertDialog.open = true;
        },
        dismissAlert: function() {
            this.$.alertDialog.open = false;
        },
        //* Tap handler for the auto sync row. Toggles the auto sync toggle element
        toggleAutoSync: function(event) {
            // Make sure the event is not coming from the toggle element itself as this
            // would result in the element being toggled twice
            if (event.target != this.$.autoSyncToggle) {
                this.$.autoSyncToggle.toggle();
            }
        },
        //* Saves the current settings
        save: function() {
            this.settings.save();
        },
        import: function() {
            this.fire("import");
        },
        openWebsite: function() {
            window.open("http://padlock.io", "_system");
        },
        sendMail: function() {
            var url = "mailto:support@padlock.io";

            // window.location = "mailto:..." won't work in packaged chrome apps so we have to use window.open
            if (platform.isChromeApp()) {
                window.open(url);
            } else {
                window.location = url;
            }
        },
        openGithub: function() {
            window.open("http://github.com/maklesoft", "_system");
        },
        resetData: function() {
            this.$.resetConfirmPwd.value = "";
            this.$.resetDataDialog.open = true;
        },
        confirmResetData: function() {
            this.$.resetDataDialog.open = false;

            if (this.$.resetConfirmPwd.value == this.collection.defaultPassword) {
                this.collection.clear();
                this.collection.destroy();
                this.fire("reset");
            } else {
                this.alert("The password you entered was incorrect.");
            }
        },
        cancelResetData: function() {
            this.$.resetDataDialog.open = false;
        },
        resetRemoteData: function() {
            this.$.resetRemoteDataDialog.open = true;
        },
        confirmResetRemoteData: function() {
            this.$.resetRemoteDataDialog.open = false;

            var req = new XMLHttpRequest(),
                email = this.settings.sync_email,
                url = this.settings.sync_host + email;

            this.$.progress.show();

            req.onreadystatechange = function() {
                if (req.readyState === 4) {
                    // Hide progress indicator
                    this.$.progress.hide();
                    if (req.status === 202) {
                        this.alert("Almost done! An email was sent to " + email + ". Please follow the " +
                            "instructions to confirm the reset!");
                    } else {
                        this.alert("Something went wrong. Please make sure your internet " +
                            "connection is working and try again!");
                    }
                }
            }.bind(this);

            req.open("DELETE", url, true);
            req.send();
        },
        cancelResetRemoteData: function() {
            this.$.resetRemoteDataDialog.open = false;
        }
    });

})(Polymer, padlock.platform);