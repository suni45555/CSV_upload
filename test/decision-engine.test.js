const { determine } = require("../srv/lib/decision-engine");

// Seed rules matching the CSV data
const RULES = [
    { ID: "1", ruleName: "General - item not found (SFDC)", branch: "GENERAL", itemFound: false, hasContract: null, stockAvailable: null, serialMatched: null, boProvided: null, targetChannel: "SFDC", priority: 10, orderType: "ZCFU", chainedOrderType: null, hardBlock: false, blockReason: "missing serial number", flaggedMissingSerial: true, active: true },
    { ID: "2", ruleName: "General - item not found (EDI)", branch: "GENERAL", itemFound: false, hasContract: null, stockAvailable: null, serialMatched: null, boProvided: null, targetChannel: "EDI", priority: 20, orderType: "ZOR", chainedOrderType: null, hardBlock: false, blockReason: "missing serial number", flaggedMissingSerial: true, active: true },
    { ID: "3", ruleName: "General - serial matched success", branch: "GENERAL", itemFound: true, hasContract: true, stockAvailable: true, serialMatched: true, boProvided: null, targetChannel: "BOTH", priority: 30, orderType: "ZCIS", chainedOrderType: "ZBLO", hardBlock: false, blockReason: null, flaggedMissingSerial: false, active: true },
    { ID: "4", ruleName: "General - serial not matched BO provided", branch: "GENERAL", itemFound: true, hasContract: true, stockAvailable: true, serialMatched: false, boProvided: true, targetChannel: "BOTH", priority: 40, orderType: "ZOR", chainedOrderType: null, hardBlock: false, blockReason: null, flaggedMissingSerial: true, active: true },
    { ID: "5", ruleName: "General - serial not matched no BO", branch: "GENERAL", itemFound: true, hasContract: true, stockAvailable: true, serialMatched: false, boProvided: false, targetChannel: "BOTH", priority: 50, orderType: "ZBLO", chainedOrderType: null, hardBlock: false, blockReason: null, flaggedMissingSerial: true, active: true },
    { ID: "6", ruleName: "General - no stock available", branch: "GENERAL", itemFound: true, hasContract: true, stockAvailable: false, serialMatched: null, boProvided: null, targetChannel: "BOTH", priority: 60, orderType: null, chainedOrderType: null, hardBlock: true, blockReason: "no stock available", flaggedMissingSerial: false, active: true },
    { ID: "8", ruleName: "Consignment - ECUS without ESTO BO yes", branch: "CONSIGNMENT", itemFound: null, hasContract: null, stockAvailable: null, serialMatched: null, boProvided: true, targetChannel: "BOTH", priority: 70, orderType: "ZBLO", chainedOrderType: null, hardBlock: false, blockReason: null, flaggedMissingSerial: false, active: true },
    { ID: "9", ruleName: "Consignment - ECUS without ESTO BO no", branch: "CONSIGNMENT", itemFound: null, hasContract: null, stockAvailable: null, serialMatched: null, boProvided: false, targetChannel: "BOTH", priority: 80, orderType: "ZOR", chainedOrderType: null, hardBlock: false, blockReason: null, flaggedMissingSerial: false, active: true },
    { ID: "10", ruleName: "Consignment - transfer serial to customer", branch: "CONSIGNMENT", itemFound: null, hasContract: null, stockAvailable: true, serialMatched: true, boProvided: null, targetChannel: "BOTH", priority: 90, orderType: "ZCIS", chainedOrderType: "ZBLO", hardBlock: false, blockReason: null, flaggedMissingSerial: false, active: true },
    { ID: "7", ruleName: "Consignment - customer fail no stock", branch: "CONSIGNMENT", itemFound: null, hasContract: null, stockAvailable: null, serialMatched: null, boProvided: null, targetChannel: "BOTH", priority: 100, orderType: "ZOR", chainedOrderType: null, hardBlock: false, blockReason: "missing serial number", flaggedMissingSerial: true, active: true },
];

// ==================== GENERAL BRANCH ====================

