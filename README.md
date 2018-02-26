****To get started, create a facebook test account for your application

Now use this credentials to sign into the developers account at:    https://developers.facebook.com

Setup your test application and this will create an Application ID and Application Secret that you will need to use to
authenticate your application using the Facebook SDK

Use NPM to install the Facebook SDK if you are using node to develop your application: https://www.npmjs.com/package/fb

Follow the steps in the index.js to get the access token and set it to your FB SDK

Follow the steps on this page to get your page access token and user access token:

https://developers.facebook.com/docs/facebook-login/access-tokens

For reference you can use the FB Graph API to generate this tokens:

https://developers.facebook.com/tools/explorer/145634995501895

It is always good to have long-lived tokens versus short lived ones, so that you don't have to extend them;
Use the token debugger to extend your access tokens so that they never expire:

https://developers.facebook.com/tools/accesstoken/

Setup your webhook in the developers account and provide a callback URL and the application verification token,
Here are the steps to setup your webhook: https://developers.facebook.com/docs/graph-api/webhooks#setup

If you don't want to use Webhook and have your own CRM instead then you can refer to the other methods of retrieving
your lead ads here: https://developers.facebook.com/docs/marketing-api/guides/lead-ads/retrieving

Also you need to setup a GET and POST method to the same endpoint(Refer to the code in index.js)

Once the webhook is setup, use Graph API to setup the page subscription to your application (refer to index.js)

Finally to can test your lead ads functionality by posting a lead to your form using the testing tool:

https://developers.facebook.com/tools/lead-ads-testing

Setup logs to monitor the leads flowing through from the lead ads form to your database if your posting and saving
the lead information at your end.

