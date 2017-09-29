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
    let mocksFolder;
    function createMockFile(mocksFolder) {
      let mocks = path.join(mocksFolder, "**/*.{yaml,json}");

      let datas = shell
        .ls(mocks)
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
      console.log(process.cwd());
      mocksFolder = path.join(process.cwd(), mocks);
      console.log("mocksfolder", mocksFolder);
      if (!fs.existsSync(mocksFolder)) {
        winston.error("There is no folder " + mocksFolder);
        process.exit(1);
      }
      let Stubby = require("stubby").Stubby;
      let stubby = new Stubby();

      stubby.start({
        data: createMockFile(mocksFolder),
        persistent: true,
        quiet: nconf.get("quiet"),
        watch: tmpMockFile.name,
        admin: nconf.get("admin"),
        cert: nconf.get("cert"),
        key: nconf.get("key"),
        location: nconf.get("location"),
        pfx: nconf.get("pfx"),
        stubs: nconf.get("stubs"),
        tls: nconf.get("tls")
      });

      watch(mocksFolder, { recursive: true }, function(evt, name) {
        createMockFile(mocksFolder);
      });

      return "ok";
    });
  }
}

const instance = new Job();
export default instance;
