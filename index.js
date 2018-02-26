const express = require('express');
const $ = require('jquery');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const FB = require('fb');
const _ = require('underscore');
const fetch = require('node-fetch');
const user_access_token = 'YOUR_USER_ACCESS_TOKEN';
const page_access_token = 'YOUR_PAGE_ACCESS_TOKEN';
const clientId = 'YOUR_CLIENT_ID';
const clientSecret = 'YOUR_CLIENT_SECRET';
const page_id = 'YOUR_TEST_PAGE_ID';
let accessToken;

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//Authenticate the application with the app credentials from your facebook developers account
FB.api('oauth/access_token', {
  client_id: clientId,
  client_secret: clientSecret,
  grant_type: 'client_credentials'
}, function (res) {
  if (!res || res.error) {
    console.log(!res ? 'error occurred' : res.error);
    return;
  }
  accessToken = res.access_token;
});


//Set the access token to your FB SDK for calling other apis with your access token
FB.setAccessToken(accessToken);

//Set up the page subscription in order to get real time leads from your facebook page lead ads form
subscribeApp(page_id, page_access_token);

function subscribeApp(page_id, page_access_token) {
  console.log('Subscribing page to app! ' + page_id);
  FB.api(
    '/' + page_id + '/subscribed_apps',
    'post',
    {access_token: page_access_token},
    function (response) {
      console.log('Successfully subscribed page', response);
      // insert in DB
    });
}

function generateStateValue(input) {

  let state_map = [
    ['Alabama', 'AL'],
    ['Alaska', 'AK'],
    ['American Samoa', 'AS'],
    ['Arizona', 'AZ'],
    ['Arkansas', 'AR'],
    ['Armed Forces Americas', 'AA'],
    ['Armed Forces Europe', 'AE'],
    ['Armed Forces Pacific', 'AP'],
    ['California', 'CA'],
    ['Colorado', 'CO'],
    ['Connecticut', 'CT'],
    ['Delaware', 'DE'],
    ['District Of Columbia', 'DC'],
    ['Florida', 'FL'],
    ['Georgia', 'GA'],
    ['Guam', 'GU'],
    ['Hawaii', 'HI'],
    ['Idaho', 'ID'],
    ['Illinois', 'IL'],
    ['Indiana', 'IN'],
    ['Iowa', 'IA'],
    ['Kansas', 'KS'],
    ['Kentucky', 'KY'],
    ['Louisiana', 'LA'],
    ['Maine', 'ME'],
    ['Marshall Islands', 'MH'],
    ['Maryland', 'MD'],
    ['Massachusetts', 'MA'],
    ['Michigan', 'MI'],
    ['Minnesota', 'MN'],
    ['Mississippi', 'MS'],
    ['Missouri', 'MO'],
    ['Montana', 'MT'],
    ['Nebraska', 'NE'],
    ['Nevada', 'NV'],
    ['New Hampshire', 'NH'],
    ['New Jersey', 'NJ'],
    ['New Mexico', 'NM'],
    ['New York', 'NY'],
    ['North Carolina', 'NC'],
    ['North Dakota', 'ND'],
    ['Northern Mariana Islands', 'NP'],
    ['Ohio', 'OH'],
    ['Oklahoma', 'OK'],
    ['Oregon', 'OR'],
    ['Pennsylvania', 'PA'],
    ['Puerto Rico', 'PR'],
    ['Rhode Island', 'RI'],
    ['South Carolina', 'SC'],
    ['South Dakota', 'SD'],
    ['Tennessee', 'TN'],
    ['Texas', 'TX'],
    ['US Virgin Islands', 'VI'],
    ['Utah', 'UT'],
    ['Vermont', 'VT'],
    ['Virginia', 'VA'],
    ['Washington', 'WA'],
    ['West Virginia', 'WV'],
    ['Wisconsin', 'WI'],
    ['Wyoming', 'WY'],
  ];

  let i;

  let valid_states = ["AK", "AL", "AR", "AS", "AZ", "CA", "CO", "CT", "DC", "DE", "FL", "GA", "GU", "HI", "IA", "ID", "IL", "IN",
    "KS", "KY", "LA", "MA", "MD", "ME", "MI", "MN", "MO", "MS", "MT", "NC", "ND", "NE", "NH", "NJ", "NM", "NV", "NY", "OH", "OK",
    "OR", "PA", "PR", "RI", "SC", "SD", "TN", "TX", "UT", "VA", "VT", "WA", "WI", "WV", "WY"];

  if (input.length !== 2) {
    input = input.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
    for (i = 0; i < state_map.length; i++) {
      if (state_map[i][0] === input) {
        return state_map[i][1];
      }
    }
    return 'UK';
  } else if (input.length === 2) {
    if (valid_states.indexOf(input) > -1) {
      return input;
    }
    return 'UK';
  }
}

