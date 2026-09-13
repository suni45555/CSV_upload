/**
 * Decision Engine — walks the GENERAL / CONSIGNMENT branches
 * and matches the collected facts against the OrderTypeRules table.
 *
 * @param {object} facts - collected from S/4 API calls
 * @param {Array}  rules - active OrderTypeRules rows, sorted by priority
 * @returns {object} determination result
 */
function determine(facts, rules) {
    const { branch, itemFound, hasContract, stockAvailable, serialMatched, boProvided, channel } = facts;

    // Walk the flowchart to build the concrete fact set
    let resolvedFacts;

    if (branch === "GENERAL") {
        resolvedFacts = walkGeneralBranch(facts);
    } else if (branch === "CONSIGNMENT") {
        resolvedFacts = walkConsignmentBranch(facts);
    } else {
        return {
            orderType: null,
            chainedOrderType: null,
            blocked: true,
            blockReason: "Unknown branch: " + branch,
            flaggedMissingSerial: false,
            matchedRule: null
        };
    }

    // Match against rules table
    const matched = matchRule(resolvedFacts, channel, rules);

    if (matched) {
        return {
            orderType: matched.orderType,
            chainedOrderType: matched.chainedOrderType || null,
            blocked: matched.hardBlock || false,
            blockReason: matched.blockReason || null,
            flaggedMissingSerial: matched.flaggedMissingSerial || false,
            matchedRule: matched.ruleName
        };
    }

    // No rule matched — fallback
    return {
        orderType: null,
        chainedOrderType: null,
        blocked: true,
        blockReason: "No matching rule found",
        flaggedMissingSerial: false,
        matchedRule: null
    };
}

/**
 * GENERAL (non-consignment) branch logic.
 * Flowchart: item found? → contract+stock? → serial match? → BO?
 */
function walkGeneralBranch(facts) {
    const result = { branch: "GENERAL" };

    if (!facts.itemFound) {
        result.itemFound = false;
        return result;
    }

    result.itemFound = true;
    result.hasContract = facts.hasContract || false;
    result.stockAvailable = facts.stockAvailable || false;

    if (!facts.stockAvailable) {
        // No stock → hard block
        return result;
    }

    result.serialMatched = facts.serialMatched || false;

    if (facts.serialMatched) {
        // Serial matched — success path
        return result;
    }

    // Serial not matched — check BO code
    // TODO: BO code source field not confirmed — hardcoded to false if not provided
    result.boProvided = facts.boProvided || false;
    return result;
}

/**
 * CONSIGNMENT branch logic.
 * Flowchart: contract? → customer found? → ECUS w/o ESTO? → BO?
 */
function walkConsignmentBranch(facts) {
    const result = { branch: "CONSIGNMENT" };

    if (!facts.customerFound) {
        // Customer lookup failed, no stock
        // Leave all fields unset so Rule 7 (all wildcards) matches
        result.customerFound = false;
        return result;
    }

    result.customerFound = true;

    if (facts.atCustomerSite && !facts.estoFlag) {
        // ECUS without ESTO — check BO
        // TODO: BO code source not confirmed
        result.boProvided = facts.boProvided || false;
        return result;
    }

    // Transfer serial to current customer (VL01NO path)
    // Set boProvided explicitly so rules 8/9 don't match via wildcard
    result.serialMatched = true;
    result.stockAvailable = true;
    return result;
}

/**
 * Match resolved facts against the rules table.
 * Nullable columns in rules act as wildcards.
 * Rules are sorted by priority — first match wins.
 */
function matchRule(resolvedFacts, channel, rules) {
    const activeRules = rules
        .filter(r => r.active)
        .sort((a, b) => a.priority - b.priority);

    for (const rule of activeRules) {
        // Branch must match
        if (rule.branch !== resolvedFacts.branch) continue;

        // Channel must match (BOTH matches everything)
        if (rule.targetChannel !== "BOTH" && rule.targetChannel !== channel) continue;

        // Nullable fields act as wildcards — only check if rule specifies a value
        if (rule.itemFound !== null && rule.itemFound !== undefined && rule.itemFound !== resolvedFacts.itemFound) continue;
        if (rule.hasContract !== null && rule.hasContract !== undefined && rule.hasContract !== resolvedFacts.hasContract) continue;
        if (rule.stockAvailable !== null && rule.stockAvailable !== undefined && rule.stockAvailable !== resolvedFacts.stockAvailable) continue;
        if (rule.serialMatched !== null && rule.serialMatched !== undefined && rule.serialMatched !== resolvedFacts.serialMatched) continue;
        if (rule.boProvided !== null && rule.boProvided !== undefined && rule.boProvided !== resolvedFacts.boProvided) continue;

        return rule;
    }

    return null;
}

module.exports = { determine, walkGeneralBranch, walkConsignmentBranch, matchRule };
