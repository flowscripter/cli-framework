import Command, { CommandArgs } from '../../api/Command';
import Context from '../../api/Context';

/**
 * @module @flowscripter/cli-framework
 */
export default class InstallCommand implements Command {

    public readonly name = 'install';

    // TODO: implement
    /**
     * TODO: docs
     * Prints CLI help
     *
     * @param commandArgs the arguments for the command.
     * @param context the [[Context]] in which to run.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,class-methods-use-this
    public run(commandArgs: CommandArgs, context: Context): Promise<void> {
        return new Promise((resolve) => {
            resolve();
        });
    }
}
