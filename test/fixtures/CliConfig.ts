import { CliConfig } from '../../src';
import { PluginManagerConfig } from '../../src/api/Context';

// eslint-disable-next-line import/prefer-default-export
export function getCliConfig(pluginManagerConfig?: PluginManagerConfig): CliConfig {
    return {
        name: 'foo',
        description: 'foo bar',
        version: '1.2.3',
        stdout: process.stdout,
        stderr: process.stderr,
        stdin: process.stdin,
        pluginManagerConfig
    };
}
