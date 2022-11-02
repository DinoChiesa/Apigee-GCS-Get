# Apigee GCS Get Example

This Apigee proxy connects to a GCS bucket. It allows callers to GET objects
from the bucket.

## Disclaimer

This example is not an official Google product, nor is it part of an
official Google product.


## GCS Setup

You need to have a Google Cloud Storage bucket, with at least one object in it.

Also, in the same project, use the [Google Cloud console](https://console.cloud.google.com) to

1. create a Service account credential,

2. add the role "Storage Object Viewer" to the credential

3. download a service-account key in JSON format for this service account.


You can also do these things using [gcloud](https://cloud.google.com/sdk/docs/install), but I don't know the exact steps!


## Apigee Setup

Use the Apigee Admin UI to:

1. Create an environment-scoped encrypted KVM called 'secrets'

2. Import and Deploy the sharedflow.

3. Import and deploy the API proxy.

### Automation of setup

Alternatively, you can automate these steps using the provisioning tool.  It requires node and npm.

```
cd tools
npm install
ORG=myorg
ENV=test
# for Apigee Edge
node ./provision.js -v --token $TOKEN -o $ORG -e $ENV

# for Apigee X or hybrid
node ./provision.js -v --apigeex --token $TOKEN -o $ORG -e $ENV
```

You will need to have an OAuth token for your Apigee organization.


## Using the proxy

Now you need to upload the service-account key JSON file into the Apigee
KVM. The Apigee proxy will load it into the encrypted KVM map called "secrets".

```
# Edge
endpoint=https://$ORG-$ENV.apigee.net
# X or hybrid
endpoint=https://whatever-the-endpoint-is.com

curl -i $endpoint/gcs-get/kvm/keyjson \
  -X POST \
  -d @my-gcs-project-service-account-key.json
```

You should see a 204 / No Content response. This will indicate success. It provisions the
Service Account key JSON into the encrypted KVM in Apigee. This JSON will be used in the next step to
obtain an OAuth token.

Now, invoke the proxy to download an object from a named bucket.

```
BUCKET=my-bucket-name
OBJECT=my-object-name.xlsx
curl -i $endpoint/gcs-get/b/$BUCKET/o/$OBJECT
```

You should see the downloaded object.

If you have an object in a folder, then you must prepend the folder name to the object identifier, and URL-encode the slash.  like so:
```
OBJECT=foldername%2Fmy-object-name.xlsx
curl -i $endpoint/gcs-get/b/$BUCKET/o/$OBJECT
```

## What's Happening

The API Proxy uses the service account key to Obtain and cache an OAuth token
suitable for reading from GCS. It does this by calling out to a Shared Flow.  (** Please note: explicitly obtaining an OAuth token is no longer necessary if you use Apigee X, because Apigee X supports [the GoogleAuthentication element](https://cloud.google.com/apigee/docs/api-platform/security/google-auth/overview) in the ServiceCallouts and HTTPTargetConnections. )

The process of obtaining an OAuth token using the service account key is described
[here](https://developers.google.com/identity/protocols/oauth2/service-account#authorizingrequests). In
short, the app must create a self-signed JWT and POSTs it to
https://oauth2.googleapis.com/token with a x-www-form-urlencoded payload, and two form parameters:

* *grant_type* = urn:ietf:params:oauth:grant-type:jwt-bearer
* *assertion* = THE_JWT


The JWT payload must be like this:
```
{
  "aud": "https://oauth2.googleapis.com/token",
  "scope": "https://www.googleapis.com/auth/devstorage.read_only",
  "iss": "gcs-access-1@dchiesa-first-project.iam.gserviceaccount.com",
  "exp": 1611961265,
  "iat": 1611961235,
  "jti": "21a59398-b9f1-4fde-a109-a3d4aacd0f29"
}
```

Some highlights there:
* the `aud` claim must be the Googleapis oauth token endpoint URL
* the lifetime of the token (`exp` - `iat`) must be no longer than 5 minutes (300 seconds)
* the `scope` should be appropriate for whatever you want the token to do... in this case we want to read from GCS, so that scope will be the minimum necessary.

That JWT must be signed with the private key belonging to the service account.
Whew, that's a lot to keep straight!

The response contains an OAuth token, like this:

```
{
  "access_token":"ya29.c.Kp0B7wfDA...",
  "expires_in":3599,
  "token_type":"Bearer"
}
```

The API Proxy then uses _that token_ to inquire the object in GCS, via
ServiceCallout.  With this step, it retrieves the media link for the
object. Finally, the proxy sets the `target.url` to the value of that media
link, again using the googleapis OAuth token. In other words, Apigee proxies to
the GCS endpoint.


## Apigee Teardown

Use the Apigee Admin UI to:

1. Undeploy and delete the API proxy.

2. Undeploy and delete the sharedflow.

3. remove the `googleapis_credentials_json` Key/value pair from the `secrets` key value map .


### Automation of teardown

Instead of using the Apigee UI, you can use the provisioning tool to tear down the things that you have set up.

```
node ./provision.js -v -n -o $ORG -e $ENV -R
```

The tool will prompt you for authentication credentials for Apigee.
If you use the tool, you need to separately, manually delete the `googleapis_credentials_json` key/value pair from the `secrets` key value map.


## Support

This example open-source configuration, and is not a supported part of Apigee.
If you need assistance using it, you can try inquiring on [The Apigee Community
Site](https://community.apigee.com). There is no service-level guarantee for
responses to inquiries regarding this example.

## License

This material is Copyright 2020-2022 Google LLC.
and is licensed under the [Apache 2.0 License](LICENSE).
