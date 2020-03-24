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
     * Constructor which reads configuration from a *YAML* file and utilises *stdout* for output.
     */
    public constructor() {
        super({
            name: packageInfo.name,
            description: packageInfo.description,
            version: packageInfo.version,
            stdin: process.stdin,
            stdout: process.stdout,
            stderr: process.stderr
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
