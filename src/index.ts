/* API */

export { default as CLI } from './api/CLI';
export { default as CommandRegistry } from './api/CommandRegistry';
export { default as Command, CommandArgs } from './api/Command';
export { default as SubCommand, UsageExample } from './api/SubCommand';
export { default as GlobalCommand } from './api/GlobalCommand';
export { default as GlobalModifierCommand } from './api/GlobalModifierCommand';
export { default as GroupCommand } from './api/GroupCommand';
export { default as Context } from './api/Context';
export { default as CLIConfig } from './api/CLIConfig';
export { default as ServiceRegistry } from './api/ServiceRegistry';
export { default as Service } from './api/Service';
export { ArgumentValueTypeName, ArgumentSingleValueType, ArgumentValueType } from './api/ArgumentValueType';
export { default as Argument } from './api/Argument';
export { default as SubCommandArgument } from './api/SubCommandArgument';
export { default as Positional } from './api/Positional';
export { default as Option } from './api/Option';
export { default as GlobalCommandArgument } from './api/GlobalCommandArgument';
export { default as Parser } from './api/Parser';
export { default as Runner, RunResult } from './api/Runner';
export {
    isGroupCommand,
    isSubCommand,
    isGlobalModifierCommand,
    isGlobalCommand
} from './api/CommandTypeGuards';

/* CLI implementations */

export { default as BaseCLI } from './cli/BaseCLI';
export { default as BaseNodeCLI } from './cli/BaseNodeCLI';
export { default as SimpleSingleCommandNodeCLI } from './cli/SimpleSingleCommandNodeCLI';
export { default as SimpleMultiCommandNodeCLI } from './cli/SimpleMultiCommandNodeCLI';
export { default as AdvancedMultiCommandNodeCLI } from './cli/AdvancedMultiCommandNodeCLI';

/* Command implementations */

export { default as VersionCommand } from './core/command/VersionCommand';
export { default as UsageCommand } from './core/command/UsageCommand';
export { default as LogLevelCommand } from './core/command/LogLevelCommand';
export { default as ConfigCommand } from './core/command/ConfigCommand';
export { ColorCommand, NoColorCommand } from './core/command/ColorCommand';
export {
    MultiCommandHelpSubCommand,
    MultiCommandHelpGlobalCommand,
    SingleCommandHelpSubCommand,
    SingleCommandHelpGlobalCommand
} from './core/command/HelpCommand';

/* Service implementations */

export {
    default as Configuration,
    ConfigurationService,
    CONFIGURATION_SERVICE
} from './core/service/ConfigurationService';

export {
    default as Printer,
    StdoutPrinterService,
    StderrPrinterService,
    STDOUT_PRINTER_SERVICE,
    STDERR_PRINTER_SERVICE
} from './core/service/PrinterService';

export {
    default as Prompter,
    PrompterService,
    PROMPTER_SERVICE
} from './core/service/PrompterService';

/* Plugin support */

export {
    default as PluginRegistry,
    PLUGIN_REGISTRY_SERVICE,
    PluginManagerConfig,
    PluginRegistryService,
    PluginManagerClass
} from './plugin/service/PluginRegistryService';

export { default as PluginCommand } from './plugin/command/PluginCommand';

export {
    default as CommandFactory,
    COMMAND_FACTORY_PLUGIN_EXTENSION_POINT_ID,
    handleLoadedCommandFactory
} from './plugin/CommandFactory';

export {
    default as ServiceFactory,
    SERVICE_FACTORY_PLUGIN_EXTENSION_POINT_ID,
    handleLoadedServiceFactory
} from './plugin/ServiceFactory';
