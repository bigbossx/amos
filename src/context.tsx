/*
 * @since 2020-11-03 13:42:04
 * @author acrazing <joking.young@gmail.com>
 */

import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { Store } from './store';

/** @internal */
export interface ContextState {
  store: Store;
}

/** @internal */
export const __Context = createContext<ContextState | null>(null);

/**
 * Provider props
 *
 * @stable
 */
export interface ProviderProps {
  store: Store;
  children: ReactNode;
}

/**
 * A component to inject amos context
 *
 * @stable
 */
export const Provider = ({ store, children }: ProviderProps) => {
  const [state, setState] = useState<ContextState>({ store });
  useEffect(() => {
    state.store !== state.store && setState({ store });
  }, [store]);
  return <__Context.Provider value={state}>{children}</__Context.Provider>;
};

/**
 * Consumer props
 *
 * @stable
 */
export interface ConsumerProps {
  children: (store: Store) => ReactNode;
}

/**
 * A component to subscribe the amos context
 *
 * @stable
 */
export const Consumer = ({ children }: ConsumerProps) => {
  return (
    <__Context.Consumer>
      {(value) => {
        if (!value) {
          throw new Error('[Amos] <Consumer /> should use inside <Provider />.');
        }
        return children(value.store);
      }}
    </__Context.Consumer>
  );
};
