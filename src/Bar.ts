/**
 * @module @flowscripter/ts-template
 */
import debug from 'debug';


/**
 * Bar
 */
export default class Bar {

    private readonly log: debug.Debugger;

    /**
     * Constructor
     */
    public constructor() {
        this.log = debug('Bar');
    }

    /**
     * Dump information to log
     */
    public dump(): void {
        this.log('Bar');
    }

    /**
     * Throw an Error when requested
     *
     * @param hazError whether or not the invocation should throw an Error
     *
     * @throws *Error* if `hazError` was specified as `true`
     */
    public iHazError(hazError: boolean): void {
        this.log('iHazError called');
        if (hazError) {
            throw new Error('I haz error');
        }
    }
}
