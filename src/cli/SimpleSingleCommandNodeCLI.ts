/**
 * @module @flowscripter/cli-framework
 */

/** global process */

/* eslint-disable @typescript-eslint/no-explicit-any */

import debug from 'debug';
import BaseNodeCLI from './BaseNodeCLI';
import VersionCommand from '../core/command/VersionCommand';
import { HelpGlobalCommand } from '../core/command/HelpCommand';
import { PrompterService } from '../core/service/PrompterService';
import { StderrPrinterService, StdoutPrinterService } from '../core/service/PrinterService';
import UsageCommand from '../core/command/UsageCommand';
import GlobalCommand from '../api/GlobalCommand';

const helpGlobalCommand = new HelpGlobalCommand();
const usageCommand = new UsageCommand(helpGlobalCommand);

/**
 * Node command line process implementation of a [[CLI]] configured for a single
 * command application with simple features.
 */
export default class SimpleSingleCommandNodeCLI extends BaseNodeCLI {

    protected readonly log: debug.Debugger = debug('SimpleSingleCommandNodeCLI');

    /**
     * Constructor taking the single [[GlobalCommand]] instance to be executed
     * and an optional name.
     *
     * Configures the CLI with `stdout` and `stderr` [[PrinterService]] implementations,
     * a [[PrompterService]] implementation and help, usage and version support.
     *
     * @param globalCommand the single [[GlobalCommand]] to be run as default when the CLI is run.
     * @param name an optional name for the CLI. If not specified it will be taken from the `package.json` file.
     */
    public constructor(globalCommand: GlobalCommand, name?: string) {
        super([
            new StderrPrinterService(90),
            new StdoutPrinterService(90),
            new PrompterService(90)
        ], [
            new HelpGlobalCommand(),
            new VersionCommand()
        ], new Map(), new Map(), name, globalCommand, usageCommand);
    }
}
