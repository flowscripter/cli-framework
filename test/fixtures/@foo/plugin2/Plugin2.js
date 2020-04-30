/* eslint-disable */

class ServiceFactoryB {
    getServices() {
        return [{
            id: 'service_b',
            initPriority: 100,
            config: {},
            init: (context) => {}
        }];
    }
}

class CommandFactoryB {
    getCommands() {
        return [{
            name: 'command_b',
            description: 'this is command b',
            options: [{
                name: 'foo'
            }],
            positionals: [],
            run: async (commandArgs, context) => {}
        }];
    }
}

class ServiceFactoryBExtensionFactory {
    create() {
        return Promise.resolve(new ServiceFactoryB());
    }
}

class CommandFactoryBExtensionFactory {
    create() {
        return Promise.resolve(new CommandFactoryB());
    }
}

export class ServiceFactoryDescriptor {

    constructor() {
        this.extensionPointId = 'service_factory_plugin_extension_point';

        this.factory = new ServiceFactoryBExtensionFactory();

        this.extensionData = 'foo';
    }
}

export class CommandFactoryDescriptor {

    constructor() {
        this.extensionPointId = 'command_factory_plugin_extension_point';

        this.factory = new CommandFactoryBExtensionFactory();

        this.extensionData = 'foo';
    }
}

export default class Plugin2 {

    constructor() {
        this.extensionDescriptors = [
            new ServiceFactoryDescriptor(),
            new CommandFactoryDescriptor()
        ];

        this.pluginData = 'bar';
    }
}
