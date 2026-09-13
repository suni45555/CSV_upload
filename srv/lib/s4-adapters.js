/**
 * S/4HANA API adapter stubs.
 *
 * These are mock implementations that return simulated responses.
 * TODO: Replace with real S/4HANA destination calls when destinations
 *       are provisioned in BTP.
 *
 * Real implementation would use:
 *   const s4 = await cds.connect.to('API_BUSINESS_PARTNER');
 *   const result = await s4.run(SELECT.from(...));
 */

/**
 * Business Partner API — determines if the sold-to is a consignment customer.
 *
 * Real API: GET /sap/opu/odata/sap/API_BUSINESS_PARTNER/A_CustSalesPartnerFunc
 *   ?$filter=BPCustomerNumber eq '{soldToCustomer}' and PartnerFunction eq 'WE'
 *   &$select=Customer,SalesOrganization,DistributionChannel,Division,PartnerFunction,BPCustomerNumber
 *
 * @param {string} soldToCustomer
 * @returns {Promise<object>} { isConsignment, customerData }
 */
async function getBusinessPartner(soldToCustomer) {
    // TODO: Replace with real S/4HANA destination call
    // Consignment detection: InventorySpecialStockType === "W" on contract item
    console.log(`[S4-STUB] getBusinessPartner called for: ${soldToCustomer}`);

    return {
        found: true,
        isConsignment: false,   // TODO: derive from real API response
        customerData: {
            customer: soldToCustomer,
            salesOrganization: "1000",
            distributionChannel: "10",
            division: "00"
        }
    };
}

/**
 * Sales Contract API — finds active contract for the sold-to + material.
 *
 * Real APIs:
 *   Header: GET /API_SALES_CONTRACT/A_SalesContract?$filter=SoldToParty eq '{soldToCustomer}'
 *   Item:   GET /API_SALES_CONTRACT/A_SalesContractItem?$filter=Material eq '{material}'
 *
 * @param {string} soldToCustomer
 * @param {string} material
 * @returns {Promise<object>} { found, contractNumber, hasStock, specialStockType }
 */
async function getSalesContract(soldToCustomer, material) {
    // TODO: Replace with real S/4HANA destination call
    console.log(`[S4-STUB] getSalesContract called for: ${soldToCustomer}, ${material}`);

    return {
        found: true,
        contractNumber: "CONTRACT-001",
        hasStock: true,
        // InventorySpecialStockType "W" = consignment
        specialStockType: ""    // TODO: derive from real API
    };
}

/**
 * Serial Number Query API — checks serial number availability and ownership.
 *
 * Real API: GET /API_MATERIAL_SERIAL_NUMBER/MaterialSerialNumber
 *   ?$filter=Material eq '{material}' and Plant eq '{plant}'
 *     and InventoryStockType eq '01' and InventorySpecialStockType eq 'W'
 *
 * @param {string} material
 * @param {string} plant
 * @param {string} soldToCustomer
 * @returns {Promise<object>} { found, serialNumber, atCustomerSite, estoFlag, matchesCustomer }
 */
async function getSerialNumber(material, plant, soldToCustomer) {
    // TODO: Replace with real S/4HANA destination call
    console.log(`[S4-STUB] getSerialNumber called for: ${material}, ${plant}`);

    return {
        found: true,
        serialNumber: "SN-00001",
        atCustomerSite: false,      // ECUS flag
        estoFlag: false,            // ESTO flag
        matchesCustomer: true       // serial belongs to this customer
    };
}

module.exports = { getBusinessPartner, getSalesContract, getSerialNumber };
