import { IncomingMessage, ServerResponse } from "http";
import fs from 'fs';

const http = require("http");

fs.readFile('./index.html', function (err, html) {
    if (err) {
        throw err;
    }

    http
        .createServer(function(req: IncomingMessage, res: ServerResponse) {
            res.write(html); // write a response to the client
            res.end(); // end the response
        })
        .listen(8080);
});
