/*
 * @since 2021-01-19 23:33:19
 * @author acrazing <joking.young@gmail.com>
 */

import { FunctionSelector, selector } from 'amos';
import { countBox, userBox } from './box';

export const selectCount: FunctionSelector<number> = (select) => select(countBox);
export const selectDoubleCount = selector((select) => select(countBox) * 2);
export const selectMultipleCount = selector((select, times: number) => select(countBox) * times);

export const selectCurrentUser = selector((select) => select(userBox), { type: 'CURRENT_USER' });

export const selectFullName = selector((select) => select(selectCurrentUser).fullName());
