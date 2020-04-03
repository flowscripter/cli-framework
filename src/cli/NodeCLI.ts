/** global process */

/**
 * @module @flowscripter/cli-framework
 */

import fs from 'fs';
import debug from 'debug';
import BaseCLI from './BaseCLI';

const packageInfo = JSON.parse(fs.readFileSync('package.json', 'utf8'));

/**
 * Node command line process implementation of a [[CLI]].
 */
export default class NodeCLI extends BaseCLI {

    protected readonly log: debug.Debugger = debug('NodeCLI');

    /**
     * Constructor taking an optional config. If not provided name, description and version will be read from the
     * *package.json* file, *stdout* and *stderr* will be used for output and *stdin* for input.
     *
     * @param cliConfig an optional CLI configuration object which will be made available in the [[Context]].
     * It should have the following required properties defined:
     * * `name` a string value for the CLI name which will be provided to [[Help]] and [[Usage]] [[Command]]
     * implementations.
     * * `description` a string value for a CLI description which will be provided to [[Help]] and [[Usage]] [[Command]]
     * implementations.
     * * `version` a string value for the CLI version which will be provided to a [[Version]] [[Command]]
     * implementation.
     * * *stdin* a Readable stream which will be provided to a [[Prompter]] [[Service]]
     * implementation.
     * * *stdout* a Writable stream which will be provided to a stdout [[Printer]] [[Service]]
     * implementation.
     * * *stderr* a Writable stream which will be provided to a stderr [[Printer]] [[Service]]
     * implementation.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public constructor(cliConfig?: any) {
        super({
            name: cliConfig ? cliConfig.name || packageInfo.name : packageInfo.name,
            description: cliConfig ? cliConfig.description || packageInfo.description : packageInfo.description,
            version: cliConfig ? cliConfig.version || packageInfo.version : packageInfo.version,
            stdin: cliConfig ? cliConfig.stdin || process.stdin : process.stdin,
            stdout: cliConfig ? cliConfig.stdout || process.stdout : process.stdout,
            stderr: cliConfig ? cliConfig.stderr || process.stderr : process.stderr
        });
    }

    /**
     * Execute the CLI.
     *
     * Obtains arguments for parsing from the Node process arguments and drops the first two
     * which will be the node executable and the main entry module.
     *
     * Will call system exit with an exit code of `0` on successful execution and `1` for a failure
     */
    public async execute(): Promise<number> {
        try {
            const code = await super.execute(process.argv.slice(2));
            process.exit(code);
        } catch (err) {
            this.log(`execution error: ${err.message}`);
            process.exit(1);
        }
    }
}
