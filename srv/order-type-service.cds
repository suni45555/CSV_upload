using { ordertype.OrderTypeRules as Rules, ordertype.DeterminationLog } from '../db/order-type-schema';

/**
 * Main service — called by SFDC / EDI middleware.
 */
@path: '/odata/v4/order-type'
service OrderTypeDeterminationService {

    action determineOrderType(
        soldToCustomer : String(20),
        material       : String(40),
        plant          : String(4),
        orderSource    : String(10)   // 'SFDC' or 'EDI'
    ) returns {
        orderType            : String(10);
        chainedOrderType     : String(10);
        blocked              : Boolean;
        blockReason          : String(255);
        flaggedMissingSerial : Boolean;
        flowBranch           : String(20);
        logId                : UUID;
    };

    @readonly entity DeterminationLogs as projection on DeterminationLog;
}

/**
 * Admin service — business users maintain the rules table.
 */
@path: '/odata/v4/order-type-admin'
service OrderTypeAdminService {
    entity OrderTypeRules as projection on Rules;
}
