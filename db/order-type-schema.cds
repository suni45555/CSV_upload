namespace ordertype;

using { cuid, managed } from '@sap/cds/common';

/**
 * Business-maintainable rules table.
 * Nullable match columns act as wildcards.
 */
entity OrderTypeRules : cuid {
    ruleName             : String(100) @mandatory;
    branch               : String(20)  @assert.range enum { GENERAL; CONSIGNMENT };
    itemFound            : Boolean;
    hasContract          : Boolean;
    stockAvailable       : Boolean;
    serialMatched        : Boolean;
    boProvided           : Boolean;
    targetChannel        : String(10)  @assert.range enum { SFDC; EDI; BOTH };
    priority             : Integer     @mandatory;
    orderType            : String(10)  @mandatory;
    chainedOrderType     : String(10);
    hardBlock            : Boolean default false;
    blockReason          : String(255);
    flaggedMissingSerial : Boolean default false;
    active               : Boolean default true;
}

/**
 * Audit trail — written on every determineOrderType call.
 */
entity DeterminationLog : cuid, managed {
    orderSource          : String(10);   // SFDC or EDI
    soldToCustomer       : String(20);
    material             : String(40);
    plant                : String(4);
    flowBranch           : String(20);   // GENERAL or CONSIGNMENT
    customerFound        : Boolean;
    contractFound        : Boolean;
    contractNumber       : String(20);
    resultOrderType      : String(10);
    chainedOrderType     : String(10);
    blocked              : Boolean default false;
    blockReason          : String(255);
    flaggedMissingSerial : Boolean default false;
    matchedRule          : String(100);
    durationMs           : Integer;
}
