import NodeCLI from '../../src/cli/NodeCLI';

describe('NodeCLI test', () => {

    test('NodeCLI is instantiable', () => {
        expect(new NodeCLI()).toBeInstanceOf(NodeCLI);
    });
    // TODO: tests
});
