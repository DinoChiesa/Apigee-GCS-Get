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

1. Create an encrytped KVM called 'secrets'

2. Import and Deploy the sharedflow.

3. Import and deploy the API proxy. 

### Automation of setup

Alternatively, you can automate these steps using the provisioning tool.  It requires node and npm. 

```
cd tools
ORG=myorg
ENV=test
node ./provision.js -v -n -o $ORG -e $ENV 
```

The tool will prompt you for authentication credentials for Apigee. 


## Using the proxy

Upload the service-account key JSON file. The Apigee proxy will load it into the encrypted KVM map called "secrets".
```
curl -i https://$ORG-$ENV.apigee.net/gcs-get/kvm/keyjson \
  -X POST \
  -d @my-gcs-project-service-account-key.json 
```

You should see a 204 / No Content response. 

Now, invoke the proxy to download an object from a named bucket. 

```
BUCKET=my-bucket-name
OBJECT=my-object-name.xlsx
curl -i https://$ORG-$ENV.apigee.net/gcs-get/b/$BUCKET/o/$OBJECT
```


You should see the downloaded object. 

## What's Happening

The API Proxy uses the  service account key to Obtain and cache an OAuth token suitable for 
reading from GCS. 

It then uses that token to inquire the object and retrieve the media link for the object, and then 
performs a GET on that media link, again using the googleapis OAuth token. 



## Apigee Teardown

Use the Apigee Admin UI to: 

1. Undeploy and delete the API proxy. 

2. Undeploy and delete the sharedflow.

3. remove the `googleapis_credentials_json` Key/value pair from the `secrets` key value map . 


### Automation of teardown

The provisioning tool also can tear down the things that have been set up. 

```
node ./provision.js -v -n -o $ORG -e $ENV -R
```

The tool will prompt you for authentication credentials for Apigee. 
If you use the tool, you need to manually delete the `googleapis_credentials_json` key/value pair from the `secrets` key value map. 


## Support

This example open-source configuration, and is not a supported part of Apigee.
If you need assistance using it, you can try inquiring on [The Apigee Community
Site](https://community.apigee.com). There is no service-level guarantee for
responses to inquiries regarding this example.

## License

This material is Copyright 2020 Google LLC.
and is licensed under the [Apache 2.0 License](LICENSE). 

