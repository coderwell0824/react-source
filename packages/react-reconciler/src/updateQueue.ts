import { Action } from "shared/ReactTypes"
import { Update } from "./fiberFlags"
import { Dispatch } from "react/src/curentDispatcher"
import { Lane } from "./fiberLanes"

//批更新时使用链表的结构存储需要更新的Update
export interface Update<State> {
  action: Action<State>
  next: Update<any> | null
  lane: Lane
}

export interface UpdateQueue<State> {
  shared: {
    pending: Update<State> | null
  },
  dispatch: Dispatch<State> | null
}

export const createUpdate = <State>(action: Action<State>, lane: Lane): Update<State> => {
  return {
    action,
    next: null,
    lane
  }
}

//创建Update队列
export const createUpdateQueue = <State>() => {
  return {
    shared: {
      pending: null
    }, dispatch: null
  } as UpdateQueue<State>
}

//将产生的Update结构进入Update队列中
export const enqueueUpdate = <State>(updateQueue: UpdateQueue<State>, update: Update<State>) => {

  const pending = updateQueue.shared.pending;

  if (pending === null) { //当前update队列中没有要更新的
    //pending = a->a
    update.next = update;
  } else {
    //b.next=a.next
    update.next = pending.next;
    //a.next=b
    pending.next = update;
  }

  //如果只有一个更新的话, 就会形成a->a的环状链表
  //如果有多个更新的话, 就会形成b->a->b的环状链表, pending始终指向最后插入的那个Update , 三个的话是c->a->b->c
  updateQueue.shared.pending = update;
}

//消费
export const processUpdateQueue = <State>(baseState: State, pendingUpdate: Update<State> | null, renderLane: Lane): { memoizedState: State } => {

  const result: ReturnType<typeof processUpdateQueue<State>> = { memoizedState: baseState };

  if (pendingUpdate !== null) {

    const first = pendingUpdate.next; //获取第一个update
    let pending = pendingUpdate.next as Update<any>;

    do {
      const updateLane = pending.lane;
      if (updateLane === renderLane) {
        const action = pending.action;
        if (action instanceof Function) {
          // result.memoizedState = action(baseState)
          baseState = action(baseState)
        } else {
          baseState = action
          // result.memoizedState = action
        }
      } else {
        if (__DEV__) {
          console.error("不应该进入")
        }
      }
      pending = pending.next as Update<any>
    } while (pending != first)
  }

  result.memoizedState = baseState;
  return result
}