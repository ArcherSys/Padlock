/* jshint browser: true */
/* global Polymer, padlock */

(function(Polymer, platform, CloudSource) {
    "use strict";

    Polymer("padlock-app", {
        observe: {
            "settings.order_by": "saveSettings"
        },
        filterString: "",
        init: function(collection, settings, categories) {
            this.collection = collection;
            this.settings = settings;
            this.categories = categories;

            this.settings.fetch();

            this.categories.fetch();

            this.collection.exists({success: this.initView.bind(this), fail: this.initView.bind(this, false)});

            // If we want to capture all keydown events, we have to add the listener
            // directly to the document
            document.addEventListener("keydown", this.keydown.bind(this), false);

            // Listen for android back button
            document.addEventListener("backbutton", this.back.bind(this), false);

            // Lock app when it goes into the background
            document.addEventListener("resign", this.lock.bind(this), false);
            document.addEventListener("pause", this.lock.bind(this), false);
        },
        initView: function(collExists) {
            var isTouch = platform.isTouch();
            // If there already is data in the local storage ask for password
            // Otherwise start with choosing a new one
            this.$.shutter.startMode = !collExists;
            if (collExists && !isTouch) {
                setTimeout(this.$.shutter.focusPwdInput.bind(this.$.shutter), 10);
            }

            // open the first view
            this.openView(this.$.listView, { animation: "" });
        },
        pwdEnter: function(event, detail) {
            this.unlock(detail.password);
        },
        newPwd: function(event, detail) {
            this.collection.setPassword(detail.password);
            this.$.shutter.open = true;
            setTimeout(function() {
                this.$.shutter.startMode = false;
            }.bind(this), 500);
        },
        //* Tries to unlock the current collection with the provided password
        unlock: function(password) {
            if (this.decrypting) {
                // We're already busy decrypting the data, so no unlocking right now!
                return;
            }
            this.decrypting = true;
            this.$.decrypting.show();
            this.collection.fetch({password: password, success: function() {
                this.$.shutter.errorMessage = null;
                this.$.shutter.enterLocked = false;
                this.$.decrypting.hide();
                this.decrypting = false;
                setTimeout(function() {
                    if (this.settings.sync_connected && this.settings.sync_auto) {
                        this.synchronize();
                    }
                    this.$.shutter.open = true;
                }.bind(this), 100);
            }.bind(this), fail: function() {
                this.$.shutter.errorMessage = "Wrong password!";
                this.$.shutter.enterLocked = false;
                this.$.decrypting.hide();
                this.decrypting = false;
            }.bind(this)});
        },
        //* Locks the collection and opens the lock view
        lock: function() {
            this.$.mainMenu.open = false;

            // Remove the stored password from the remote source if we've created on yet
            if (this.remoteSource) {
                delete this.remoteSource.password;
            }
            
            this.$.shutter.open = false;
            setTimeout(this.collection.clear.bind(this.collection), 500);
        },
        //* Change handler for the selected property; Opens the record view when record is selected
        selectedChanged: function() {
            if (this.selected) {
                this.$.recordView.record = this.selected;
                this.openView(this.$.recordView);
                this.$.shutter.blurFilterInput();
            }
        },
        /**
         * Opens the provided _view_
         */
        openView: function(view, inOpts, outOpts) {
            var views = this.shadowRoot.querySelectorAll(".view").array(),
                // Choose left or right animation based on the order the views
                // are included in the app
                back = views.indexOf(view) < views.indexOf(this.currentView);

            // Unless otherwise specified, use a right-to-left animation when navigating 'forward'
            // and a left-to-right animation when animating 'back'
            inOpts = inOpts || {};
            if (!("animation" in inOpts)) {
                inOpts.animation = back ? "slideInFromLeft": "slideInFromRight";
            }
            outOpts = outOpts || {};
            if (!("animation" in outOpts)) {
                outOpts.animation = back ? "slideOutToRight": "slideOutToLeft";
            }

            // Hide current view (if any)
            if (this.currentView) {
                // Start the in animation after a small delay
                setTimeout(view.show.bind(view, inOpts), 100);
                this.currentView.hide(outOpts);
            } else {
                view.show(inOpts);
            }
            this.currentView = view;
        },
        //* Saves changes to the currently selected record (if any)
        saveRecord: function() {
            var record = this.selected;
            if (record) {
                // Save the changes
                this.collection.save({record: record});
                this.$.listView.prepareRecords();
                if (this.settings.sync_connected && this.settings.sync_auto) {
                    this.synchronize();
                }
            }
        },
        //* Opens the dialog for adding a new record
        addRecord: function() {
            this.$.addInput.value = "";
            this.$.addDialog.open = true;
            // this.$.addInput.focus();
        },
        confirmAddRecord: function() {
            this.$.addDialog.open = false;
            var record = {
                name: this.$.addInput.value,
                fields: this.settings.default_fields.map(function(field) {
                    return {name: field, value: ""};
                })
            };

            this.collection.add(record);

            // select the newly added record (which will open the record view)
            this.selected = record;
            this.saveRecord();
        },
        //* Deletes the currently selected record (if any)
        deleteRecord: function() {
            this.collection.remove(this.selected);
            this.collection.save();
            this.$.listView.prepareRecords();
            this.recordViewBack();
            // Auto sync
            if (this.settings.sync_connected && this.settings.sync_auto) {
                this.synchronize();
            }
        },
        recordViewBack: function() {
            this.selected = null;
            this.openView(this.$.listView);
        },
        openMainMenu: function() {
            this.$.mainMenu.open = true;
        },
        openSettings: function() {
            this.$.mainMenu.open = false;
            this.$.notConnectedDialog.open = false;
            this.openView(this.$.settingsView);
        },
        settingsBack: function() {
            this.openView(this.$.listView);
        },
        openImportView: function() {
            this.openView(this.$.importView);
        },
        //* Add the records imported with the import view to the collection
        saveImportedRecords: function(event, detail) {
            this.collection.add(detail.records);
            this.collection.save();
            this.alert(detail.records.length + " records imported!");
            this.openView(this.$.listView);
            // Auto sync
            if (this.settings.sync_connected && this.settings.sync_auto) {
                this.synchronize();
            }
        },
        importBack: function() {
            this.openView(this.$.listView);
        },
        //* Triggers the headers scrim to match the scrim of the opened dialog
        dialogOpen: function() {
            this.$.shutter.scrim = true;
        },
        //* Removes the headers scrim
        dialogClose: function() {
            this.$.shutter.scrim = false;
        },
        //* Show an alert dialog with the provided message
        alert: function(msg) {
            this.$.alertText.innerHTML = msg;
            this.$.alertDialog.open = true;
        },
        dismissAlert: function() {
            this.$.alertDialog.open = false;
        },
        //* Keyboard shortcuts
        keydown: function(event) {
            var shortcut;

            // If the shutter is closed, ignore all shortcuts
            if (!this.$.shutter.open) {
                return;
            }

            // CTRL/CMD + F -> Filter
            if ((event.ctrlKey || event.metaKey) && event.keyCode === 70 && this.currentView.headerOptions.showFilter) {
                shortcut = this.$.shutter.focusFilterInput.bind(this.$.shutter);
            }
            // DOWN -> Mark next
            else if (event.keyCode == 40) {
                if (this.currentView.markNext) {
                    shortcut = this.currentView.markNext.bind(this.currentView);
                }
            }
            // UP -> Mark previous
            else if (event.keyCode == 38) {
                if (this.currentView.markPrev) {
                    shortcut = this.currentView.markPrev.bind(this.currentView);
                }
            }
            // ENTER -> Select marked
            else if (event.keyCode == 13) {
                if (this.currentView.selectMarked) {
                    shortcut = this.currentView.selectMarked.bind(this.currentView);
                }
            }
            // ESCAPE -> Back
            else if (event.keyCode == 27) {
                shortcut = this.back.bind(this);
            }
            // CTRL/CMD + C -> Copy
            else if ((event.ctrlKey || event.metaKey) && event.keyCode === 67 &&
                this.currentView == this.$.recordView) {
                shortcut = this.$.recordView.copyToClipboard.bind(this.$.recordView);
            }

            // If one of the shortcuts matches, execute it and prevent the default behaviour
            if (shortcut) {
                shortcut();
                event.preventDefault();
            }
        },
        //* Adds any categories inside of _records_ that don't exist yet
        updateCategories: function(records) {
            records.forEach(function(rec) {
                if (rec.category && !this.categories.get(rec.category)) {
                    this.categories.set(rec.category, this.categories.autoColor());
                }
            }.bind(this));

            this.categories.save();
            this.$.categoriesView.updateCategories();
        },
        openCategories: function() {
            this.openView(this.$.categoriesView, {animation: ""}, {animation: "slideOutToBottom"});
        },
        categoriesDone: function() {
            this.openView(this.$.recordView, {
                animation: "slideInFromBottom",
                endCallback: this.saveRecord.bind(this)
            }, {
                animation: "fadeOut"
            });
        },
        categoryChanged: function(event, detail) {
            this.collection.records.forEach(function(rec) {
                if (rec.category == detail.prev.name) {
                    rec.category = detail.curr.name;
                    rec.catColor = detail.curr.color;
                }
            });
        },
        //* Synchronizes the data with a remote source
        synchronize: function(remotePassword) {
            // Ignore the remotePassword argument if it is not a string
            remotePassword = typeof remotePassword === "string" ? remotePassword : undefined;
            // In case this was called from the menu
            this.$.mainMenu.open = false;

            // Check if the user has connected the client to the cloud already.
            // If not, prompt him to do so
            if (this.settings.sync_connected) {
                this.remoteSource = this.remoteSource || new CloudSource();
                this.remoteSource.host = this.settings.sync_host;
                this.remoteSource.email = this.settings.sync_email;
                this.remoteSource.apiKey = this.settings.sync_key;

                this.$.synchronizing.show();

                this.collection.sync(this.remoteSource, {
                    remotePassword: remotePassword,
                    success: function() {
                        this.$.synchronizing.hide();

                        // If we explicitly used a differen password for the remote source than for the local source,
                        // ask the user if he wants to update the remote password
                        if (remotePassword !== undefined && this.collection.defaultPassword !== remotePassword) {
                            this.$.updateRemotePasswordDialog.open = true;
                        }
                    }.bind(this),
                    fail: function(e) {
                        if (e && e.message && e.message.indexOf("CORRUPT: ccm: tag doesn't match") !== -1) {
                            // Decryption failed, presumably on the remote data. This means that the local master
                            // password does not match the one that was used for encrypting the remote data so
                            // we need to prompt the user for the correct password.
                            this.$.remotePasswordDialog.open = true;
                        } else {
                            var msg = e.status == 401 ?
                                "Authentication failed. Have you completed the connection process for Padlock Cloud? " +
                                "If the problem persists, try to disconnect and reconnect under settings!" :
                                "An error occurred while synchronizing. Please try again later!";
                            this.alert(msg);
                        }
                        this.$.synchronizing.hide();
                    }.bind(this)
                });
            } else {
                this.$.notConnectedDialog.open = true;
            }
        },
        dismissNotConnectedDialog: function() {
            this.$.notConnectedDialog.open = false;
        },
        remotePasswordEntered: function() {
            this.$.remotePasswordDialog.open = false;
            this.synchronize(this.$.remotePasswordInput.value);
            this.$.remotePasswordInput.value = "";
        },
        confirmUpdateRemotePassword: function() {
            this.$.updateRemotePasswordDialog.open = false;
            this.$.synchronizing.show();
            this.collection.save({
                source: this.remoteSource,
                password: this.collection.defaultPassword,
                success: this.$.synchronizing.hide.bind(this.$.synchronizing),
                fail: function() {
                    this.$.synchronizing.hide();
                    this.alert("Failed to update remote password. Try again later!");
                }.bind(this)
            });
        },
        cancelUpdateRemotePassword: function() {
            this.$.updateRemotePasswordDialog.open = false;
        },
        //* Back method. Chooses the right back method based on the current view
        back: function() {
            this.currentView.back();
            var dialogs = this.shadowRoot.querySelectorAll("padlock-dialog");
            Array.prototype.forEach.call(dialogs, function(dialog) {
                dialog.open = false;
            });

            // If we're in the list view, clear the filter input and restore the full list
            if (this.currentView == this.$.listView) {
                this.$.shutter.cancelFilter();
            }
        },
        saveSettings: function() {
            if (this.settings.loaded) {
                this.settings.save();
            }
        },
        reset: function() {
            this.$.shutter.startMode = true;
            this.$.shutter.open = false;
            this.openView(this.$.listView, {animation: ""}, {animation: ""});
        }
    });

})(Polymer, padlock.platform, padlock.CloudSource);