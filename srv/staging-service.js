const cds = require("@sap/cds");
const XLSX = require("xlsx");

module.exports = class StagingService extends cds.ApplicationService {
  init() {
    const { MaterialConfig } = this.entities;

    // Excel Upload Action
    this.on("uploadExcel", async (req) => {
      const { base64 } = req.data;
      if (!base64) return req.reject(400, "No file content provided");

      try {
        const buffer = Buffer.from(base64, "base64");
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (!rows.length) return req.reject(400, "Excel file is empty");

        const now = new Date().toISOString().split("T")[0];
        const entries = rows.map((row) => ({
          MATNR: String(row.MATNR || "").trim(),
          WERKS: String(row.WERKS || "").trim(),
          ACTIVE: String(row.ACTIVE || "X").trim(),
          MAX_CONTAINERS: parseInt(row.MAX_CONTAINERS) || 0,
          THRESHOLD: parseInt(row.THRESHOLD) || 0,
          CREATED_BY: String(row.CREATED_BY || "UPLOAD").trim(),
          CREATED_ON: row.CREATED_ON || now,
          CHANGED_BY: String(row.CHANGED_BY || "UPLOAD").trim(),
          CHANGED_ON: row.CHANGED_ON || now,
        }));

        // Validate required keys
        const invalid = entries.filter((e) => !e.MATNR || !e.WERKS);
        if (invalid.length)
          return req.reject(400, `${invalid.length} rows missing MATNR or WERKS`);

        // Upsert each entry
        for (const entry of entries) {
          await UPSERT.into(MaterialConfig).entries(entry);
        }

        return `Successfully uploaded ${entries.length} records`;
      } catch (err) {
        return req.reject(500, "Upload failed: " + err.message);
      }
    });

    return super.init();
  }
};
