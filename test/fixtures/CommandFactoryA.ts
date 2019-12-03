import CommandFactory from '../../src/api/CommandFactory';
import Command from '../../src/api/Command';

export default class CommandFactoryA implements CommandFactory {

    // eslint-disable-next-line class-methods-use-this
    public getCommands(): Iterable<Command> {
        return [{
            name: 'command_a',
            run: async (): Promise<void> => {
                // empty
            }
        }];
    }
}
