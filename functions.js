import { check } from 'k6';
import http, { request } from 'k6/http';
import { findBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { sleep } from 'k6';
import jsonpath from 'https://jslib.k6.io/jsonpath/1.0.2/index.js';
import faker from 'https://cdnjs.cloudflare.com/ajax/libs/Faker/3.1.0/faker.min.js';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

function generateRandom12DigitNumber() {
  return Math.floor(100000000000 + Math.random() * 900000000000).toString(); 
}


function generateRandom9DigitNumber() {
  return Math.floor(100000000 + Math.random() * 900000000).toString(); 
}

function generateRandom2DigitNumber() {
  return Math.floor(10 + Math.random() * 90).toString(); 
}
/*

function generateToken(xhostname, xusername, xpassword){

   // 1. Auth
    const res1 = http.get('https://'+xhostname+'/services/oauth_handler/onecloud/auth?providerHref=https://oauth-auth.stg.oc.hp.com/oauth2/v1/auth?config_id=4496b334-3996-4c2b-81d7-2b5d8a429a3f&login_hint='+xusername);
    // Capture  authUril and cFlowurl
    const authUril = res1.url;
    const cFLOWurl = findBetween(authUril, 'flow=', '&login_hint', false);
    // const cFLOWurl = res1.url.slice(res1.url.lastIndexOf("flow=")+5,res1.url.length);
    const data = { "flow": cFLOWurl, "split-sign-up": true };
    console.log('-------------authUril----------');
    console.log(authUril);
    console.log('-------------cFLOWurl----------');
    console.log(cFLOWurl);

  // 2. Session 
    let res2 = http.request('POST', 'https://ui-backend.stg.cd.id.hp.com/bff/v1/auth/session', JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      });

      console.log('------------------Session Resp--------------------');
    console.log(res2.body);

    // extract csrToken
    const csrToken = findBetween(res2.body, 'csrfToken":"', '",', false);
    console.log('------------------csrToken--------------------');
    console.log(csrToken)
    // extract cookies 
    const setCookie1 = findBetween(res2.headers['Set-Cookie'] , '', ';', false);
    const setCookie2 = findBetween(res2.headers['Set-Cookie'] , 'Secure, ', ';', false);
    console.log('csrToken - '+csrToken+' setCookie1 - '+setCookie1+' setCookie2 - '+setCookie2)

  // 3. Username And Password 
  //Login to get NextUrl
   const data1 = {"username":"uswexautomationstage@workforceqa.ext.hp.com@hpid","password":"Admin@13"};
   let res3 = http.request('POST', 'https://ui-backend.us-east-1.stg.cd.id.hp.com/bff/v1/session/username-password', JSON.stringify(data1), {
    headers: { 
        'Accept-Encoding': 'gzip,deflate',
        'Origin':'login3.stg.cd.id.hp.com',
        'Csrf-Token': csrToken,
        'Host':'ui-backend.stg.cd.id.hp.com',
        'Content-Type': 'application/json',
        'Cookie': setCookie1+';'+setCookie2
     },
  });
  console.log('------------------res Use Pwd-------------------');
  console.log(res3.body);

  const nextUrl = findBetween(res3.body, '"nextUrl":"', '"}', false);
  console.log('code - '+nextUrl);
  
  // 4. oAuthCallBack
  const res4 = http.get(nextUrl);
  console.log('---------------oAuthCallBack----------------');
  console.log(res4.url);
  // capture code
  const code = findBetween(res4.url, 'code=', '&scope', false);
  // capture state
  const stno = res4.url.lastIndexOf("&state=");
  const endno = res4.url.length;
  const state = res4.url.slice(stno+7,endno);
  console.log('code - '+code);
  console.log('state - '+state);

  
  // 5. get Token 
  const data2 = {"code": code,"state": state};
  let res5 = http.request('POST', 'https://'+xhostname+'/services/oauth_handler/onecloud/token', JSON.stringify(data2), {
    headers: { 'Connection': 'keep-alive',
        'Accept': 'application/json',
        'Referer': 'https://usstagingms.hpdaas.com/ui/newLoginOC?code='+code+'&scope=offline&state='+state,
        'Content-Type': 'application/json',
        'Host':'usstagingms.workforceexperience.hp.com'
     },
  });
  console.log('---------------getToken----------------');
  console.log(res5.body);

  const token = findBetween(res5.body, '"access_token":"', '",', false);  

  // 6. OrgAwareToken
  const data3 = {};
  let res6 = http.request('POST', 'https://'+xhostname+'/services/oauth_handler/onecloud/orgAwareToken', JSON.stringify(data3), {
    headers: {  Authorization: "Bearer " + token,
      "Content-Type": "application/json",
       "Accept": "application/json"
     },
  });
  const new_token = findBetween(res6.body, '"access_token":"', '",', false);
  console.log('----------------Token--------------');
  console.log(new_token);

    //////// Think time after login
    sleep(randomIntBetween(1, 3));

  return new_token;
}
*/



function generateTokenTP(xhostname, xusername, xpassword){

	let env = `${__ENV.ENVNAME}`;
	
   // 1. Auth
    let res1 = {};
	if(env == "staging-techpulse"){
		res1 = http.get('https://'+xhostname+'/services/oauth_handler/onecloud/auth?providerHref=https://oauth-auth.stg.oc.hp.com/oauth2/v1/auth?config_id=4496b334-3996-4c2b-81d7-2b5d8a429a3f&login_hint='+xusername);
		}
	if(env == "eustaging-techpulse" || env == "eustaging"){
		res1 = http.get('https://'+xhostname+'/services/oauth_handler/onecloud/auth?providerHref=https://oauth-auth.eu-stg.oc.hp.com/oauth2/v1/auth?config_id=2e6590af-5e9b-4a1b-9ad8-bfd26ea287d3&login_hint='+xusername);
	}
    // Capture  authUril and cFlowurl
    const authUril = res1.url;
    const cFLOWurl = findBetween(authUril, 'flow=', '&', false);
    // const cFLOWurl = res1.url.slice(res1.url.lastIndexOf("flow=")+5,res1.url.length);
    const data = { "flow": cFLOWurl, "split-sign-up": true };
    console.log('-------------authUril----------');
    console.log(authUril);
    console.log('-------------cFLOWurl----------');
    console.log(cFLOWurl);

  // 2. Session 
    let res2 = http.request('POST', 'https://ui-backend.stg.cd.id.hp.com/bff/v1/auth/session', JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      });

      console.log('------------------Session Resp--------------------');
    console.log(res2.body);

	const regionEndpointUrl = findBetween(res2.body,`"regionEndpointUrl":"` ,`"}`, false);
      console.log('------------------regionEndpointUrl--------------------');
      console.log(regionEndpointUrl)

    // extract csrToken
    const csrToken = findBetween(res2.body, 'csrfToken":"', '",', false);
    console.log('------------------csrToken--------------------');
    console.log(csrToken)
    // extract cookies 
    const setCookie1 = findBetween(res2.headers['Set-Cookie'] , '', ';', false);
    const setCookie2 = findBetween(res2.headers['Set-Cookie'] , 'Secure, ', ';', false);
    console.log('csrToken - '+csrToken+' setCookie1 - '+setCookie1+' setCookie2 - '+setCookie2)

  // 3. Username And Password 
  //Login to get NextUrl
   const data1 = {"username":xusername+"@hpid","password":xpassword};
   let res3 = http.request('POST', `${regionEndpointUrl}`+'/session/username-password', JSON.stringify(data1), {
    headers: { 
        'Accept-Encoding': 'gzip,deflate',
        'Origin':'login3.stg.cd.id.hp.com',
        'Csrf-Token': csrToken,
        'Host':'ui-backend.stg.cd.id.hp.com',
        'Content-Type': 'application/json',
        'Cookie': setCookie1+';'+setCookie2
     },
  });
  console.log('------------------res Use Pwd-------------------');
  console.log(res3.body);

  const nextUrl = findBetween(res3.body, '"nextUrl":"', '"}', false);
  console.log('code - '+nextUrl);
  
  // 4. oAuthCallBack
  const res4 = http.get(nextUrl);
  console.log('---------------oAuthCallBack----------------');
  console.log(res4.url);
  // capture code
  const code = findBetween(res4.url, 'code=', '&scope', false);
  // capture state
  const stno = res4.url.lastIndexOf("&state=");
  const endno = res4.url.length;
  const state = res4.url.slice(stno+7,endno);
  console.log('code - '+code);
  console.log('state - '+state);

  
  // 5. get Token 
  const data2 = {"code": code,"state": state};
  let res5 = {};
  if(env == "staging-techpulse"){
	http.request('POST', 'https://'+xhostname+'/services/oauth_handler/onecloud/token', JSON.stringify(data2), {
    headers: { 'Connection': 'keep-alive',
        'Accept': 'application/json',
        'Referer': 'https://usstagingms.hpdaas.com/ui/newLoginOC?code='+code+'&scope=offline&state='+state,
        'Content-Type': 'application/json',
        'Host':'usstagingms.hpdaas.com'
	 },
  });
  }
   else if(env == "eustaging-techpulse"){
	res5 = http.request('POST', 'https://'+xhostname+'/services/oauth_handler/onecloud/token', JSON.stringify(data2), {
	    headers: { 'Connection': 'keep-alive',
	        'Accept': 'application/json',
	        'Referer': 'https://eustagingms.hpdaas.com/ui/newLoginOC?code='+code+'&scope=offline&state='+state,
	        'Content-Type': 'application/json',
	        'Host':'eustagingms.hpdaas.com'
	     },
	  });
   }
   else if(env == "eustaging"){
	res5 = http.request('POST', 'https://'+xhostname+'/services/oauth_handler/onecloud/token', JSON.stringify(data2), {
	    headers: { 'Connection': 'keep-alive',
	        'Accept': 'application/json',
	        'Referer': 'https://'+xhostname+'/ui/newLoginOC?code='+code+'&scope=offline&state='+state,
	        'Content-Type': 'application/json',
	        'Host': xhostname
	     },
	  });
   }
  console.log('---------------getToken----------------');
  console.log(res5.body);

  const token = findBetween(res5.body, '"access_token":"', '",', false);  

  // 6. OrgAwareToken
  const data3 = {};
  let res6 = http.request('POST', 'https://'+xhostname+'/services/oauth_handler/onecloud/orgAwareToken', JSON.stringify(data3), {
    headers: {  Authorization: "Bearer " + token,
      "Content-Type": "application/json",
       "Accept": "application/json"
     },
  });
  const new_token = findBetween(res6.body, '"access_token":"', '",', false);
  console.log('----------------Token--------------');
  console.log(new_token);

    //////// Think time after login
    sleep(randomIntBetween(2, 4));

  return new_token;
}


