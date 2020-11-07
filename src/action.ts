/*
 * @since 2020-11-03 13:23:14
 * @author acrazing <joking.young@gmail.com>
 */

import { Dispatch, Select } from './store';

/**
 * An `Action` is a dispatchable function. It could do anything synchronously or
 * asynchronously, such as fetch some data from server, or dispatch some
 * dispatchable things. You can create a `Action` by writing the action function
 * directly, or calling the `ActionFactory` which is created by `action()`
 * method.
 *
 * The result of dispatch an `Action` is the return value of the `Action`.
 *
 * @stable
 */
export interface Action<R> {
  type?: string;
  (dispatch: Dispatch, select: Select): R;
}

/**
 * An `ActionFactory` is a function to create an action, which is created by
 * calling `action()` method.
 *
 * @stable
 */
export interface ActionFactory<A extends any[], R> {
  (...args: A): Action<R>;
}

/**
 * `action` is the recommended way to create an `ActionFactory` to create
 * actions which depends on some dynamic parameters. For example, fetch the
 * specified user's profile with `id`.
 *
 * @param actor The function to be called with internal parameters and dynamicly
 *              injected parameters by calling the `ActionFactory`.
 * @param type An optional string to identify the type of the created action.
 *
 * @stable
 */
export function action<A extends any[], R>(
  actor: (dispatch: Dispatch, select: Select, ...args: A) => R,
  type?: string,
) {
  return (...args: A) => {
    const action: Action<R> = (dispatch, select) => actor(dispatch, select, ...args);
    action.type = type;
    return action;
  };
}
