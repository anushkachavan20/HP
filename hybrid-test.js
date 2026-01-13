import { check, group, sleep } from 'k6';
import { browser } from 'k6/browser';
import { Rate, Trend } from 'k6/metrics';
import http from 'k6/http';
import { b64decode } from 'k6/encoding';
import { generateTokenTP, generateRandomString, exportSummaryToCSV } from '../utils/functions.js';
import exec from 'k6/execution';
import { expect } from 'https://jslib.k6.io/k6chaijs/4.3.4.3/index.js';
import { SharedArray } from 'k6/data';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
const config_data = new SharedArray('configs', function () {
  return JSON.parse(open('../utils/config.json'));
});
const run_config_data = new SharedArray('Runconfigs', function () {
  return JSON.parse(open('../utils/Runconfig.json'));
});
const smoke_test_dataStruct = new SharedArray('smoke_test_dataStruct', function () {
  return JSON.parse(open('../datafiles/EUstage-lhidm-smoke.json'));
});
let Bearer_token, res, transactionid;
export let errorRate = new Rate('errorRate');
export let browserLoadTrend = new Trend('Browser_Users_Load_List_Smoke'); // Rename to valid metric name
export let browserFcpTrend = new Trend('Browser_Users_FCP');
export let browserLcpTrend = new Trend('Browser_Users_LCP');

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
    browser_smoke: {
      executor: 'shared-iterations',
      options: {
        browser: {
          type: 'chromium',
        },
      },
      vus: 1, // Start with 1 VU for browser
      iterations: 1,
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

function getPayload(item) {
  if (!item.payload) return null;
  let str = JSON.stringify(item.payload);
  str = str.replace('${tTenantId}', tTenantId);
  if (tUserId) str = str.replace('${tUserId}', tUserId);
  return JSON.parse(str);
}

export async function browserSmokeTest() {
  const page = await browser.newPage();

  // Helper function to handle cookie banner (Tried & Tested version)
  const handleCookieBanner = async () => {
    try {
        // Selector for closing the cookie banner
        const selector = "button.onetrust-close-btn-handler.banner-close-button";
        
        // Wait briefly for the banner to appear
        try {
            const btn = page.locator(selector).first();
            await btn.waitFor({ state: 'visible', timeout: 2000 });
            await btn.click();
            console.log('🍪 Cookie banner closed');
            
            // Wait for banner to disappear to ensure action is processed
            try {
                await btn.waitFor({ state: 'hidden', timeout: 5000 });
            } catch (e) {
                // Ignore if it doesn't disappear cleanly
            }
            sleep(2); // Wait for animation/dismissal/reload
        } catch (e) {
            // It's okay if it doesn't appear
        }
    } catch (e) {
        console.log('Error handling cookie banner:', e);
    }
  };

  // Helper to click with rescue logic
  const clickSafe = async (selector, name) => {
    const btn = page.locator(selector);
    try {
        console.log(`Attempting to click ${name} (${selector})...`);
        
        // Wait for it to be attached and visible first
        await btn.waitFor({ state: 'visible', timeout: 10000 });
        
        // Try short timeout first to detect obstruction quickly
        await btn.click({ timeout: 5000 });
    } catch (e) {
        console.log(`${name} click timed out or failed. Checking for banner...`);
        // Take a screenshot to debug
        try {
           await page.screenshot({ path: `screenshots/error_click_${Date.now()}.png` });
        } catch(err) {} 
        
        await handleCookieBanner();
        console.log(`Retrying click on ${name}...`);
        await btn.click(); // Standard timeout
    }
  };

  try {
    // 1. Navigate to the Landing Page
    const startUrl = `https://${tHostname}/`;
    console.log(`Navigating to: ${startUrl}`);
    await page.goto(startUrl);

    // 2. Logic to handle Landing Page vs Direct Email Page
    // Check if we are on the landing page (look for sign-in button)
    const landingBtn = page.locator('#btn-idplogin-signin');
    try {
        await landingBtn.waitFor({ state: 'visible', timeout: 5000 });
        console.log('Landing page detected. Clicking Sign In...');
        await clickSafe('#btn-idplogin-signin', 'Landing Sign In');
    } catch (e) {
        console.log('Landing Sign In button not found. Checking if already on Email page...');
    }

    // 3. Enter Email
    const emailInput = page.locator('#email');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 }); 
    
    // Use fill to ensure field is cleared and set. Check logic for partial entry.
    await handleCookieBanner(); // Proactive banner check
    await emailInput.fill(tUserEmail);
    
    // Verify strict equality in case of interruption
    try {
        const val = await emailInput.inputValue();
        if (val !== tUserEmail) {
            console.log(`Email mismatch (Got: ${val}). Retrying entry...`);
            await handleCookieBanner();
            await emailInput.fill(tUserEmail);
        }
    } catch(e) {
        // Fallback if inputValue not supported or fails
        console.log("Could not verify email input value, proceeding.");
    }

    // 4. Click Sign In (Next)
    await clickSafe('#sign-in-button', 'Email Next Button');

    console.log('Clicked Email Next button. Waiting for password field...');
    sleep(2); 

    // 5. Enter Password
    const passwordInput = page.locator('#password');
    await passwordInput.waitFor({ state: 'visible', timeout: 30000 });
    await passwordInput.type(tPassword);

    // 6. Click Sign In (Final)
    const passwordSignInBtn = page.locator('#sign-in');
    
    // We can use clickSafe here too as banner might appear late
    try {
        await passwordSignInBtn.click({ timeout: 5000 });
    } catch(e) {
        await handleCookieBanner();
        await passwordSignInBtn.click();
    }
    
    const accountMenu = page.locator('#menu_accountManagement');
    await accountMenu.waitFor();

    console.log('Login Successful. Navigating to Users page...');
    
    // Group wrapper removed (async issue). Using manual Trend metric instead.
    const start = Date.now();
    
    await accountMenu.click();
    const usersTab = page.locator('//div[contains(@class, "vn-tab-list__label") and text()="Users"]');
    await usersTab.waitFor();
    await usersTab.click(); // Click the Users tab to load the table

    // Wait for the "Invite user" button to be visible - this confirms the Users list has loaded
    // Selector provided: button with id="btn_user_add"
    const inviteUserBtn = page.locator('#btn_user_add');
    await inviteUserBtn.waitFor({ state: 'visible' });

    const end = Date.now();
    const loadTime = end - start;

    // Log the actual URL for debugging/verification
    const currentUrl = page.url();
    console.log(`[Browser Info] Current Page URL: ${currentUrl}`);

    // Add to custom trend immediately
    browserLoadTrend.add(loadTime);

    // TRICK: Create a dummy check with the URL in the name so we can extract it in handleSummary
    // delim changed to _IS_ to avoid K6 restriction on ::
    check(page, {
        [`PageURL_IS_${currentUrl}`]: () => true,
    });
    
    // Waiting for LCP to settle for SPA soft navigation
    sleep(3);

      // Capture Web Vitals (FCP & LCP) with robust LCP Observer
      const webVitals = await page.evaluate(async () => {
          const getLCP = () => new Promise((resolve) => {
              let resolved = false;
              const resolveOnce = (val) => {
                  if (!resolved) {
                      resolved = true;
                      resolve(val);
                  }
              };

              // 1. Try PerformanceObserver (Gold Standard)
              try {
                  const observer = new PerformanceObserver((entryList) => {
                      const entries = entryList.getEntries();
                      if (entries.length > 0) {
                         const lastEntry = entries[entries.length - 1];
                         // renderTime is preferred, fallback to loadTime
                         resolveOnce(lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime);
                      }
                  });
                  observer.observe({ type: 'largest-contentful-paint', buffered: true });
              } catch(e) {
                  // If observer fails, likely older browser or context issue
              }

              // 2. Fallback / Timeout: check standard list if observer didn't fire quickly
              setTimeout(() => {
                  const list = performance.getEntriesByType('largest-contentful-paint');
                  if (list.length > 0) {
                      const e = list[list.length - 1];
                      resolveOnce(e.renderTime || e.loadTime || e.startTime);
                  } else {
                      resolveOnce(0); // No LCP found
                  }
              }, 500); 
          });

          let fcp = 0;
          const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
          if (fcpEntry) { fcp = fcpEntry.startTime; }

          const lcp = await getLCP();
          
          return { fcp, lcp };
      });

      console.log(`FCP: ${webVitals.fcp}, LCP: ${webVitals.lcp}`);
      browserFcpTrend.add(webVitals.fcp);
      browserLcpTrend.add(webVitals.lcp);

  } catch (err) {
      console.log('Browser Test Failed With Error: ' + err);
  } finally {
    page.close();
  }
}

