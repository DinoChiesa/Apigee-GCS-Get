#! /usr/local/bin/node
/*jslint node:true */
// provisioningTool.js
// ------------------------------------------------------------------
// provision an Apigee Proxy and sharedflow for a GCS example.
//
// Copyright 2017-2020 Google LLC.
//

/* jshint esversion: 9, strict:implied */

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// last saved: <2021-January-29 14:09:21>

const apigeejs   = require('apigee-edge-js'),
      common     = apigeejs.utility,
      apigee     = apigeejs.edge,
      util       = require('util'),
      path       = require('path'),
      Getopt     = require('node-getopt'),
      version    = '20210129-1227',
      getopt     = new Getopt(common.commonOptions.concat([
        ['R' , 'reset', 'Optional. Reset, delete all the assets previously created by this script'],
        ['e' , 'env=ARG', 'the Edge environment to use for this demonstration. ']
      ])).bindHelp();

const apiproxyName   = 'gcs-get',
      sharedflowName = 'get-googleapis-token',
      kvmMapName     = 'secrets',
      proxyHome      = path.join(__dirname, '../proxies'),
      sfHome         = path.join(__dirname, '../sharedflows'),
      note           = 'created '+ (new Date()).toISOString() + ' for GCS-Get example';

// ========================================================

function insureOneMap(org, opt) {
  return }

function resetDemo(org) {
  let delOptions = {
        sharedflow : { environment: opt.options.env, name: sharedflowName },
        proxy      : { environment: opt.options.env, name: apiproxyName }
      };

  // delete items and ignore 404 errors
  return Promise.resolve({})
    .then( _ => org.proxies.undeploy(delOptions.proxy)
           .catch(e => {
             if ( ! e.result || (e.result.code != 'distribution.RevisionNotDeployed' &&
                                 e.result.code != 'messaging.config.beans.ApplicationDoesNotExist')) {
               console.log(e);
             }
           }))
    .then( _ => org.proxies.del(delOptions.proxy)
           .catch(e => {
             if ( ! e.result || e.result.code != 'messaging.config.beans.ApplicationDoesNotExist' ) {
               console.log(e);
             }
           }))
    .then( _ => org.sharedflows.undeploy(delOptions.sharedflow)
           .catch(e => {
             if ( ! e.result || (e.result.code != 'distribution.RevisionNotDeployed' &&
                                 e.result.code != 'messaging.config.beans.ApplicationDoesNotExist')) {
               console.log(e);
             }
           }))
    .then( _ => org.sharedflows.del(delOptions.sharedflow)
           .catch(e => {
             if ( ! e.result || e.result.code != 'messaging.config.beans.SharedFlowDoesNotExist' ) {
               console.log(e);
             }
           }))

    .then( _ => common.logWrite('ok. demo assets have been deleted'));
}

console.log(
  'Apigee GCS-Get Example Provisioning tool, version: ' + version + '\n' +
    'Node.js ' + process.version + '\n');

common.logWrite('start');
let opt = getopt.parse(process.argv.slice(2));
common.verifyCommonRequiredParameters(opt.options, getopt);

if ( !opt.options.env ) {
  console.log('You must specify an environment');
  getopt.showHelp();
  process.exit(1);
}

let connectOptions = {
        mgmtServer : opt.options.mgmtserver,
        org        : opt.options.org,
        user       : opt.options.username,
        password   : opt.options.password,
        no_token   : opt.options.notoken,
        verbosity  : opt.options.verbose || 0
      };

apigee.connect(connectOptions)
  .then( org => {
    common.logWrite('connected');
    if (opt.options.reset) {
      return resetDemo(org);
    }
    return Promise.resolve({})
      .then( _ =>
             org.kvms.get({ environment: opt.options.env })
             .then(r =>
                   (r.indexOf(kvmMapName) == -1) &&
                   org.kvms.create({ environment: opt.options.env, name: kvmMapName, encrypted: true})))
      .then( _ => org.sharedflows.import({source: path.join(sfHome, sharedflowName)}))
      .then( r => org.sharedflows.deploy({name:r.name, revision:r.revision, environment: opt.options.env}))
      .then( _ => org.proxies.import({source: path.join(proxyHome, apiproxyName)}))
      .then( r => org.proxies.deploy({name:r.name, revision:r.revision, environment: opt.options.env}))
      .then( _ => common.logWrite('OK'));
  })
  .catch( e => console.log(util.format(e)) );
