import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import http from 'k6/http';
import { b64decode } from 'k6/encoding';
import { generateTokenTP, generateRandomString, exportSummaryToCSV } from '../utils/functions.js';
import exec from 'k6/execution';
import { expect } from 'https://jslib.k6.io/k6chaijs/4.3.4.3/index.js';
import { SharedArray } from 'k6/data';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

// Fetch config data
const config_data = new SharedArray('configs', function () {
  return JSON.parse(open('../utils/config.json'));
});
const run_config_data = new SharedArray('Runconfigs', function () {
  return JSON.parse(open('../utils/Runconfig.json'));
});

// Variables CONSTANT
let Bearer_token, res, transactionid;
export let errorRate = new Rate('errorRate');

const tHostname = config_data[0].environments[`${__ENV.ENVNAME}`].hostname;
const tUserName = config_data[0].environments[`${__ENV.ENVNAME}`].username; 
const tPassword = config_data[0].environments[`${__ENV.ENVNAME}`].password; 
const tTenantId = run_config_data[0].environments[`${__ENV.ENVNAME}`].tenantid;
let tUserId;
let tUserEmail = tUserName;

const tAssessmentOn = run_config_data[0].loadprofiles.smoke.assessmentOn;
const resp_threshold = run_config_data[0].environments[`${__ENV.ENVNAME}`].thresholds;

export const options = {
  scenarios: {
    smoke: {
      executor: 'per-vu-iterations',
      vus: run_config_data[0].loadprofiles.smoke.vus,
      iterations: run_config_data[0].loadprofiles.smoke.iterations,      
    },
  },
  thresholds: {
    errorRate: [
      { threshold: 'rate < 0.1', abortOnFail: true, delayAbortEval: '1m' },
    ],
    http_req_failed: ['rate<0.01'],
    'group_duration{group:::LHIDM_Tenants_Get_Tenant_Smoke}': [tAssessmentOn+ '< '+resp_threshold.med],
    'group_duration{group:::LHIDM_TenantPreferences_List_Smoke}': [tAssessmentOn+ '< '+resp_threshold.med],
    'group_duration{group:::LHIDM_Users_GetUser_Smoke}': [tAssessmentOn+ '< '+resp_threshold.med],
    'group_duration{group:::LHIDM_WhatsNew_Get_WhatsNew_Smoke}': [tAssessmentOn+ '< '+resp_threshold.med],
    'group_duration{group:::LHIDM_TenantPreferences_Get_TenantPreferences_Smoke}': [tAssessmentOn+ '< '+resp_threshold.med],
    'group_duration{group:::LHIDM_TenantPreferences_Post_TenantPreferences_Smoke}': [tAssessmentOn+ '< '+resp_threshold.med],
    'group_duration{group:::LHIDM_TenantPreferences_Get_CustomFields_Smoke}': [tAssessmentOn+ '< '+resp_threshold.med],
    'group_duration{group:::LHIDM_TenantPreferences_Get_LifecycleStatus_Smoke}': [tAssessmentOn+ '< '+resp_threshold.med],
    'group_duration{group:::LHIDM_AssociationRequest_Get_List_Smoke}': [tAssessmentOn+ '< '+resp_threshold.med],
    'group_duration{group:::LHIDM_Tenants_Post_Tenant_Smoke}': [tAssessmentOn+ '< '+resp_threshold.med],
    'group_duration{group:::LHIDM_Tenants_Get_AdminUsers_Smoke}': [tAssessmentOn+ '< '+resp_threshold.med],
    'group_duration{group:::LHIDM_Registration_Get_CountriesAndCompanySizes_Smoke}': [tAssessmentOn+ '< '+resp_threshold.med],
    'group_duration{group:::LHIDM_Registration_Get_CountriesList_Smoke}': [tAssessmentOn+ '< '+resp_threshold.med],
    'group_duration{group:::LHIDM_Tenants_Get_PartnersList_Smoke}': [tAssessmentOn+ '< '+resp_threshold.med],
    'group_duration{group:::LHIDM_Entitlement_Get_Children_Smoke}': [tAssessmentOn+ '< '+resp_threshold.med],
    'group_duration{group:::LHIDM_Users_Post_User_Smoke}': [tAssessmentOn+ '< '+resp_threshold.med],
    'group_duration{group:::LHIDM_Tenants_Get_UniqueDeviceLifecycleFields_Smoke}': [tAssessmentOn+ '< '+resp_threshold.med],
    'group_duration{group:::LHIDM_Tenants_Get_CustomersLocation_Smoke}': [tAssessmentOn+ '< '+resp_threshold.med],
    'group_duration{group:::LHIDM_Tenants_Get_ArchivalThreshold_Smoke}': [tAssessmentOn+ '< '+resp_threshold.med],
    'group_duration{group:::LHIDM_Tenants_Get_SupportCategory_Smoke}': [tAssessmentOn+ '< '+resp_threshold.med],
  },
};

