const cds = require("@sap/cds");
const { determine } = require("./lib/decision-engine");
const { getBusinessPartner, getSalesContract, getSerialNumber } = require("./lib/s4-adapters");

module.exports = class OrderTypeDeterminationService extends cds.ApplicationService {
    init() {
        const { DeterminationLogs } = this.entities;

        this.on("determineOrderType", async (req) => {
            const { soldToCustomer, material, plant, orderSource } = req.data;

            // Validate input
            if (!soldToCustomer || !material || !plant || !orderSource) {
                return req.reject(400, "soldToCustomer, material, plant, and orderSource are required");
            }
            if (orderSource !== "SFDC" && orderSource !== "EDI") {
                return req.reject(400, "orderSource must be 'SFDC' or 'EDI'");
            }

            const startTime = Date.now();

            try {
                // Step 1: Call S/4HANA APIs
                const bpResult = await getBusinessPartner(soldToCustomer);
                const contractResult = await getSalesContract(soldToCustomer, material);
                const serialResult = await getSerialNumber(material, plant, soldToCustomer);

                // Step 2: Determine branch
                const branch = bpResult.isConsignment ? "CONSIGNMENT" : "GENERAL";

                // Step 3: Build facts
                const facts = {
                    branch,
                    channel: orderSource,
                    itemFound: serialResult.found,
                    hasContract: contractResult.found,
                    stockAvailable: contractResult.hasStock,
                    serialMatched: serialResult.matchesCustomer,
                    boProvided: false,  // TODO: BO code source not confirmed — hardcoded to false
                    customerFound: bpResult.found,
                    atCustomerSite: serialResult.atCustomerSite,
                    estoFlag: serialResult.estoFlag
                };

                // Step 4: Fetch active rules
                const { OrderTypeRules } = cds.entities("ordertype");
                const rules = await SELECT.from(OrderTypeRules).where({ active: true }).orderBy("priority");

                // Step 5: Run decision engine
                const result = determine(facts, rules);

                const durationMs = Date.now() - startTime;

                // Step 6: Write audit log
                const logEntry = {
                    orderSource,
                    soldToCustomer,
                    material,
                    plant,
                    flowBranch: branch,
                    customerFound: bpResult.found,
                    contractFound: contractResult.found,
                    contractNumber: contractResult.contractNumber || null,
                    resultOrderType: result.orderType,
                    chainedOrderType: result.chainedOrderType,
                    blocked: result.blocked,
                    blockReason: result.blockReason,
                    flaggedMissingSerial: result.flaggedMissingSerial,
                    matchedRule: result.matchedRule,
                    durationMs
                };

                const { DeterminationLog } = cds.entities("ordertype");
                const inserted = await INSERT.into(DeterminationLog).entries(logEntry);

                // Step 7: Return result
                return {
                    orderType: result.orderType,
                    chainedOrderType: result.chainedOrderType,
                    blocked: result.blocked,
                    blockReason: result.blockReason,
                    flaggedMissingSerial: result.flaggedMissingSerial,
                    flowBranch: branch,
                    logId: logEntry.ID
                };

            } catch (err) {
                const durationMs = Date.now() - startTime;

                // Log the failure
                const { DeterminationLog } = cds.entities("ordertype");
                await INSERT.into(DeterminationLog).entries({
                    orderSource,
                    soldToCustomer,
                    material,
                    plant,
                    blocked: true,
                    blockReason: "System error: " + err.message,
                    durationMs
                });

                return req.reject(500, "Determination failed: " + err.message);
            }
        });

        return super.init();
    }
};
