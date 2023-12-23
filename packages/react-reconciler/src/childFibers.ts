import { Props, ReactElementType } from "shared/ReactTypes";
import { FiberNode, createFiberFromElement, createWorkInProgress } from "./fiber";
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { HostText } from "./workTags";
import { ChildDeletion, Placement } from "./fiberFlags";


type ExistingChildren = Map<string | number, FiberNode>


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

  function deleteRemainingChildren(returnFiber: FiberNode, currentFirstChild: FiberNode | null) {
    if (!shouldTrackEffects) { //判断是否要追踪副作用
      return
    }
    let childToDelete = currentFirstChild;  //将当前第一个子节点赋值给childToDelete

    while (childToDelete != null) {
      deleteChild(returnFiber, childToDelete)
      childToDelete = childToDelete.sibling; //遍历删除兄弟节点

    }
  }

  //协调单一节点
  function reconcileSingleElement(returnFiber: FiberNode, currentFiber: FiberNode | null, element: ReactElementType): FiberNode {
    const key = element.key; //获取element元素的key


    while (currentFiber != null) {
      //update阶段
      if (currentFiber.key == key) {  //key相同
        if (element.$$typeof == REACT_ELEMENT_TYPE) {  //判断element是否为ReactElement元素
          if (element.type === currentFiber.type) { //type相同
            const existing = useFiber(currentFiber, element.props); //获取复用的节点
            existing.return = returnFiber;  //更新复用节点的父节点
            //当前节点可复用, 标记当前节点的兄弟节点删除
            deleteRemainingChildren(returnFiber, currentFiber.sibling);
            return existing;
          }
          //key相同, type不同的情况删除所有旧的节点
          deleteRemainingChildren(returnFiber, currentFiber);
          break;
        } else {
          if (__DEV__) {
            console.warn("还未实现的React类型", element)
            break;
          }
        }
      } else {
        //key不同, 需要删除旧的, 创建新的
        deleteChild(returnFiber, currentFiber);

        currentFiber = currentFiber.sibling;  //遍历兄弟节点
      }
    }
    //根据element创建fiber
    const fiber = createFiberFromElement(element);
    fiber.return = returnFiber;
    return fiber
  }


  //协调文本节点
  function reconcileSingleTextNode(returnFiber: FiberNode, currentFiber: FiberNode | null, content: string | number): FiberNode {

    if (currentFiber != null) {
      //update阶段
      if (currentFiber.tag == HostText) {  //文本类型不变, 可以复用 (key相同, type相同)
        const existing = useFiber(currentFiber, { content }); //获取复用的节点
        existing.return = returnFiber;  //更新复用节点的父节点
        deleteRemainingChildren(returnFiber, currentFiber.sibling)
        return existing;
      }
      //key不同, type不同,类型发生变化,需要删除旧节点, 创建新节点
      deleteChild(returnFiber, currentFiber)
      currentFiber = currentFiber.sibling; //遍历兄弟节点
    }

    //创建新的Fiber节点
    const fiber = new FiberNode(HostText, { content }, null);
    fiber.return = returnFiber;
    return fiber
  }

  //协调子节点数组
  function reconcileChildrenArray(returnFiber: FiberNode, currentFirstChild: FiberNode | null, newChild: any[]) {

    //最后一个可复用的fiber在current中index值
    let lastPlacemenedIndex: number = 0;
    //创建的第一个fiber
    let firstNewFiber: FiberNode | null = null;
    //创建的最后一个fiber
    let lastNewFiber: FiberNode | null = null;

    //newChild数组的元素是ReactElement元素
    //1. 将curentFiber保存在Map中
    const existingChildren: ExistingChildren = new Map();
    let current = currentFirstChild;

    if (current !== null) {
      //获取key, 判断key是否存在, 存在的话取key, 不存在的话获取currnt所在位置的index
      const keyToUse = current.key !== null ? current.key : current.index;
      existingChildren.set(keyToUse, current) //存储key和current
      current = current.sibling;
    }

    for (let i = 0; i < newChild.length; i++) {
      //2. 遍历newChild, 寻找是否可复用
      const afterElement = newChild[i];
      const newFiber = updateFromMap(returnFiber, existingChildren, i, afterElement)
      //当返回的值为布尔值或者是null值
      if (newFiber == null) {
        continue;  //继续遍历
      }
      //3. 标记移动还是插入
      newFiber.index = i;
      newFiber.return = returnFiber;

      //lastNewFiber始终指向最后一个Fiber, firstNewFiber指向第一个Fiber
      if (lastNewFiber == null) {
        lastNewFiber = newFiber;
        firstNewFiber = newFiber;
      } else {
        lastNewFiber.sibling = newFiber;
        lastNewFiber = lastNewFiber.sibling;
      }

      //是否追踪副作用
      if (!shouldTrackEffects) {
        continue;
      }

      //获取当前节点的currentFiber
      const current = newFiber.alternate;

      if (current != null) {  //update阶段
        const oldIndex = current.index;  //获取当前页面上元素的index
        if (oldIndex < lastPlacemenedIndex) {  //标记Placement  移动操作
          newFiber.flags |= Placement;
          continue;
        } else {
          lastPlacemenedIndex = oldIndex;
        }
      } else {  //mount阶段
        newFiber.flags |= Placement;
      }
    }

    //4. 将Map中剩下的标记为删除

    existingChildren.forEach((fiber) => {
      deleteChild(returnFiber, fiber)
    })

    return firstNewFiber;


  }

  function updateFromMap(returnFiber: FiberNode, existingChildren: ExistingChildren, index: number, element: any): FiberNode | null {

    const keyToUse = element.key !== null ? element.key : element.index;
    const beforeElement = existingChildren.get(keyToUse);


    //HostText类型
    if (typeof element === "string" || typeof element === "number") {
      if (beforeElement) {
        if (beforeElement.tag == HostText) {  //当前节点可以复用
          existingChildren.delete(keyToUse);
          return useFiber(beforeElement, { content: `${element}` });
        }
      }

      //创建新的HostText类型的节点
      return new FiberNode(HostText, { content: `${element}` }, null)
    }

    //ReactElement类型
    if (typeof element === "object" && element !== null) {
      switch (element.$$typeof) {
        case REACT_ELEMENT_TYPE:
          if (beforeElement) {
            if (beforeElement.type == element.type) {
              existingChildren.delete(keyToUse);
              return useFiber(beforeElement, element.props)
            }
          }
          return createFiberFromElement(element);
      }

      //TODO ReactElement是数组类型
      if (Array.isArray(element) && __DEV__) {
        console.warn("还未实现数组类型的child")
      }
    }
    return null
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

    //多节点diff
    if (Array.isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, currentFiber, newChild)
    }


    //HostText类型
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