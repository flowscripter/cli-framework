import CLIConfig from '../../src/api/CLIConfig';

// eslint-disable-next-line import/prefer-default-export
export function getCliConfig(): CLIConfig {
    return {
        name: 'foo',
        description: 'foo bar',
        version: '1.2.3',
        stdout: process.stdout,
        stderr: process.stderr,
        stdin: process.stdin
    };
}
