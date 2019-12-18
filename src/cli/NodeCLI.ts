/** global process */

/**
 * @module @flowscripter/cli-framework
 */

import debug from 'debug';
import fs from 'fs';
import os from 'os';
import yaml from 'js-yaml';
import BaseCLI from './BaseCLI';

/**
 * Obtain config for the CLI execution.
 *
 * Default location of YAML file is *$HOME/.cli.yaml* unless another location is specified in
 * the environment variable *CLI_CONFIG*.
 *
 * Will cause a system exit if:
 *
 * * the config file location is a directory
 * * the config file location does not exist or is not visible AND it is a non-default location
 * * the config file location exists but it is not readable
 * * the config file is readable but fails to parse
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getConfig(): Map<string, any> {
    const log: debug.Debugger = debug('NodeCLI');

    let configFile: string;
    let customConfigLocation = false;

    if (process.env.CLI_CONFIG === undefined) {
        configFile = `${os.homedir()}/.cli.yaml`;
    } else {
        configFile = process.env.CLI_CONFIG;
        customConfigLocation = true;
    }
    log(`configFile: ${configFile}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = new Map<string, any>();

    try {
        fs.accessSync(configFile, fs.constants.F_OK);
        try {
            fs.accessSync(configFile, fs.constants.R_OK);

            const stat = fs.statSync(configFile);
            if (stat.isDirectory()) {
                process.stdout.write(`configFile: ${configFile} is a directory!\n`);
                process.exit(1);
            } else {
                const fileContents = fs.readFileSync(configFile, 'utf8');
                try {
                    const data = yaml.safeLoad(fileContents);
                    Object.keys(data).forEach((key) => {
                        config.set(key, data[key]);
                    });
                } catch (err) {
                    process.stdout.write(`configFile: ${configFile} failed to parse: ${err}\n`);
                    process.exit(1);
                }
            }
        } catch (err) {
            process.stdout.write(`configFile: ${configFile} is not readable!\n`);
            process.exit(1);
        }
    } catch (err) {
        if (customConfigLocation) {
            process.stdout.write(`configFile: ${configFile} doesn't exist or not visible!\n`);
            process.exit(1);
        } else {
            log(`configFile: ${configFile} doesn't exist or not visible - ignoring`);
        }
    }
    return config;
}

/**
 * Node command line process implementation of a [[CLI]].
 */
export default class NodeCLI extends BaseCLI {

    /**
     * Constructor which reads configuration from a *YAML* file and utilises *stdout* for output.
     */
    public constructor() {
        super(process.stdout, getConfig());
    }

    /**
     * Execute the CLI.
     *
     * Obtains arguments for parsing from the Node process arguments and drops the first two
     * which will be the node executable and the main entry module.
     */
    public async execute(): Promise<void> {
        await super.execute(process.argv.slice(2));
    }
}
