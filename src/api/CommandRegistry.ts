/**
 * @module @flowscripter/cli-framework-api
 */

import Command from './Command';
import GroupCommand from './GroupCommand';
import SubCommand from './SubCommand';
import GlobalCommand from './GlobalCommand';
import GlobalModifierCommand from './GlobalModifierCommand';

/**
 * Interface used by a [[CLI]] to register [[Command]] implementations.
 */
export default interface CommandRegistry {

    /**
     * Return all [[Command]] instances registered.
     *
     * @return iterable of [[Command]] instances
     */
    getCommands(): Iterable<Command>;

    /**
     * Return all [[GroupCommand]] instances registered.
     *
     * @return iterable of [[Command]] instances
     */
    getGroupCommands(): Iterable<GroupCommand>;

    /**
     * Return all [[SubCommand]] instances registered.
     *
     * @return iterable of [[SubCommand]] instances
     */
    getSubCommands(): Iterable<SubCommand>;

    /**
     * Return all [[GlobalCommand]] instances registered.
     *
     * @return iterable of [[GlobalCommand]] instances
     */
    getGlobalCommands(): Iterable<GlobalCommand>;

    /**
     * Return all [[GlobalModifierCommand]] instances registered.
     *
     * @return iterable of [[GlobalModifierCommand]] instances
     */
    getGlobalModifierCommands(): Iterable<GlobalModifierCommand>;

    /**
     * Get a registered [[SubCommand]] by name.
     */
    getSubCommandByName(name: string): SubCommand | undefined;

    /**
     * Get a registered [[GroupCommand]] by name.
     */
    getGroupCommandByName(name: string): GroupCommand | undefined;

    /**
     * Get a registered [[GlobalCommand]] or [[GlobalModifierCommand]] by name.
     */
    getGlobalOrGlobalModifierCommandByName(name: string): GlobalCommand | GlobalModifierCommand | undefined;

    /**
     * Get a registered [[GlobalCommand]] or [[GlobalModifierCommand]] by short alias.
     */
    getGlobalOrGlobalModifierCommandByShortAlias(name: string): GlobalCommand | GlobalModifierCommand | undefined;

    /**
     * Add the specified [[Command]] to the registry.
     *
     * @param command the [[Command]] to register.
     */
    addCommand(command: Command): void;
}
