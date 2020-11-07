/*
 * @since 2020-11-04 12:43:17
 * @author acrazing <joking.young@gmail.com>
 */

import { useContext, useReducer, useRef } from 'react';
import { __Context } from './context';
import { Selector } from './selector';
import { Dispatch, Selectable, Snapshot, Store } from './store';
import { arrayEqual } from './utils';

/**
 * use context's store
 *
 * @stable
 */
export function useStore(): Store {
  const state = useContext(__Context);
  if (!state) {
    throw new Error('[Amos] you are using hooks without <Provider />.');
  }
  return state.store;
}

export function useDispatch(): Dispatch {
  const store = useStore();
  return store.dispatch;
}

export type MapSelector<Rs extends Selectable[]> = {
  [P in keyof Rs]: Rs[P] extends Selector<infer A, infer R> ? R : never;
};

interface SelectorState {
  target: Selectable;
  args: unknown[];
  deps: unknown[];
  snapshot: Snapshot;
}

interface StoreRef {
  store: Store;
  disposer: () => void;
  updated: boolean;
}

export function useSelector<Rs extends Selectable[]>(...selectors: Rs): MapSelector<Rs> {
  const [, update] = useReducer((s) => s + 1, 0);
  const store = useStore();
  const lastSelector = useRef<SelectorState>();
  const lastStore = useRef<StoreRef>();
  const lastError = useRef<any>();
  if (lastStore.current?.store !== store) {
    lastStore.current?.disposer();
    lastStore.current = {
      store,
      updated: false,
      disposer: store.subscribe(() => {
        try {
          const newSelectedState = lastSelectors.current.map((s) => store.select(s));
          if (
            lastSelectedState.current &&
            arrayEqual(newSelectedState, lastSelectedState.current)
          ) {
            return;
          }
          lastSelectedState.current = newSelectedState;
          lastStore.current!.updated = true;
        } catch (e) {
          lastError.current = e
            ? Object.assign(e, { message: '[Amos] selector throws error: ' + e.message })
            : new Error('[Amos] selector throws falsy error: ' + e);
        }
        update();
      }),
    };
  }
  if (lastError.current) {
    const error = lastError.current;
    lastError.current = void 0;
    throw error;
  }
  if (lastStore.current.updated) {
    lastStore.current.updated = false;
    return lastSelectedState.current as any;
  }
  // TODO compare selector && its arguments is changed or not
  return (lastSelectedState.current = selectors.map((s) => store.select(s))) as any;
}
