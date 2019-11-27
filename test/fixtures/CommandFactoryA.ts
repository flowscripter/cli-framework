import CommandFactory from '../../src/api/CommandFactory';
import Command from '../../src/api/Command';

export default class CommandFactoryA implements CommandFactory<string> {

    // eslint-disable-next-line class-methods-use-this
    public getCommands(): Iterable<Command<string>> {
        return [{
            name: 'command_a',
            run: async (): Promise<void> => { }
        }];
    }
}
