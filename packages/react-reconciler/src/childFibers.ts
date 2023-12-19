import { Props, ReactElementType } from "shared/ReactTypes";
import { FiberNode, createFiberFromElement, createWorkInProgress } from "./fiber";
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { HostText } from "./workTags";
import { ChildDeletion, Placement } from "./fiberFlags";


function placeSingChild(fiber: FiberNode, shouldTrackEffects: boolean): FiberNode {
  if (shouldTrackEffects && fiber.alternate == null) {
    fiber.flags |= Placement;
  }
  return fiber;
}

function childReconciler(shouldTrackEffects: boolean) {

  //删除子节点
  function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
    if (!shouldTrackEffects) {  //判断是否要追踪副作用
      return;
    }

    const deletions = returnFiber.deletions;  //获取父节点下的deletions
    if (deletions == null) { //当前父节点下还没有要被删除的节点
      returnFiber.deletions = [childToDelete] //标记第一个要被删除的子节点
      returnFiber.flags |= ChildDeletion  //当前节点的父节点需要增加一个flag
    } else {
      deletions.push(childToDelete); //追加需要被删除的子节点
    }
  }

  function reconcileSingleElement(returnFiber: FiberNode, currentFiber: FiberNode | null, element: ReactElementType): FiberNode {
    const key = element.key; //获取element元素的key

    work: if (currentFiber != null) {
      //update阶段
      if (currentFiber.key == key) {  //key相同
        if (element.$$typeof == REACT_ELEMENT_TYPE) {  //判断element是否为ReactElement元素
          if (element.type === currentFiber.type) { //type相同
            const existing = useFiber(currentFiber, element.props); //获取复用的节点
            existing.return = returnFiber;  //更新复用节点的父节点
            return existing;
          }
          //删除旧的
          deleteChild(returnFiber, currentFiber)
          break work;
        } else {
          if (__DEV__) {
            console.warn("还未实现的React类型", element)
            break work;
          }
        }
      } else {
        //需要删除旧的, 创建新的
        deleteChild(returnFiber, currentFiber)
      }
    }
    //根据element创建fiber
    const fiber = createFiberFromElement(element);
    fiber.return = returnFiber;
    return fiber
  }


  function reconcileSingleTextNode(returnFiber: FiberNode, currentFiber: FiberNode | null, content: string | number): FiberNode {

    if (currentFiber != null) {
      //update阶段
      if (currentFiber.tag == HostText) {  //文本类型不变, 可以复用
        const existing = useFiber(currentFiber, { content }); //获取复用的节点
        existing.return = returnFiber;  //更新复用节点的父节点
        return existing;
      }
      //类型发生变化,需要删除旧节点, 创建新节点
      deleteChild(returnFiber, currentFiber)
    }

    const fiber = new FiberNode(HostText, { content }, null);
    fiber.return = returnFiber;
    return fiber
  }

  return function reconcileChildFibers(returnFiber: FiberNode, currentFiber: FiberNode | null, newChild: ReactElementType) {
    //判断当前fiber的类型
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          const newFiber = reconcileSingleElement(returnFiber, currentFiber, newChild);
          return placeSingChild(newFiber!, shouldTrackEffects)
        default:
          if (__DEV__) {
            console.warn("未实现的reconcile类型", newChild);
          }
          break;
      }
    }
    //HostText
    if (typeof newChild === "string" || typeof newChild == "number") {
      const newFiber = reconcileSingleTextNode(returnFiber, currentFiber, newChild);
      return placeSingChild(newFiber, shouldTrackEffects)
    }

    if (currentFiber != null) {
      //兜底删除
      deleteChild(returnFiber, currentFiber)
    }

    if (__DEV__) {
      console.warn("未实现的reconcile类型", newChild);
    }
    return null;
  }
}

//复用fiber节点
function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
  const clone = createWorkInProgress(fiber, pendingProps); //克隆fiber
  clone.index = 0;
  clone.sibling = null;
  return clone;
}



export const reconcileChildFibers = childReconciler(true);
export const mountChildFibers = childReconciler(false);