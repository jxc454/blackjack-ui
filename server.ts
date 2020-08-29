import { IncomingMessage, ServerResponse } from "http";
import fs from "fs";

const http = require("http");

fs.readFile("./dist/public/index.html", function(err, html) {
  if (err) {
    throw err;
  }
    console.log('GOING TO LISTEN NOW')
  http
    .createServer(function(req: IncomingMessage, res: ServerResponse) {
      res.write(html); // write a response to the client
      res.end(); // end the response
    })
    .listen(8080, () => console.log("LISTENING ON PORT 8080"));
});
