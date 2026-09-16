using {staging.ZPTM_KBAN_MATCFG} from '../db/schema';

@requires: 'Admin'
service StagingService {
    entity MaterialConfig as projection on ZPTM_KBAN_MATCFG;
    action uploadExcel(base64 : LargeString) returns String;
}

@path: '/api/readonly'
@requires: 'authenticated-user'
service ReadOnlyService {
    @readonly entity MaterialConfig as projection on ZPTM_KBAN_MATCFG;
}
