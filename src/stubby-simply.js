import { nconf, inquire } from "nquirer";
import winston from "winston";

import shell from "shelljs";
import watch from "node-watch";
import jsyaml from "js-yaml";
import tmp from "tmp";
import fs from "fs";
import path from "path";

import argvConfig from "../config/argv.json";
import defaultConfig from "../config/default-config.json";

export class Job {
  configure() {
    // Default nconf configuration
    // https://github.com/indexzero/nconf
    nconf
      .argv(argvConfig)
      .env()
      .defaults(defaultConfig)
      .file("default-config.json");

    // Logging
    // https://github.com/winstonjs/winston#logging-levels
    winston.level = nconf.get("logLevel");
  }

  run() {
    // Prompt for missing configurations and continue with application logic...
    let tmpMockFile = tmp.fileSync();

    function createMockFile(mocks) {
      console.log("mocks", mocks);
      console.log("path", path.join(mocks, "**/*.{yaml,json}"));

      let datas = shell
        .ls(path.join(mocks, "**/*.{yaml,json}"))
        .map(filepath => {
          if (/\.yaml$/.test(filepath)) {
            return jsyaml.load(shell.cat(filepath));
          }
          if (/\.json$/.test(filepath)) {
            return require(filepath);
          }
          return null;
        })
        .filter(str => str !== null);
      fs.writeFileSync(tmpMockFile.name, JSON.stringify(datas), "utf8");
      return datas;
    }

    return inquire().then(nconf => {
      // verify mock folder
      let mocks = nconf.get("mocks");
      if (!fs.existsSync(mocks)) {
        winston.error(`There is no folder ${mocks}`);
        process.exit(1);
      }

      let Stubby = require("stubby").Stubby;
      let stubby = new Stubby();

      stubby.start({
        data: createMockFile(nconf.get("mocks")),
        persistent: true,
        quiet: nconf.get("quiet"),
        watch: tmpMockFile.name
      });

      watch("mocks/", { recursive: true }, function(evt, name) {
        createMockFile(nconf.get("mocks"));
      });

      /*winston.log("info", "Retrieved credentials from nconf");
      winston.log("debug", `Username: ${username}`);

      winston.log("silly", "(__)");
      winston.log("silly", `(oo) <-- ${username}`);
      winston.log("silly", " \\/");

      winston.log("info", "Job complete.");*/
      return "ok";
    });
  }
}

const instance = new Job();
export default instance;
