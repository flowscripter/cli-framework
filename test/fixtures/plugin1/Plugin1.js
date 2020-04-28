/* eslint-disable */

class ServiceFactoryA {
    getServices() {
        return [{
            id: 'service_a',
            initPriority: 100,
            config: {},
            init: (context) => {}
        }];
    }
}

class CommandFactoryA {
    getCommands() {
        return [{
            name: 'command_a',
            description: 'this is command a',
            options: [{
                name: 'foo'
            }],
            positionals: [],
            run: async (commandArgs, context) => {}
        }];
    }
}

class ServiceFactoryAExtensionFactory {
    create() {
        return Promise.resolve(new ServiceFactoryA());
    }
}

class CommandFactoryAExtensionFactory {
    create() {
        return Promise.resolve(new CommandFactoryA());
    }
}

export class ServiceFactoryDescriptor {

    constructor() {
        this.extensionPointId = 'service_factory_plugin_extension_point';

        this.factory = new ServiceFactoryAExtensionFactory();

        this.extensionData = 'foo';
    }
}

export class CommandFactoryDescriptor {

    constructor() {
        this.extensionPointId = 'command_factory_plugin_extension_point';

        this.factory = new CommandFactoryAExtensionFactory();

        this.extensionData = 'foo';
    }
}

export default class Plugin1 {

    constructor() {
        this.extensionDescriptors = [
            new ServiceFactoryDescriptor(),
            new CommandFactoryDescriptor()
        ];

        this.pluginData = 'bar';
    }
}
