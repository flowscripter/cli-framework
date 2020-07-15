/**
 * @module @flowscripter/cli-framework
 */

/** global process */

import debug from 'debug';
import BaseNodeCLI from './BaseNodeCLI';
import { MultiCommandHelpGlobalCommand, MultiCommandHelpSubCommand } from '../core/command/HelpCommand';
import UsageCommand from '../core/command/UsageCommand';
import { PrompterService } from '../core/service/PrompterService';
import { StderrPrinterService, StdoutPrinterService } from '../core/service/PrinterService';
import VersionCommand from '../core/command/VersionCommand';
import Command from '../api/Command';

const helpGlobalCommand = new MultiCommandHelpGlobalCommand();
const usageCommand = new UsageCommand(helpGlobalCommand);

/**
 * Node command line process implementation of a [[CLI]] configured for a multiple
 * command application with simple features.
 */
export default class SimpleMultiCommandNodeCLI extends BaseNodeCLI {

    protected readonly log: debug.Debugger = debug('SimpleMultiCommandNodeCLI');

    /**
     * Constructor taking an optional name.
     *
     * Configures the CLI with `stdout` and `stderr` [[PrinterService]] implementations,
     * a [[PrompterService]] implementation and help, usage and version support.
     *
     * @param commands an array of [[Command]] instances to register with the CLI.
     * @param name an optional name for the CLI. If not specified it will be taken from the `package.json` file.
     */
    public constructor(commands: Command[], name?: string) {
        super([
            new StderrPrinterService(90),
            new StdoutPrinterService(90),
            new PrompterService(90)
        ], [
            helpGlobalCommand,
            new MultiCommandHelpSubCommand(),
            new VersionCommand(),
            ...commands
        ], new Map(), new Map(), name, usageCommand, usageCommand);
    }
}