export default async function() {
  if (exec.scenario.name === 'browser_smoke') {
      await browserSmokeTest();
      return;
  }

  if(`${exec.vu.iterationInInstance}`==='0'){
   group('Generate token', function () { 
     Bearer_token = generateTokenTP(tHostname,tUserName,tPassword);
     let parts = Bearer_token.split('.');
     try {
         let payloadStr = b64decode(parts[1], 'rawurl', 's');
         let payload = JSON.parse(payloadStr);
         tUserId = payload.sub;
         if (payload.externalUserRefIDs) {
             let tpIdObj = payload.externalUserRefIDs.find(function(id) {
                 return id.type === 'EXTERNAL_USER_IDENTIFIER_TYPE_TECHPULSE';
             });
             if (tpIdObj) {
                 tUserId = tpIdObj.value;
             }
         }
     } catch (e) {
         console.log('Token decode error: ' + e);
     }
   });
  }

  transactionid = 'API_Automation' + generateRandomString(12);
  group('LHIDM_Tenants_Get_Tenant_Smoke', function () {
    res = http.get(`https://${tHostname}/api/2.0/tenants/${tTenantId}`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });
    console.log('group LHIDM_Tenants_Get_Tenant_Smoke');
    console.log('response status: '+res.status);
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has tenant id': (r) => r.body.includes('"id"') 
    });
   });
  sleep(0.5);

  transactionid = 'API_Automation' + generateRandomString(12);
  group('LHIDM_TenantPreferences_List_Smoke', function () {
    let payload = getPayload(smoke_test_dataStruct[1]);
    res = http.post(`https://${tHostname}/services/tenant_preference/1.0/preferences/list?tenantId=${tTenantId}`, JSON.stringify(payload), {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });
    console.log('group LHIDM_TenantPreferences_List_Smoke');
    console.log('response status: '+res.status);
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    check(res, {
        'is status 200': (r) => r.status === 200,
    });
   });
  sleep(0.5);

  transactionid = 'API_Automation' + generateRandomString(12);
  group('LHIDM_Tenants_Get_AdminUsers_Smoke', function () {
    res = http.get(`https://${tHostname}/api/2.0/tenants/${tTenantId}/users/admin`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });
    console.log('group LHIDM_Tenants_Get_AdminUsers_Smoke');
    console.log('response status: '+res.status);
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has user id': (r) => r.body.includes('"id"')
    });
   });
  sleep(0.5);

  transactionid = 'API_Automation' + generateRandomString(12);
  group('LHIDM_Users_GetUser_Smoke', function () {
    let payload = getPayload(smoke_test_dataStruct[3]);
    let uId = (payload && payload.userId) ? payload.userId : tUserId;
    res = http.get(`https://${tHostname}/api/2.0/users/${uId}`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });
    console.log('group LHIDM_Users_GetUser_Smoke');
    console.log('response status: '+res.status);
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has user id': (r) => r.body.includes('"id"')
    });
   });
  sleep(0.5);

  transactionid = 'API_Automation' + generateRandomString(12);
  group('LHIDM_WhatsNew_Get_WhatsNew_Smoke', function () {
    res = http.get(`https://${tHostname}/api/2.0/whatsnew?startIndex=0&itemsPerPage=500&tags=workExp`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });
    console.log('group LHIDM_WhatsNew_Get_WhatsNew_Smoke');
    console.log('response status: '+res.status);
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has resources': (r) => r.body.includes('"resources"')
    });
   });
  sleep(0.5);

  transactionid = 'API_Automation' + generateRandomString(12);
  group('LHIDM_TenantPreferences_Get_TenantPreferences_Smoke', function () {
    let payload = getPayload(smoke_test_dataStruct[5]);
    let key = (payload && payload.key) ? payload.key : 'subscription_authorization';
    res = http.get(`https://${tHostname}/api/2.0/tenant-preferences?tenantId=${tTenantId}&key=${key}`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });
    console.log('group LHIDM_TenantPreferences_Get_TenantPreferences_Smoke');
    console.log('response status: '+res.status);
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    check(res, {
        'is status 404': (r) => r.status === 404,
    });
   });
  sleep(0.5);

  transactionid = 'API_Automation' + generateRandomString(12);
  group('LHIDM_TenantPreferences_Post_TenantPreferences_Smoke', function () {
    let payload = getPayload(smoke_test_dataStruct[6]);
    res = http.post(`https://${tHostname}/api/2.0/tenant-preferences?tenantId=${tTenantId}&key=wx_tnc`, JSON.stringify(payload), {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });
    console.log('group LHIDM_TenantPreferences_Post_TenantPreferences_Smoke');
    console.log('response status: '+res.status);
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    check(res, {
        'is status 201': (r) => r.status === 201,
        'has key': (r) => r.body.includes('"key"')
    });
   });
  sleep(0.5);

  transactionid = 'API_Automation' + generateRandomString(12);
  group('LHIDM_TenantPreferences_Get_CustomFields_Smoke', function () {
    res = http.get(`https://${tHostname}/api/2.0/tenant-preferences/custom-fields/get`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });
    console.log('group LHIDM_TenantPreferences_Get_CustomFields_Smoke');
    console.log('response status: '+res.status);
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    check(res, {
        'is status 201': (r) => r.status === 201,
        'has custom_field': (r) => r.body.includes('"custom_field"')
    });
   });
  sleep(0.5);

  transactionid = 'API_Automation' + generateRandomString(12);
  group('LHIDM_TenantPreferences_Get_LifecycleStatus_Smoke', function () {
    res = http.get(`https://${tHostname}/api/2.0/tenant-preferences/lifecycle-status/get?tenantId=${tTenantId}`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });
    console.log('group LHIDM_TenantPreferences_Get_LifecycleStatus_Smoke');
    console.log('response status: '+res.status);
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has lifecycle_status': (r) => r.body.includes('"lifecycle_status"')
    });
   });
  sleep(0.5);

  transactionid = 'API_Automation' + generateRandomString(12);
  group('LHIDM_AssociationRequest_Get_List_Smoke', function () {
    res = http.get(`https://${tHostname}/api/2.0/associationrequest/tenants/${tTenantId}/list`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });
    console.log('group LHIDM_AssociationRequest_Get_List_Smoke');
    console.log('response status: '+res.status);
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has account': (r) => r.body.includes('"account"')
    });
   });
  sleep(0.5);

  transactionid = 'API_Automation' + generateRandomString(12);
  group('LHIDM_Tenants_Post_Tenant_Smoke', function () {
    let payload = getPayload(smoke_test_dataStruct[10]);
    res = http.post(`https://${tHostname}/api/2.0/tenants/tenant`, JSON.stringify(payload), {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });
    console.log('group LHIDM_Tenants_Post_Tenant_Smoke');
    console.log('response status: '+res.status);
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has tenant id': (r) => r.body.includes('"id"')
    });
   });
  sleep(0.5);

  transactionid = 'API_Automation' + generateRandomString(12);
  group('LHIDM_Registration_Get_CountriesAndCompanySizes_Smoke', function () {
    res = http.get(`https://${tHostname}/api/2.0/registration/recaptcha/countriesAndCompanySizes`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });
    console.log('group LHIDM_Registration_Get_CountriesAndCompanySizes_Smoke');
    console.log('response status: '+res.status);
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has countries': (r) => r.body.includes('"countries"'),
        'has company_sizes': (r) => r.body.includes('"company_sizes"')
    });
   });
  sleep(0.5);

  transactionid = 'API_Automation' + generateRandomString(12);
  group('LHIDM_Registration_Get_CountriesList_Smoke', function () {
    res = http.get(`https://${tHostname}/api/2.0/registration/recaptcha/countriesList`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });
    console.log('group LHIDM_Registration_Get_CountriesList_Smoke');
    console.log('response status: '+res.status);
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has usCountries': (r) => r.body.includes('"usCountries"'),
        'has euCountries': (r) => r.body.includes('"euCountries"')
    });
   });
  sleep(0.5);

  transactionid = 'API_Automation' + generateRandomString(12);
  group('LHIDM_Tenants_Get_PartnersList_Smoke', function () {
    res = http.get(`https://${tHostname}/api/2.0/tenants/${tTenantId}/partnersList`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });
    console.log('group LHIDM_Tenants_Get_PartnersList_Smoke');
    console.log('response status: '+res.status);
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has tenantId': (r) => r.body.includes('"tenantId"')
    });
   });
  sleep(0.5);

  transactionid = 'API_Automation' + generateRandomString(12);
  group('LHIDM_Entitlement_Get_Children_Smoke', function () {
    res = http.get(`https://${tHostname}/services/ccc-pc-entitlement-service/1.0/tenant/${tTenantId}/children`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });
    console.log('group LHIDM_Entitlement_Get_Children_Smoke');
    console.log('response status: '+res.status);
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    check(res, {
        'is status 200': (r) => r.status === 200,
        'response is false': (r) => r.body === 'false',
    });
   });
  sleep(0.5);

  transactionid = 'API_Automation' + generateRandomString(12);
  group('LHIDM_Users_Post_User_Smoke', function () {
    let payload = getPayload(smoke_test_dataStruct[15]);
    res = http.post(`https://${tHostname}/api/2.0/users/user`, JSON.stringify(payload), {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });
    console.log('group LHIDM_Users_Post_User_Smoke');
    console.log('response status: '+res.status);
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has user id': (r) => r.body.includes('"id"')
    });
   });
  sleep(0.5);

  transactionid = 'API_Automation' + generateRandomString(12);
  group('LHIDM_Tenants_Get_UniqueDeviceLifecycleFields_Smoke', function () {
    res = http.get(`https://${tHostname}/api/2.0/tenants/uniquedevicelifecyclefields`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });
    console.log('group LHIDM_Tenants_Get_UniqueDeviceLifecycleFields_Smoke');
    console.log('response status: '+res.status);
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    check(res, {
        'is status 500': (r) => r.status === 200,
    });
   });
  sleep(0.5);

  transactionid = 'API_Automation' + generateRandomString(12);
  group('LHIDM_Tenants_Get_CustomersLocation_Smoke', function () {
    res = http.get(`https://${tHostname}/api/2.0/tenants/${tTenantId}/customer-locations`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });
    console.log('group LHIDM_Tenants_Get_CustomersLocation_Smoke');
    console.log('response status: '+res.status);
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    check(res, {
        'is status 404': (r) => r.status === 404,
    });
   });
  sleep(0.5);

  transactionid = 'API_Automation' + generateRandomString(12);
  group('LHIDM_Tenants_Get_ArchivalThreshold_Smoke', function () {
    res = http.get(`https://${tHostname}/api/2.0/tenants/archivalThreshold`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });
    console.log('group LHIDM_Tenants_Get_ArchivalThreshold_Smoke');
    console.log('response status: '+res.status);
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has name': (r) => r.body.includes('"name"'),
        'has value': (r) => r.body.includes('"value"')
    });
   });
  sleep(0.5);

  transactionid = 'API_Automation' + generateRandomString(12);
  group('LHIDM_Tenants_Get_SupportCategory_Smoke', function () {
    res = http.get(`https://${tHostname}/api/2.0/tenants/support-category`, {
      headers: {  
        Authorization: "Bearer " + Bearer_token, 
        "Content-Type": "application/json", 
        "Accept": "application/json", 
        "X-HPTM-Transaction-ID" : transactionid
      }
    });
    console.log('group LHIDM_Tenants_Get_SupportCategory_Smoke');
    console.log('response status: '+res.status);
    expect(res, 'TransactionID:'+transactionid).to.not.be.empty;
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has emailCategories': (r) => r.body.includes('"emailCategories"')
    });
   });
  sleep(0.5);
}

export function handleSummary(data) {
  return {
    'Eustage-lhidm-smoke.html': htmlReport(data),
    'summary.json': JSON.stringify(data),
    'Eustage-lhidm-smoke.csv': exportSummaryToCSV(data),
    'metrics.txt': exportSummaryToCSV(data),
  };
}
