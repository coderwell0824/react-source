import { Container } from "hostConfig"
import { FiberNode, FiberRootNode } from "./fiber"
import { HostRoot } from "./workTags"
import { UpdateQueue, createUpdate, createUpdateQueue, enqueueUpdate } from "./updateQueue";
import { ReactElementType } from "shared/ReactTypes";
import { scheduleUpdateFiber } from "./workLoop";
import { requestUpdateLane } from "./fiberLanes";

//不依赖数组环境
export function createContainer(container: Container) {

  const hostRootFiber = new FiberNode(HostRoot, {}, null);
  const root = new FiberRootNode(container, hostRootFiber);

  hostRootFiber.updateQueue = createUpdateQueue()
  return root;
}

export function updateContainer(element: ReactElementType | null, root: FiberRootNode) {

  console.log(element, root, "dddd")
  const hostRootFiber = root.current;
  const lane = requestUpdateLane()  //创建lane优先级
  const update = createUpdate<ReactElementType | null>(element, lane);  //创建Update结构

  enqueueUpdate(hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>, update)

  scheduleUpdateFiber(hostRootFiber, lane)
  return element;
}