#!/usr/bin/env node

const winston = require("winston");
const stubby = require("../babel/stubby-simply").default;

stubby.configure();
stubby.run().catch(err => {
  winston.log("error", err);
  process.exit(1);
});
