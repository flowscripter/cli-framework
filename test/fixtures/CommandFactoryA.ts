// eslint-disable-next-line max-classes-per-file
import CommandFactory from '../../src/api/CommandFactory';
import Command, { CommandArgs } from '../../src/api/Command';
import SubCommand from '../../src/api/SubCommand';
import Context from '../../src/api/Context';

export class SubCommandA implements SubCommand {
    readonly name = 'command_a';

    readonly description = 'this is command a';

    readonly options = [{
        name: 'foo'
    }];

    readonly positionals = [];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars,class-methods-use-this
    public async run(commandArgs: CommandArgs, context: Context): Promise<void> {
    // empty
    }
}

export default class CommandFactoryA implements CommandFactory {

    // eslint-disable-next-line class-methods-use-this
    public getCommands(): Iterable<Command> {
        return [new SubCommandA()];
    }
}
