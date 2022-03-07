/*
 * @since 2021-08-02 10:50:14
 * @author junbao <junbao@mymoement.com>
 */

import { isJSONSerializable, JSONState, Subscribe, Unsubscribe } from 'amos-utils';
import { Action } from './action';
import { Box } from './box';
import { withCache } from './enhancers/withCache';
import { withRollback } from './enhancers/withRollback';
import { withTransaction } from './enhancers/withTransaction';
import { Dispatch, Dispatchable, isAmosObject, Select, Selectable, Snapshot } from './types';

export interface StoreOptions {
  preloadedState?: Snapshot;
  getPreloadedState?: <S>(box: Box<S>) => JSONState<S> | undefined;
}

export interface Event {
  transaction: null | Action;
  selecting: null | Selectable;
  dispatching: null | Dispatchable;
}

export interface Store {
  snapshot: () => Snapshot;
  subscribe: (fn: Subscribe) => Unsubscribe;
  broadcast: () => void;
  dispatch: Dispatch;
  select: Select;
}

export type StoreEnhancer = (
  next: (options: StoreOptions) => Store,
) => (options: StoreOptions) => Store;

const internalFlag: unique symbol = {} as any;

export function createStore(...enhancers: StoreEnhancer[]): Store;
export function createStore(options: StoreOptions, ...enhancers: StoreEnhancer[]): Store;
/** @internal */
export function createStore(internal: typeof internalFlag, options: StoreOptions): Store;
export function createStore(
  first: StoreOptions | StoreEnhancer | typeof internalFlag | undefined,
  second: StoreOptions | StoreEnhancer | undefined,
  ...enhancers: StoreEnhancer[]
): Store {
  if (first !== internalFlag) {
    let options: StoreOptions = {};
    if (typeof first === 'object') {
      options = first;
    } else if (first) {
      enhancers.unshift(first);
    }
    if (typeof second === 'function') {
      enhancers.unshift(second);
    }
    enhancers.unshift(withRollback(), withTransaction(), withCache());
    return enhancers.reduceRight(
      (previousValue, currentValue) => currentValue(previousValue),
      createStore.bind(void 0, true as any) as ReturnType<StoreEnhancer>,
    )(options);
  }

  const options = second as StoreOptions;
  const getPreloadedState =
    options.getPreloadedState ?? ((box) => options.preloadedState?.[box.key] as any);

  const snapshot: Snapshot = {};
  const listeners = new Set<Subscribe>();

  const ensureBox = (box: Box) => {
    if (snapshot.hasOwnProperty(box.key)) {
      return snapshot[box.key];
    }
    let boxState = box.initialState;
    const preloadedState = getPreloadedState(box);
    if (preloadedState !== void 0) {
      boxState = isJSONSerializable(boxState) ? boxState.fromJSON(preloadedState) : preloadedState;
    }
    return (snapshot[box.key] = boxState);
  };

  const store: Store = {
    snapshot: () => snapshot,
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    broadcast: () => {
      listeners.forEach((fn) => fn());
    },
    // only accepts Dispatchable here
    dispatch: (_task: any) => {
      const task: Dispatchable = _task;
      let r: any;
      switch (task.$amos) {
        case 'ACTION':
          r = task.factory.actor(store.dispatch, store.select, ...task.args);
          break;
        case 'MUTATION':
          r = task.mutator.apply(task.box, [ensureBox(task.box), ...task.args]);
          break;
        case 'SIGNAL':
          r = task.data;
          task.factory.listeners.forEach((value, key) => value(ensureBox(key), r));
          break;
      }
      store.broadcast();
      return r;
    },
    select: (selectable: Selectable) => {
      if (selectable instanceof Box) {
        return ensureBox(selectable);
      }
      const factory = isAmosObject(selectable, 'SELECTOR_FACTORY')
        ? selectable
        : selectable.factory;
      const args = isAmosObject(selectable, 'SELECTOR_FACTORY') ? [] : selectable.args;
      return factory.compute(store.select, ...args);
    },
  };
  return store;
}
