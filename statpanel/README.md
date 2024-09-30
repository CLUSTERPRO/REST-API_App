# StatPanel

StatPanel is a sample application to display status and control clusters with using EXPRESSCLUSTER or CLUSTERPRO RESTful API.

This application runs on Node.js v18 or higher.

## Sample Application

To see a simple sample application, build as follows:

1. Build

run commands as follows:

```
cd statpanel
npm install
npm run build
```

2. Configuration

Create config.json as a configuration file, and specify your EXPRESSCLUSTER or CLUSTERPRO API server to "clpserver". Multiple servers can be monitored by writing multiple entries in "servers".

```
{
  "listen": {
    "host": "localhost",
    "port": 3000,
    "ssl": true,
    "ssl_cert_file": "./server.crt",
    "ssl_key_file": "./server.key"
  },
  "servers": [
    {
      "clpserver": "https://yourserver:29009",
      "user": "user id",
      "passwd": "password"
    }
  ],
  "skipCertificateCheck": false
}
```

> Note: "API server" function must be enabled in the cluster properties on the servers which are installed EXPRESSCLUSTER or CLUSTERPRO.

3. Start

Start web server on your localhost:

```
npm run start
```

And access https://localhost:3000/ in your browser

## License

Released under the MIT license