function generateToken(xhostname, xusername, xpassword){

  let env = `${__ENV.ENVNAME}`;
  // env = 'eustaging'; // usstaging, eustaging
  //const xhostname = 'usstagingms.workforceexperience.hp.com', xusername = 'uswexautomationstage@workforceqa.ext.hp.com', xpassword= 'Admin@13';
  // const xhostname = 'eustagingms.workforceexperience.hp.com', xusername = 'euwepautomationstage@workforceqa.ext.hp.com', xpassword= 'Admin@13';
   let res1 = {};
   if(env == 'usstaging'){
             res1 = http.get('https://'+xhostname+'/services/oauth_handler/onecloud/auth?providerHref=https://oauth-auth.stg.oc.hp.com/oauth2/v1/auth?config_id=4496b334-3996-4c2b-81d7-2b5d8a429a3f&login_hint='+xusername);}
         else if(env == 'eustaging'){    
             res1 = http.get('https://'+xhostname+'/services/oauth_handler/onecloud/auth?providerHref=https://oauth-auth.eu-stg.oc.hp.com/oauth2/v1/auth?config_id=2e6590af-5e9b-4a1b-9ad8-bfd26ea287d3&login_hint='+xusername);
            } 

  // 1. Auth
      if(env == 'usstaging'){
          res1 = http.get('https://'+xhostname+'/services/oauth_handler/onecloud/auth?providerHref=https://oauth-auth.stg.oc.hp.com/oauth2/v1/auth?config_id=4496b334-3996-4c2b-81d7-2b5d8a429a3f&login_hint='+xusername);}
      else if(env == 'eustaging'){    
          res1 = http.get('https://'+xhostname+'/services/oauth_handler/onecloud/auth?providerHref=https://oauth-auth.eu-stg.oc.hp.com/oauth2/v1/auth?config_id=2e6590af-5e9b-4a1b-9ad8-bfd26ea287d3&login_hint='+xusername);
         }  

        //  if you want to add any new environment
        //  else if(env == 'eustaging'){    
        //   res1 = http.get('https://'+xhostname+'/services/oauth_handler/onecloud/auth?providerHref=https://oauth-auth.eu-stg.oc.hp.com/oauth2/v1/auth?config_id=2e6590af-5e9b-4a1b-9ad8-bfd26ea287d3&login_hint='+xusername);
        //  } 
          
         

      // Capture  authUril and cFlowurl
      const authUril = res1.url;
      //const cFLOWurl = findBetween(authUril, 'flow=', '&login_hint', false);
      const cFLOWurl = findBetween(authUril, 'flow=', '&', false);
      // const cFLOWurl = res1.url.slice(res1.url.lastIndexOf("flow=")+5,res1.url.length);
      const data = { "flow": cFLOWurl, "split-sign-up": true };
      console.log('-------------authUril----------');
      console.log(authUril);
      console.log('-------------cFLOWurl----------');
      console.log(cFLOWurl);
  
    // 2. Session 
      let res2 = http.request('POST', 'https://ui-backend.stg.cd.id.hp.com/bff/v1/auth/session', JSON.stringify(data), {
             headers: { 'Content-Type': 'application/json' },
        });
  
        console.log('------------------Session Resp--------------------');
      console.log(res2.body);

	const regionEndpointUrl = findBetween(res2.body,`"regionEndpointUrl":"` ,`"}`, false);
      console.log('------------------regionEndpointUrl--------------------');
      console.log(regionEndpointUrl)
  
      // extract   
      const csrToken = findBetween(res2.body, 'csrfToken":"', '",', false);
      console.log('------------------csrToken--------------------');
      console.log(csrToken)
      // extract cookies 
      const setCookie1 = findBetween(res2.headers['Set-Cookie'] , '', ';', false);
      const setCookie2 = findBetween(res2.headers['Set-Cookie'] , 'Secure, ', ';', false);
      console.log('csrToken - '+csrToken+' setCookie1 - '+setCookie1+' setCookie2 - '+setCookie2)
  
    // 3. Username And Password 
    //Login to get NextUrl
    // const data1 = {"username":"uswexautomationstage@workforceqa.ext.hp.com@hpid","password":"Admin@13"};
     const data1 = {"username": xusername+"@hpid","password": xpassword};
     let res3 = http.request('POST', `${regionEndpointUrl}`+'/session/username-password', JSON.stringify(data1), {
          headers: { 
          'Accept-Encoding': 'gzip,deflate',
          'Origin':'login3.stg.cd.id.hp.com',
          'Csrf-Token': csrToken,
          'Host':'ui-backend.stg.cd.id.hp.com',
          'Content-Type': 'application/json',
          'Cookie': setCookie1+';'+setCookie2
       },
    });
    console.log('------------------res Use Pwd-------------------');
    console.log(res3.body);
  
    const nextUrl = findBetween(res3.body, '"nextUrl":"', '"}', false);
    console.log('code - '+nextUrl);
    
    // 4. oAuthCallBack
    const res4 = http.get(nextUrl);
    console.log('---------------oAuthCallBack----------------');
    console.log(res4.url);
    // capture code
    const code = findBetween(res4.url, 'code=', '&scope', false);
    // capture state
    const stno = res4.url.lastIndexOf("&state=");
    const endno = res4.url.length;
    const state = res4.url.slice(stno+7,endno);
    console.log('code - '+code);
    console.log('state - '+state);
  
    
    // 5. get Token 
    const data2 = {"code": code,"state": state};
    let res5 = {};
    if (env == 'usstaging'){
     res5 = http.request('POST', 'https://'+xhostname+'/services/oauth_handler/onecloud/token', JSON.stringify(data2), {
        headers: { 'Connection': 'keep-alive',
            'Accept': 'application/json',
            'Referer': 'https://usstagingms.hpdaas.com/ui/newLoginOC?code='+code+'&scope=offline&state='+state,
            'Content-Type': 'application/json',
            'Host':'usstagingms.workforceexperience.hp.com'
          },
      });
    }
    else if (env == 'eustaging'){
     res5 = http.request('POST', 'https://'+xhostname+'/services/oauth_handler/onecloud/token', JSON.stringify(data2), {
        headers: { 'Connection': 'keep-alive',
            'Accept': 'application/json',
            'Referer': 'https://eustagingms.hpdaas.com/ui/newLoginOC?code='+code+'&scope=offline&state='+state,
            'Content-Type': 'application/json',
            'Host':'eustagingms.workforceexperience.hp.com'
         },
      });
    }
   
    console.log('---------------getToken----------------');
    console.log(res5.body);
  
    const token = findBetween(res5.body, '"access_token":"', '",', false);  
  
    // 6. OrgAwareToken
    const data3 = {};
    let res6 = http.request('POST', 'https://'+xhostname+'/services/oauth_handler/onecloud/orgAwareToken', JSON.stringify(data3), {
      headers: {  Authorization: "Bearer " + token,
        "Content-Type": "application/json",
         "Accept": "application/json"
       },
    });
    const new_token = findBetween(res6.body, '"access_token":"', '",', false);
    console.log('----------------Token--------------');
    console.log(new_token);
   

   //////// Think time after login
   sleep(randomIntBetween(2, 4));

 return new_token;
}

function getCurrentDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // zero-padded
  const day = String(date.getDate()).padStart(2, '0'); // zero-padded
  const hours = String(date.getHours()).padStart(2, '0'); // zero-padded
  const minutes = String(date.getMinutes()).padStart(2, '0'); // zero-padded
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/*
/// TestFunction
function getCurrentDate(){
  const date = new Date();

//let day = date.getDate();
//let cDate = date.toLocaleDateString();
let day = date.getDate();
let month = date.getMonth() + 1; // Months are zero-based in JavaScript
let year = date.getFullYear();
let time = date.getHours()+':'+date.getMinutes()+':'+date.getSeconds();


// This arrangement can be altered based on how we want the date's format to appear.
let currentDate = `${year}-${month}-${day} ${time}`;
console.log(currentDate); // "17-6-2022"
  return currentDate;
}*/

// generate CSV results
  function exportSummaryToCSV(data) { 

     // Define the jsonpath expression
     const expression = '$.metrics.*';

     // Find all matches
     const matches = jsonpath.nodes(data, expression);
 
     // Set the CSV header
     let csv = 'time,environment,level,service,api,method,page_name,info,p90,p95,p99,errorRate,sla,sla_metric,sla_status,execution_status,load_time,fcp,lcp\n';
     // Timestamp
     let currentDate = getCurrentDate();
     //console.log(data);
     let errorRate = "0";
     try {
         errorRate = JSON.stringify(jsonpath.value(data, 'metrics.http_req_failed.values.rate'));
     } catch(e) {}

     // Pre-process groups to avoid O(N^2) lookup
     const groupFailures = new Map();
     let capturedPageUrl = "NA"; // Store dynamically found URL

     // Helper to extract URL from check names
     function extractUrlFromChecks(checks) {
         if (!checks) return;
         for (let j = 0; j < checks.length; j++) {
             // Look for our specific marker
             if (checks[j].name.indexOf("PageURL_IS_") === 0) {
                 capturedPageUrl = checks[j].name.split("PageURL_IS_")[1];
                 console.log(`[CSV Export] Detected Dynamic Page URL: ${capturedPageUrl}`);
             }
         }
     }
     
     // Check root level checks first
     if (data.root_group && data.root_group.checks) {
         extractUrlFromChecks(data.root_group.checks);
     }
     
     function traverseGroups(groups) {
        if (!groups) return;
        for (let i = 0; i < groups.length; i++) {
            const g = groups[i];
            const gName = g.name;
            
            // Extract URL from checks in this group
            if (g.checks) {
                extractUrlFromChecks(g.checks);
            }

            let hasFail = false;
            // Check checks in this group
            if (g.checks) {
                for (let j = 0; j < g.checks.length; j++) {
                    if (g.checks[j].fails > 0) {
                        hasFail = true;
                        break;
                    }
                }
            }
            if (hasFail) {
                groupFailures.set(gName, true);
            }

            // Recurse
            if (g.groups) {
                traverseGroups(g.groups);
            }
        }
     }

     if (data.root_group && data.root_group.groups) {
         traverseGroups(data.root_group.groups);
     }
 
     // --- Explicit Browser Metric Extraction ---
     let browserLoadTime = 0;
     // The key must match the name defined in the Trend literal in the test file
     const browserMetricName = 'Browser_Users_Load_List_Smoke'; 
     
     if (data.metrics[browserMetricName]) {
         const m = data.metrics[browserMetricName];
         if (m.values) {
             // Supports custom trend stats or default avg
             browserLoadTime = m.values['p(90)'] || m.values['avg'] || 0;
             console.log(`[CSV Export] Found Browser Metric '${browserMetricName}': ${browserLoadTime}ms`);
         }
     } else {
         console.log(`[CSV Export] WARNING: Metric '${browserMetricName}' not found in summary.`);
         // Debug: print available keys if specific metric missing
         // console.log('Available keys:', Object.keys(data.metrics));
     }

     let browserFcp = 0;
     let browserLcp = 0;
     const fcpMetricName = 'Browser_Users_FCP';
     const lcpMetricName = 'Browser_Users_LCP';

     if (data.metrics[fcpMetricName] && data.metrics[fcpMetricName].values) {
        browserFcp = data.metrics[fcpMetricName].values['p(90)'] || data.metrics[fcpMetricName].values['avg'] || 0;
     }
     if (data.metrics[lcpMetricName] && data.metrics[lcpMetricName].values) {
        browserLcp = data.metrics[lcpMetricName].values['p(90)'] || data.metrics[lcpMetricName].values['avg'] || 0;
     }

     // Extract the keys and their p(90) values
     console.log('-------New Logic Start (Optimized)----------');
     matches.forEach(match => {
         const key = match.path.toString();
        // const p90Value = jsonpath.value(data, `${key}.values.p(90)`).toString();
          if (key.includes('group_duration{')) {
             console.log(key);
            
             let group_name = findBetween(key, 'group:::', '}', false);
             
             // get Service, API, 
             console.log(group_name);
             let arr = findBetween(group_name, '', '_', true);
             let service_Name = arr[0];
             console.log(service_Name);
             let api_Name = arr[1];
             console.log(api_Name);
             let method_Name = arr[2];
             console.log(method_Name);
             let info = arr[3];
             console.log(info);
             console.log(group_name);
             let level = findBetween(key, method_Name+'_'+info+'_', '}', false);
             console.log(level);
             
             // Optimize access to values directly from match.value if possible, 
             // but keeping jsonpath for compatibility with existing parsing logic style if simpler, 
             // however match.value is the object itself so it's instant.
             const metricValue = match.value;
             // JSON.stringify(jsonpath.value(data, 'metrics["group_duration{group:::'+group_name+'}"].thresholds'));
             // Equivalent to:
             let threshold_objs = metricValue.thresholds;
             
             let threshold_name = '';
             let threshold_value = '';
             let result = 'true';
             
             if (threshold_objs) {
                 let tStr = JSON.stringify(threshold_objs);
                 threshold_name = 'p'+findBetween(findBetween(tStr, '{"', '< ', false), '(', ')', false);
                 threshold_value = findBetween(tStr, '< ', '":', false);
                 
                 // Result calculation
                 // Original: JSON.stringify(jsonpath.value(data, 'metrics["group_duration{...}"].thresholds.*.ok'))
                 // We can iterate the thresholds values
                 let allOk = true;
                 for (let k in threshold_objs) {
                     if (threshold_objs[k].ok === false) {
                         allOk = false;
                         break;
                     }
                 }
                 result = allOk ? 'true' : 'false';
             }

             console.log(threshold_objs);
             console.log(threshold_value+' : '+threshold_name);
             console.log(result);
             
             let status = (result === 'false') ? 'fail' : 'pass';
             console.log(status);
             
             let p90 = metricValue.values["p(90)"];
             console.log(p90);
             let p95 = metricValue.values["p(95)"];
             console.log(p95);
             let p99 = metricValue.values["p(99)"];
             console.log(p99);
             let execution_status = (p90 === 0) ? 'executionfail' : 'pass';
			 

            /// to find assement failuers status check
            console.log('-------response status check----------');
            // Check if group had failures using map
            if (groupFailures.has(group_name)) {
                execution_status = 'fail';
                status='na';
                p90=0;
                p95=0;
                p99=0;
            }
            
             console.log(execution_status);

             let load_time_val = 0;
             let page_name = "NA";
             let fcp_val = 0;
             let lcp_val = 0;

             // Inject Browser Load Time into the specific API group row
             // Target Group: LHIDM_Users_GetUser_Smoke
             if (group_name && group_name.indexOf('LHIDM_Users_GetUser_Smoke') !== -1) {
                 load_time_val = browserLoadTime;
                 
                 // Use the dynamically captured URL
                 page_name = capturedPageUrl;
                 
                 fcp_val = browserFcp;
                 lcp_val = browserLcp;
                 console.log(`[CSV Export] Injecting Browser metrics into ${group_name}`);
             }
           
             csv += `${currentDate},${__ENV.ENVNAME},${level},${service_Name},${api_Name},${method_Name},${page_name},${info},${p90},${p95},${p99},${errorRate},${threshold_value},${threshold_name},${status},${execution_status},${load_time_val},${fcp_val},${lcp_val}\n`;
         }
        //console.log(key);
        // Add desired metrics        
      
     });
     console.log('-------New Logic End (Optimized)----------');
       
     return csv;
 }

 function splitString(str, separator) {
  return str.split(separator);
 }

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
       // const randomIndex = randomIntBetween(0, characters.length - 1);
        result += faker.random.alphaNumeric();
    }
    return result;
}




export {generateToken,getCurrentDate,exportSummaryToCSV,splitString,generateRandomString,generateTokenTP,generateRandom12DigitNumber, generateRandom9DigitNumber, generateRandom2DigitNumber};
