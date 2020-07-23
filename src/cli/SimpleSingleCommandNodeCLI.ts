/**
 * @module @flowscripter/cli-framework
 */

/** global process */

/* eslint-disable @typescript-eslint/no-explicit-any */

import debug from 'debug';
import BaseNodeCLI from './BaseNodeCLI';
import VersionCommand from '../core/command/VersionCommand';
import { SingleCommandHelpGlobalCommand, SingleCommandHelpSubCommand } from '../core/command/HelpCommand';
import { PrompterService } from '../core/service/PrompterService';
import { StderrPrinterService, StdoutPrinterService } from '../core/service/PrinterService';
import UsageCommand from '../core/command/UsageCommand';
import SubCommand from '../api/SubCommand';

/**
 * Node command line process implementation of a [[CLI]] configured for a single
 * command application with simple features.
 */
export default class SimpleSingleCommandNodeCLI extends BaseNodeCLI {

    protected readonly log: debug.Debugger = debug('SimpleSingleCommandNodeCLI');

    protected static readonly helpGlobalCommand = new SingleCommandHelpGlobalCommand();

    protected static readonly helpSubCommand = new SingleCommandHelpSubCommand();

    protected static readonly usageCommand = new UsageCommand(SimpleSingleCommandNodeCLI.helpGlobalCommand);

    /**
     * Constructor taking the single [[SubCommand]] instance to be executed
     * and an optional name.
     *
     * Configures the CLI with `stdout` and `stderr` [[PrinterService]] implementations,
     * a [[PrompterService]] implementation and help, usage and version support.
     *
     * @param subCommand the single [[SubCommand]] to be run as default when the CLI is run.
     * @param name an optional name for the CLI. If not specified it will be taken from the `package.json` file.
     */
    public constructor(subCommand: SubCommand, name?: string) {
        super([
            new StderrPrinterService(90),
            new StdoutPrinterService(90),
            new PrompterService(90)
        ], [
            SimpleSingleCommandNodeCLI.helpGlobalCommand,
            SimpleSingleCommandNodeCLI.helpSubCommand,
            new VersionCommand()
        ], new Map(), new Map(), name, subCommand, SimpleSingleCommandNodeCLI.usageCommand);
        SimpleSingleCommandNodeCLI.helpGlobalCommand.defaultCommand = subCommand;
        SimpleSingleCommandNodeCLI.helpSubCommand.defaultCommand = subCommand;
    }
}
