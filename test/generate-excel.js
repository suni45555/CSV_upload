const XLSX = require("xlsx");
const path = require("path");

const data = [
    { MATNR: "MAT-200", WERKS: "1000", ACTIVE: "X", MAX_CONTAINERS: 20, THRESHOLD: 5, CREATED_BY: "TESTUSER" },
    { MATNR: "MAT-201", WERKS: "1000", ACTIVE: "X", MAX_CONTAINERS: 15, THRESHOLD: 3, CREATED_BY: "TESTUSER" },
    { MATNR: "MAT-202", WERKS: "2000", ACTIVE: "",  MAX_CONTAINERS: 10, THRESHOLD: 2, CREATED_BY: "TESTUSER" },
    { MATNR: "MAT-203", WERKS: "2000", ACTIVE: "X", MAX_CONTAINERS: 25, THRESHOLD: 4, CREATED_BY: "TESTUSER" },
    { MATNR: "MAT-204", WERKS: "3000", ACTIVE: "X", MAX_CONTAINERS: 8,  THRESHOLD: 6, CREATED_BY: "TESTUSER" },
];

const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "MaterialConfig");

const outPath = path.join(__dirname, "sample_upload.xlsx");
XLSX.writeFile(wb, outPath);
console.log("Created:", outPath);