describe("GENERAL branch", () => {

    test("Rule 1: item not found (SFDC) → ZCFU, flagged", () => {
        const facts = { branch: "GENERAL", channel: "SFDC", itemFound: false };
        const result = determine(facts, RULES);
        expect(result.orderType).toBe("ZCFU");
        expect(result.flaggedMissingSerial).toBe(true);
        expect(result.blocked).toBe(false);
    });

    test("Rule 2: item not found (EDI) → ZOR, flagged", () => {
        const facts = { branch: "GENERAL", channel: "EDI", itemFound: false };
        const result = determine(facts, RULES);
        expect(result.orderType).toBe("ZOR");
        expect(result.flaggedMissingSerial).toBe(true);
    });

    test("Rule 3: serial matched success → ZCIS + ZBLO", () => {
        const facts = {
            branch: "GENERAL", channel: "EDI",
            itemFound: true, hasContract: true, stockAvailable: true, serialMatched: true
        };
        const result = determine(facts, RULES);
        expect(result.orderType).toBe("ZCIS");
        expect(result.chainedOrderType).toBe("ZBLO");
        expect(result.flaggedMissingSerial).toBe(false);
    });

    test("Rule 4: serial not matched, BO provided → ZOR, flagged", () => {
        const facts = {
            branch: "GENERAL", channel: "EDI",
            itemFound: true, hasContract: true, stockAvailable: true,
            serialMatched: false, boProvided: true
        };
        const result = determine(facts, RULES);
        expect(result.orderType).toBe("ZOR");
        expect(result.flaggedMissingSerial).toBe(true);
    });

    test("Rule 5: serial not matched, no BO → ZBLO, flagged", () => {
        const facts = {
            branch: "GENERAL", channel: "EDI",
            itemFound: true, hasContract: true, stockAvailable: true,
            serialMatched: false, boProvided: false
        };
        const result = determine(facts, RULES);
        expect(result.orderType).toBe("ZBLO");
        expect(result.flaggedMissingSerial).toBe(true);
    });

    test("Rule 6: no stock available → hard block", () => {
        const facts = {
            branch: "GENERAL", channel: "EDI",
            itemFound: true, hasContract: true, stockAvailable: false
        };
        const result = determine(facts, RULES);
        expect(result.blocked).toBe(true);
        expect(result.blockReason).toBe("no stock available");
    });
});

// ==================== CONSIGNMENT BRANCH ====================

describe("CONSIGNMENT branch", () => {

    test("Rule 7: customer fail, no stock → ZOR, flagged", () => {
        const facts = {
            branch: "CONSIGNMENT", channel: "EDI",
            customerFound: false
        };
        const result = determine(facts, RULES);
        expect(result.orderType).toBe("ZOR");
        expect(result.flaggedMissingSerial).toBe(true);
    });

    test("Rule 8: ECUS without ESTO, BO yes → ZBLO", () => {
        const facts = {
            branch: "CONSIGNMENT", channel: "EDI",
            customerFound: true, atCustomerSite: true, estoFlag: false,
            boProvided: true
        };
        const result = determine(facts, RULES);
        expect(result.orderType).toBe("ZBLO");
        expect(result.flaggedMissingSerial).toBe(false);
    });

    test("Rule 9: ECUS without ESTO, BO no → ZOR", () => {
        const facts = {
            branch: "CONSIGNMENT", channel: "EDI",
            customerFound: true, atCustomerSite: true, estoFlag: false,
            boProvided: false
        };
        const result = determine(facts, RULES);
        expect(result.orderType).toBe("ZOR");
        expect(result.flaggedMissingSerial).toBe(false);
    });

    test("Rule 10: transfer serial to customer → ZCIS + ZBLO", () => {
        const facts = {
            branch: "CONSIGNMENT", channel: "EDI",
            customerFound: true, atCustomerSite: false, estoFlag: true
        };
        const result = determine(facts, RULES);
        expect(result.orderType).toBe("ZCIS");
        expect(result.chainedOrderType).toBe("ZBLO");
    });
});

// ==================== EDGE CASES ====================

describe("Edge cases", () => {

    test("Unknown branch → blocked", () => {
        const facts = { branch: "UNKNOWN", channel: "EDI" };
        const result = determine(facts, RULES);
        expect(result.blocked).toBe(true);
        expect(result.blockReason).toContain("Unknown branch");
    });

    test("No matching rule → blocked", () => {
        const facts = { branch: "GENERAL", channel: "SFDC", itemFound: true, hasContract: false, stockAvailable: true };
        const result = determine(facts, RULES);
        // No rule for GENERAL + itemFound + no contract + stock available
        expect(result.blocked).toBe(true);
    });
});
