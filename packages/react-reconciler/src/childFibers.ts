import { ReactElementType } from "shared/ReactTypes";
import { FiberNode, createFiberFromElement } from "./fiber";
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { HostText } from "./workTags";
import { Placement } from "./fiberFlags";

function reconcileSingleElement(returnFiber: FiberNode, currentFiber: FiberNode | null, element: ReactElementType): FiberNode {
  //根据element创建fiber
  const fiber = createFiberFromElement(element);
  fiber.return = returnFiber;
  return fiber
}


function reconcileSingleTextNode(returnFiber: FiberNode, currentFiber: FiberNode | null, content: string | number): FiberNode {
  const fiber = new FiberNode(HostText, { content }, null);
  fiber.return = returnFiber;
  return fiber
}

function placeSingChild(fiber: FiberNode, shouldTrackEffects: boolean): FiberNode {
  if (shouldTrackEffects && fiber.alternate == null) {
    fiber.flags |= Placement;
  }
  return fiber;
}

function childReconciler(shouldTrackEffects: boolean) {
  return function reconcileChildFibers(returnFiber: FiberNode, currentFiber: FiberNode | null, newChild: ReactElementType) {
    //判断当前fiber的类型
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          const newFiber = reconcileSingleElement(returnFiber, currentFiber, newChild);
          return placeSingChild(newFiber, shouldTrackEffects)
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
    if (__DEV__) {
      console.warn("未实现的reconcile类型", newChild);
    }
    return null;
  }
}

export const reconcileChildFibers = childReconciler(true);
export const mountChildFibers = childReconciler(false);