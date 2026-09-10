sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/Input",
    "sap/ui/layout/form/SimpleForm"
], function (Controller, MessageToast, MessageBox, Dialog, Button, Label, Input, SimpleForm) {
    "use strict";

    var API = "/odata/v4/staging/MaterialConfig";

    return Controller.extend("csvupload.controller.Main", {

        onInit: function () {},

        // ==================== EXPORT TEMPLATE ====================
        onExportTemplate: function () {
            var aHeaders = ["MATNR", "WERKS", "ACTIVE", "MAX_CONTAINERS", "THRESHOLD", "CREATED_BY"];
            var aData = [aHeaders]; // header row only

            var oScript = document.createElement("script");
            oScript.src = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
            oScript.onload = function () {
                var wb = XLSX.utils.book_new();
                var ws = XLSX.utils.aoa_to_sheet(aData);

                // Set column widths
                ws["!cols"] = [
                    { wch: 20 }, // MATNR
                    { wch: 10 }, // WERKS
                    { wch: 10 }, // ACTIVE
                    { wch: 18 }, // MAX_CONTAINERS
                    { wch: 12 }, // THRESHOLD
                    { wch: 15 }  // CREATED_BY
                ];

                XLSX.utils.book_append_sheet(wb, ws, "MaterialConfig");
                XLSX.writeFile(wb, "material_config_template.xlsx");
                MessageToast.show("Template downloaded");
            };
            // If XLSX already loaded, use it directly
            if (typeof XLSX !== "undefined") {
                oScript.onload();
            } else {
                document.head.appendChild(oScript);
            }
        },

        // ==================== REFRESH ====================
        onRefresh: function () {
            this.byId("materialTable").getBinding("items").refresh();
        },

        // ==================== FILE UPLOAD ====================
        onFileSelected: function (oEvent) {
            var sName = oEvent.getParameter("newValue");
            if (sName) {
                MessageToast.show("File ready: " + sName);
            }
        },

        onUploadPress: function () {
            var oFileUploader = this.byId("fileUploader");
            var oDomRef = oFileUploader.getFocusDomRef();
            var oFile = oDomRef && oDomRef.files && oDomRef.files[0];

            if (!oFile) {
                MessageToast.show("Please select a file first");
                return;
            }

            var that = this;
            sap.ui.core.BusyIndicator.show(0);

            var reader = new FileReader();
            reader.onload = function (e) {
                var bytes = new Uint8Array(e.target.result);
                var binary = "";
                for (var i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                var base64 = btoa(binary);
                that._callUploadAction(base64);
            };
            reader.readAsArrayBuffer(oFile);
        },

        _callUploadAction: function (base64) {
            var that = this;

            fetch("/odata/v4/staging/uploadExcel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ base64: base64 })
            })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                sap.ui.core.BusyIndicator.hide();
                if (data.value) {
                    MessageToast.show(data.value);
                    that.onRefresh();
                    that.byId("fileUploader").clear();
                } else if (data.error) {
                    MessageBox.error(data.error.message);
                }
            })
            .catch(function (err) {
                sap.ui.core.BusyIndicator.hide();
                MessageBox.error("Upload failed: " + err.message);
            });
        },

        // ==================== CREATE ====================
        onCreatePress: function () {
            this._openEntryDialog(null);
        },

        // ==================== EDIT ====================
        onEditPress: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext();
            this._openEntryDialog(oCtx.getObject());
        },

        // ==================== DELETE ====================
        onDeletePress: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext();
            var oData = oCtx.getObject();
            var that = this;

            MessageBox.confirm("Delete material " + oData.MATNR + " / Plant " + oData.WERKS + "?", {
                title: "Confirm Delete",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        var sKey = "MATNR='" + encodeURIComponent(oData.MATNR) +
                                   "',WERKS='" + encodeURIComponent(oData.WERKS) + "'";

                        fetch(API + "(" + sKey + ")", { method: "DELETE" })
                        .then(function (res) {
                            if (res.ok) {
                                MessageToast.show("Deleted successfully");
                                that.onRefresh();
                            } else {
                                return res.json().then(function (d) {
                                    throw new Error(d.error.message);
                                });
                            }
                        })
                        .catch(function (err) {
                            MessageBox.error("Delete failed: " + err.message);
                        });
                    }
                }
            });
        },

        // ==================== DIALOG (Create / Edit) ====================
        _openEntryDialog: function (oData) {
            var bEdit = !!oData;
            var that = this;

            var oMatnr = new Input({ value: bEdit ? oData.MATNR : "", maxLength: 40, editable: !bEdit });
            var oWerks = new Input({ value: bEdit ? oData.WERKS : "", maxLength: 4, editable: !bEdit });
            var oActive = new Input({ value: bEdit ? (oData.ACTIVE || "") : "X", maxLength: 1 });
            var oMaxCont = new Input({ value: bEdit ? String(oData.MAX_CONTAINERS || 0) : "0", type: "Number" });
            var oThreshold = new Input({ value: bEdit ? String(oData.THRESHOLD || 0) : "0", type: "Number" });
            var oCreatedBy = new Input({ value: bEdit ? (oData.CREATED_BY || "") : "", maxLength: 12 });
            var oChangedBy = new Input({ value: bEdit ? (oData.CHANGED_BY || "") : "", maxLength: 12 });

            var oDialog = new Dialog({
                title: bEdit ? "Edit Entry" : "Create Entry",
                contentWidth: "460px",
                content: [
                    new SimpleForm({
                        editable: true,
                        layout: "ResponsiveGridLayout",
                        labelSpanXL: 5, labelSpanL: 5, labelSpanM: 5, labelSpanS: 12,
                        content: [
                            new Label({ text: "Material Number", required: true }), oMatnr,
                            new Label({ text: "Plant", required: true }), oWerks,
                            new Label({ text: "Active" }), oActive,
                            new Label({ text: "Max Containers" }), oMaxCont,
                            new Label({ text: "Threshold" }), oThreshold,
                            new Label({ text: "Created By" }), oCreatedBy,
                            new Label({ text: "Changed By" }), oChangedBy
                        ]
                    })
                ],
                beginButton: new Button({
                    text: "Save",
                    type: "Emphasized",
                    press: function () {
                        var sMatnr = oMatnr.getValue().trim();
                        var sWerks = oWerks.getValue().trim();
                        if (!sMatnr || !sWerks) {
                            MessageBox.warning("Material Number and Plant are required");
                            return;
                        }

                        var sNow = new Date().toISOString().split("T")[0];
                        var oEntry = {
                            MATNR: sMatnr,
                            WERKS: sWerks,
                            ACTIVE: oActive.getValue().trim(),
                            MAX_CONTAINERS: parseInt(oMaxCont.getValue()) || 0,
                            THRESHOLD: parseInt(oThreshold.getValue()) || 0,
                            CREATED_BY: oCreatedBy.getValue().trim(),
                            CHANGED_BY: oChangedBy.getValue().trim(),
                            CHANGED_ON: sNow
                        };

                        var sUrl, sMethod;
                        if (bEdit) {
                            var sKey = "MATNR='" + encodeURIComponent(oData.MATNR) +
                                       "',WERKS='" + encodeURIComponent(oData.WERKS) + "'";
                            sUrl = API + "(" + sKey + ")";
                            sMethod = "PATCH";
                        } else {
                            oEntry.CREATED_ON = sNow;
                            sUrl = API;
                            sMethod = "POST";
                        }

                        fetch(sUrl, {
                            method: sMethod,
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(oEntry)
                        })
                        .then(function (res) {
                            if (res.ok) {
                                MessageToast.show(bEdit ? "Updated" : "Created");
                                that.onRefresh();
                                oDialog.close();
                            } else {
                                return res.json().then(function (d) {
                                    throw new Error(d.error.message);
                                });
                            }
                        })
                        .catch(function (err) {
                            MessageBox.error((bEdit ? "Update" : "Create") + " failed: " + err.message);
                        });
                    }
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: function () { oDialog.close(); }
                }),
                afterClose: function () { oDialog.destroy(); }
            });

            oDialog.open();
        }
    });
});
