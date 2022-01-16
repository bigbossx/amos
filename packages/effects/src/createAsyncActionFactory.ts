/*
 * @since 2022-01-11 18:29:06
 * @author junbao <junbao@moego.pet>
 */

import { action, Mutation, Select } from 'amos-core';

export interface AsyncActionOptions<A extends any[], R> {
  mutations: (select: Select, result: R, ...args: A) => Mutation | Mutation[];
  optimistic?: boolean;
}

export function createAsyncActionFactory<
  A extends any[],
  R,
  TOptions extends AsyncActionOptions<A, R>,
>(transformer: (options: TOptions, ...args: A) => Promise<R>) {
  return (options: TOptions) => {
    return action(async (dispatch, select, ...args: A) => {
      if (options.optimistic) {
        // TODO: implement optimistic actions
      }
      const r = await transformer(options, ...args);
      dispatch(options.mutations(select, r, ...args) as Mutation[]);
      return r;
    });
  };
}
