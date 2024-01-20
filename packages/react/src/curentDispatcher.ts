//dispatcher就是当前使用hooks的集合

import { Action } from "shared/ReactTypes";

//定义Dispatch
export type Dispatch<State> = (action: Action<State>) => void

//定义Dispatcher
export interface Dispatcher {
  useState: <T>(initialState: (() => T) | T) => [T, Dispatch<T>];
  useEffect: (callback: () => void | void, deps: any[] | void) => void;
}

//共享的hooks集合
const currentDispatcher: { current: Dispatcher | null } = {
  current: null
}

//resolveDispatcher  解析Dispatcher
export const resolveDispatcher = (): Dispatcher => {
  const dispatcher = currentDispatcher.current;

  //如果hooks不在函数组件中执行, dispatcher是没有被赋值的
  if (dispatcher == null) {
    throw new Error("hook只能在函数组件中执行")
  }

  return dispatcher
}


export default currentDispatcher