//Setup the initial webhook call

app.get('/webhook', function (req, res) {

  //This verification token should be the same one you used when you create the webhook for your application in the developers account
  let VERIFY_TOKEN = "YOUR_VERIFICATION_TOKEN";
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    return res.send(req.query['hub.challenge']);
  }
  res.send('wrong token');
});


//Handle the HTTP callback from facebook with your lead information
app.post('/webhook', function (req, res) {
  let entry = req.body.entry;
  if (!Array.isArray(entry)) {
    return res.json({
      message: "No changes are detected."
    });
  }

  let changeArr = entry[0].changes;
  console.log("The changes are ", entry[0].changes);
  let leadIdArr = returnLeadIdArr(changeArr);

  let promiseArr = leadIdArr.map(id => {
    return retrieveLeadInformation(id);
  });

  Promise.all(promiseArr)
    .then(leadInformationArr => {

      //This is a sample lead information for the lead form, that contains the first_name, last_name, state, phone_number
      let lead = {};
      let leadFields = leadInformationArr[0].field_data;
      let adset_name = leadInformationArr[0].adset_name;
      let campaign_name = leadInformationArr[0].campaign_name;
      let ad_name = leadInformationArr[0].ad_name;
      let leadId = leadInformationArr[0].id;

      for (i in leadFields) {
        if (leadFields[i].name === 'state') {
          lead['mailing_address'] = {'state': generateStateValue(leadFields[i].values[0])};
        } else if (leadFields[i].name === 'phone_number') {
          lead["day_phone"] = leadFields[i].values[0].replace(/^\+[0-9]/, '');
        } else {
          lead[leadFields[i].name] = leadFields[i].values[0];
        }
      }

      lead["unsecured_debt"] = 20000;

      let post_data = _.extend({
        "tracking": {
          "unique_identifier": leadId,
          "utm_search_term": leadId,
          "utm_medium": "display",
          "utm_source": "facebook",
          "utm_term": ad_name || 'test',
          "utm_adgroup": adset_name || 'test',
          "utm_campaign": campaign_name || 'test'
        }
      }, lead);

      console.log("The lead information ", lead);
      postLeadIntoLP(post_data).then(res => {

        console.log("The lead is " + res.response + " by Lead Platform ", res);

      }).catch(error => {
        console.log("The error response ", error);
      });
      res.json({
        message: 'Successfully stored leads.',
        leadIdArr,
        leadInformationArr,
      });
    });

});

//Once you have the lead information parsed, you can post it into your DB

function postLeadIntoYourDB(post_data) {

  return new Promise((resolve, reject) => {
    console.log("The post data is ", post_data);

    fetch('YOUR_DB_API_SERVICE', {
      method: 'POST',
      body: JSON.stringify(post_data),
      headers: {
        'Content-Type': 'application/json',
        "Authorization": "Basic " + "YOUR_DB_TOKEN"
      },
    })
      .then(res => {
        console.log("Success Response ", res);
        return res.json()
      })
      .then(json => resolve(json))
      .catch(reject);
  });
}

function returnLeadIdArr(changeArr) {
  let leadIdArr = changeArr.reduce((sum, change) => {
    if (change.field !== 'leadgen') {
      return [...sum];
    } else {
      return [...sum, change.value.leadgen_id];
    }
  }, []);
  return leadIdArr;
}

//Use the leadgen_id and the Graph API endpoint to fetch the lead information from facebook
function retrieveLeadInformation(leadId) {
  let URL = 'https://graph.facebook.com/v2.12';
  let ACCESS_TOKEN = user_access_token;
  let endpoint = `${URL}/${leadId}?access_token=${ACCESS_TOKEN}` + '&fields=adset_name%2Ccampaign_name%2Cform_id%2Cfield_data%2Cad_name';

  return new Promise((resolve, reject) => {
    fetch(endpoint)
      .then(res => res.json())
      .then(resolve)
      .catch(reject);
  });
}

//Setup a port for your local env
const server = app.listen(8080, () => {
  const host = server.address().address;
  const port = server.address().port;

  console.log(`Example app listening at http://${host}:${port}`);
});



