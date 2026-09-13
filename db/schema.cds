namespace staging;

entity ZPTM_KBAN_MATCFG {
    key MATNR          : String(40);   // Material Number
    key WERKS          : String(4);    // Plant
    ACTIVE             : String(1);    // Active
    MAX_CONTAINERS     : Integer;      // Maximum Containers
    THRESHOLD          : Integer;      // Threshold Multiplier
    CREATED_BY         : String(12);   // Created By
    CREATED_ON         : Date;         // Created On
    CHANGED_BY         : String(12);   // Changed By
    CHANGED_ON         : Date;         // Changed On
}