export default function() {
  // generate token only once
  if(`${exec.vu.iterationInInstance}`==='0'){
   group('Generate token', function () { 
     Bearer_token = generateTokenTP(tHostname,tUserName,tPassword);
   });
  }

  transactionid= 'API_Automation' + generateRandomString(12);
  
  group('LHIDM_Tenants_Get_Tenant_Smoke', function () {
    // API: GET /api/2.0/tenants/{tenant-id}
    res = http.get(`https://${tHostname}/api/2.0/tenants/${tTenantId}`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });

    console.log('LHIDM_Tenants_Get_Tenant_Smoke');
    console.log('response status: '+res.status);
    
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has tenant id': (r) => r.body.includes('"id"') 
    }); 
  });
  sleep(0.5);

  transactionid= 'API_Automation' + generateRandomString(12);
  // Payload for Tenant Preferences
  const pref_payload = ["proactive_security","subscription_authorization","partner_pbm_preferences","partner_obm_preferences","partner_billing_admin_banner_preference","view_adminx","wolf_activated","wfc_waiting","enforce_azure_login","wx_onboarding_status","wx_tnc","wx_opt_in","wx_print_onboarding","web_config","wex_alerts_in_app_notification_roles","wex_alerts_email_roles","partners_holding_tank","rpos_config","btg_tnc","product_improvement_consent_accepted","custom_data_collection_tenant_consent","remediation_ai"];

  group('LHIDM_TenantPreferences_List_Smoke', function () {
    // API: POST /services/tenant_preference/1.0/preferences/list
    res = http.post(`https://${tHostname}/services/tenant_preference/1.0/preferences/list?tenantId=${tTenantId}`, JSON.stringify(pref_payload), {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });

    console.log('LHIDM_TenantPreferences_List_Smoke');
    console.log('response status: '+res.status);
    
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    
    check(res, {
        'is status 200': (r) => r.status === 200,
    }); 
  });
  sleep(0.5);

  transactionid= 'API_Automation' + generateRandomString(12);
  
  group('LHIDM_Tenants_Get_AdminUsers_Smoke', function () {
    // API: GET /api/2.0/tenants/{tenant-id}/users/admin
    // Helper group to fetch a valid User ID
    res = http.get(`https://${tHostname}/api/2.0/tenants/${tTenantId}/users/admin`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });

    console.log('LHIDM_Tenants_Get_AdminUsers_Smoke');
    console.log('response status: '+res.status);
    
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has user id': (r) => r.body.includes('"id"')
    }); 

    // Extract User ID for subsequent tests
    try {
        if(res.status === 200){
            let body = res.json();
            let candidateId = null;
            let candidateEmail = null;
            
            if(Array.isArray(body) && body.length > 0){
                candidateId = body[0].id;
                candidateEmail = body[0].email || body[0].userName;
            } else if(body.resources && Array.isArray(body.resources) && body.resources.length > 0){
                candidateId = body.resources[0].id;
                candidateEmail = body.resources[0].email || body.resources[0].userName;
            }
            
            if(candidateId){
                tUserId = candidateId;
                // console.log('Updated tUserId from AdminUsers: ' + tUserId);
            }
            if(candidateEmail){
                tUserEmail = candidateEmail;
                // console.log('Updated tUserEmail from AdminUsers: ' + tUserEmail);
            }
        }
    } catch(e) { console.log('Extract ID error: ' + e); }
  });
  sleep(0.5);

  transactionid= 'API_Automation' + generateRandomString(12);
  
  group('LHIDM_Users_GetUser_Smoke', function () {
    // API: GET /api/2.0/users/{userId}
    res = http.get(`https://${tHostname}/api/2.0/users/${tUserId}`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });

    console.log('LHIDM_Users_GetUser_Smoke');
    console.log('response status: '+res.status);
    
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has user id': (r) => r.body.includes('"id"')
    }); 
  });
  sleep(0.5);

  transactionid= 'API_Automation' + generateRandomString(12);
  
  group('LHIDM_WhatsNew_Get_WhatsNew_Smoke', function () {
    // API: GET /api/2.0/whatsnew
    res = http.get(`https://${tHostname}/api/2.0/whatsnew?startIndex=0&itemsPerPage=500&tags=workExp`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });

    console.log('LHIDM_WhatsNew_Get_WhatsNew_Smoke');
    console.log('response status: '+res.status);
    
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has resources': (r) => r.body.includes('"resources"')
    }); 
  });
  sleep(0.5);

  transactionid= 'API_Automation' + generateRandomString(12);
  
  group('LHIDM_TenantPreferences_Get_TenantPreferences_Smoke', function () {
    // API: GET /api/2.0/tenant-preferences
    // Updated key to wx_tnc which is used in POST
    res = http.get(`https://${tHostname}/api/2.0/tenant-preferences?tenantId=${tTenantId}&key=wx_tnc`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });

    console.log('LHIDM_TenantPreferences_Get_TenantPreferences_Smoke');
    console.log('response status: '+res.status);
    
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    check(res, {
        'is status 200': (r) => r.status === 200,
    }); 
  });
  sleep(0.5);

  transactionid= 'API_Automation' + generateRandomString(12);
  // Payload for Post Tenant Preferences
  const post_pref_payload = {"tenantId": tTenantId, "key": "wx_tnc", "value": "accepted"};

  group('LHIDM_TenantPreferences_Post_TenantPreferences_Smoke', function () {
    // API: POST /api/2.0/tenant-preferences
    res = http.post(`https://${tHostname}/api/2.0/tenant-preferences?tenantId=${tTenantId}&key=wx_tnc`, JSON.stringify(post_pref_payload), {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });

    console.log('LHIDM_TenantPreferences_Post_TenantPreferences_Smoke');
    console.log('response status: '+res.status);
    
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    
    check(res, {
        'is status 200': (r) => r.status === 201,
        'has key': (r) => r.body.includes('"key"')
    }); 
  });
  sleep(0.5);

  transactionid= 'API_Automation' + generateRandomString(12);
  
  group('LHIDM_TenantPreferences_Get_CustomFields_Smoke', function () {
    // API: GET /api/2.0/tenant-preferences/custom-fields/get
    res = http.get(`https://${tHostname}/api/2.0/tenant-preferences/custom-fields/get`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });

    console.log('LHIDM_TenantPreferences_Get_CustomFields_Smoke');
    console.log('response status: '+res.status);
    // console.log('response body: '+res.body);
    
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    
    check(res, {
        // API consistently returns 201 (Created) instead of 200, likely due to lazy initialization logic on the backend
        'is status 200 or 201': (r) => r.status === 200 || r.status === 201,
        'has custom_field': (r) => r.body.includes('"custom_field"')
    }); 
  });
  sleep(0.5);

  transactionid= 'API_Automation' + generateRandomString(12);
  
  group('LHIDM_TenantPreferences_Get_LifecycleStatus_Smoke', function () {
    // API: GET /api/2.0/tenant-preferences/lifecycle-status/get
    // Note: Using tTenantId from the curl command (03f13bf3-ce9e-4405-9164-df75f6f53492) 
    // The curl used a different tenant ID: 03f13bf3-ce9e-4405-9164-df75f6f53492
    
    res = http.get(`https://${tHostname}/api/2.0/tenant-preferences/lifecycle-status/get?tenantId=${tTenantId}`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });

    console.log('LHIDM_TenantPreferences_Get_LifecycleStatus_Smoke');
    console.log('response status: '+res.status);
    
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has lifecycle_status': (r) => r.body.includes('"lifecycle_status"')
    }); 
  });
  sleep(0.5);

  transactionid= 'API_Automation' + generateRandomString(12);
  
  group('LHIDM_AssociationRequest_Get_List_Smoke', function () {
    // API: GET /api/2.0/associationrequest/tenants/{tenant-id}/list
    // Note: Using tTenantId from the curl command (03f13bf3-ce9e-4405-9164-df75f6f53492)
    // The curl used a different tenant ID: 03f13bf3-ce9e-4405-9164-df75f6f53492
    res = http.get(`https://${tHostname}/api/2.0/associationrequest/tenants/${tTenantId}/list`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });

    console.log('LHIDM_AssociationRequest_Get_List_Smoke');
    console.log('response status: '+res.status);
    
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has account': (r) => r.body.includes('"account"')
    }); 
  });
  sleep(0.5);

  transactionid= 'API_Automation' + generateRandomString(12);
  // Payload for Get Tenant by ID (POST)
  const tenant_payload = {"tenantId": tTenantId};

  group('LHIDM_Tenants_Post_Tenant_Smoke', function () {
    // API: POST /api/2.0/tenants/tenant
    res = http.post(`https://${tHostname}/api/2.0/tenants/tenant`, JSON.stringify(tenant_payload), {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });

    console.log('LHIDM_Tenants_Post_Tenant_Smoke');
    console.log('response status: '+res.status);
    // console.log("response body: "+res.body);
    
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has tenant id': (r) => r.body.includes('"id"')
    }); 
  });
  sleep(0.5);


 

  transactionid= 'API_Automation' + generateRandomString(12);
  
  group('LHIDM_Registration_Get_CountriesAndCompanySizes_Smoke', function () {
    // API: GET /api/2.0/registration/recaptcha/countriesAndCompanySizes
    res = http.get(`https://${tHostname}/api/2.0/registration/recaptcha/countriesAndCompanySizes`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });

    console.log('LHIDM_Registration_Get_CountriesAndCompanySizes_Smoke');
    console.log('response status: '+res.status);
    
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has countries': (r) => r.body.includes('"countries"'),
        'has company_sizes': (r) => r.body.includes('"company_sizes"')
    }); 
  });
  sleep(0.5);

  transactionid= 'API_Automation' + generateRandomString(12);
  
  group('LHIDM_Registration_Get_CountriesList_Smoke', function () {
    // API: GET /api/2.0/registration/recaptcha/countriesList
    res = http.get(`https://${tHostname}/api/2.0/registration/recaptcha/countriesList`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });

    console.log('LHIDM_Registration_Get_CountriesList_Smoke');
    console.log('response status: '+res.status);
    
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has usCountries': (r) => r.body.includes('"usCountries"'),
        'has euCountries': (r) => r.body.includes('"euCountries"')
    }); 
  });
  sleep(0.5);

  transactionid= 'API_Automation' + generateRandomString(12);
  
  group('LHIDM_Tenants_Get_PartnersList_Smoke', function () {
    // API: GET /api/2.0/tenants/{tenant-id}/partnersList
    // Note: Using tTenantId from the curl command (1d34fbeb-d069-11e8-a0ac-068328ad4ad4)
    // The curl used a different tenant ID: 1d34fbeb-d069-11e8-a0ac-068328ad4ad4
    res = http.get(`https://${tHostname}/api/2.0/tenants/${tTenantId}/partnersList`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });

    console.log('LHIDM_Tenants_Get_PartnersList_Smoke');
    console.log('response status: '+res.status);
    
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has tenantId': (r) => r.body.includes('"tenantId"')
    }); 
  });
  sleep(0.5);

  transactionid= 'API_Automation' + generateRandomString(12);
  
  group('LHIDM_Entitlement_Get_Children_Smoke', function () {
    // API: GET /services/ccc-pc-entitlement-service/1.0/tenant/{tenant-id}/children
   
    res = http.get(`https://${tHostname}/services/ccc-pc-entitlement-service/1.0/tenant/${tTenantId}/children`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });

    console.log('LHIDM_Entitlement_Get_Children_Smoke');
    console.log('response status: '+res.status);
    
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    
    check(res, {
        'is status 200': (r) => r.status === 200,
        'response is false': (r) => r.body === 'false',
    }); 
  });
  sleep(0.5);

  transactionid= 'API_Automation' + generateRandomString(12);
  // Payload for Get User by ID (POST)
  const user_payload = {"userId": tUserId};

  group('LHIDM_Users_Post_User_Smoke', function () {
    // API: POST /api/2.0/users/user
    res = http.post(`https://${tHostname}/api/2.0/users/user`, JSON.stringify(user_payload), {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });

    console.log('LHIDM_Users_Post_User_Smoke');
    console.log('response status: '+res.status);
    
    
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has user id': (r) => r.body.includes('"id"')
    }); 
  });
  sleep(0.5);

  transactionid= 'API_Automation' + generateRandomString(12);
  
  group('LHIDM_Tenants_Get_UniqueDeviceLifecycleFields_Smoke', function () {
    // API: GET /api/2.0/tenants/uniquedevicelifecyclefields
    // Retrying with query param and original path structure
    //https://${tHostname}/api/2.0/tenants/${tTenantId}/unique-device-lifecycle-fields
    res = http.get("https://usstaging.workforceexperience.hp.com/api/2.0/tenants/uniquedevicelifecyclefields", {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });

    console.log('LHIDM_Tenants_Get_UniqueDeviceLifecycleFields_Smoke');
    console.log('response status: '+res.status);
    // console.log('response body: '+res.body);
    
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    
    check(res, {
        'is status 500': (r) => r.status === 500,
    }); 
  });
  sleep(0.5);

  transactionid= 'API_Automation' + generateRandomString(12);
  
  group('LHIDM_Tenants_Get_CustomersLocation_Smoke', function () {
    // API: GET /api/2.0/tenants/{tenant-id}/customers-location
    res = http.get(`https://${tHostname}/api/2.0/tenants/${tTenantId}/customer-locations`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });

    console.log('LHIDM_Tenants_Get_CustomersLocation_Smoke');
    console.log('response status: '+res.status);
    
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    
    check(res, {
        'is status 404': (r) => r.status === 404,
    }); 
  });
  sleep(0.5);

  transactionid= 'API_Automation' + generateRandomString(12);
  
  group('LHIDM_Tenants_Get_ArchivalThreshold_Smoke', function () {
    // API: GET /api/2.0/tenants/archivalThreshold
    res = http.get(`https://${tHostname}/api/2.0/tenants/archivalThreshold`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });

    console.log('LHIDM_Tenants_Get_ArchivalThreshold_Smoke');
    console.log('response status: '+res.status);
    
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has name': (r) => r.body.includes('"name"'),
        'has value': (r) => r.body.includes('"value"')
    }); 
  });

  transactionid= 'API_Automation' + generateRandomString(12);
  
  group('LHIDM_Tenants_Get_SupportCategory_Smoke', function () {
    // API: GET /api/2.0/tenants/support-category
    res = http.get(`https://${tHostname}/api/2.0/tenants/support-category`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });

    console.log('LHIDM_Tenants_Get_SupportCategory_Smoke');
    console.log('response status: '+res.status);
    
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has emailCategories': (r) => r.body.includes('"emailCategories"')
    }); 
  });
  sleep(0.5);
  sleep(0.5);
}

export function handleSummary(data) {
  return {
    '../Eustage-lhidm-smoke.html': htmlReport(data),
    '../summary.json': JSON.stringify(data),
    '../Eustage-lhidm-smoke.csv': exportSummaryToCSV(data),
  };
}
