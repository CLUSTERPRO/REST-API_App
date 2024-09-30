import express from 'express';
import { createServer } from 'http';
import { createServer as createHTTPSServer } from 'https';
import { WebServer } from './dist/lib/esm/webserver.js';
import { readFile } from 'fs/promises';

// read config
const config = JSON.parse(await readFile('./config.json'));

// skip SSL verification when skipCertificateCheck is true
if (config.skipCertificateCheck) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// make web server
const app = express();
const server = config.listen.ssl
    ? createHTTPSServer(
          {
              key: await readFile(config.listen.ssl_key_file),
              cert: await readFile(config.listen.ssl_cert_file),
          },
          app,
      )
    : createServer(app);
const sv = new WebServer(server);
sv.addClusterServer(config.servers);

app.use(express.static('./dist'));

// start server
sv.start();
const proto = config.listen.ssl ? 'https' : 'http';
const host = config.listen.host;
const port = config.listen.port;
console.log('GUI Server started.');
console.log(`Go to ${proto}://${host}:${port} in a browser to see the cluster status.`);
server.listen(port, host);
