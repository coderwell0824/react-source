import { Container } from "hostConfig";
import { Props } from "shared/ReactTypes";

export const elementPropsKey = "__props";

//有效的事件类型
const validEventTypeList = ["click"];

export interface DOMElement extends Element {
  [elementPropsKey]: Props;
}

interface SyntheticEvent extends Event {
  __stopPropagation: boolean;  //是否阻止事件冒泡
}

type EventCallback = (e: Event) => void;


interface Paths {
  capture: EventCallback[];
  bubble: EventCallback[];
}


//更新fiber上的props
export function updateFiberProps(node: DOMElement, props: Props) {
  node[elementPropsKey] = props
}

//初始化事件系统
export function initEvent(container: Container, eventType: string) {

  //判断是否为React事件系统支持的事件类型
  if (!validEventTypeList.includes(eventType)) {
    console.warn("Invalid event type")
    return
  }

  if (__DEV__) {
    console.log("初始化事件")
  }

  container.addEventListener(eventType, e => {
    dispatchEvent(container, eventType, e);
  })
}

//触发事件
function dispatchEvent(container: Container, eventType: string, e: Event) {
  //1. 收集当前元素到根节点的沿途事件
  const targetElement = e.target;  //获取事件的目标元素
  if (targetElement == null) {
    console.warn("事件不存在target", e)
  }
  const { bubble, capture } = collectPaths(targetElement as DOMElement, container, eventType);
  //2.构造合成事件, 并将所有事件分成bubble和capture两大类
  const syntheticEvent = createSyntheticEvent(e);
  //3.遍历capture事件数组
  triggerEventFlow(capture, syntheticEvent);

  //判断是否阻止冒泡
  if (!syntheticEvent.__stopPropagation) {
    //4.遍历bubble事件数组
    triggerEventFlow(bubble, syntheticEvent);
  }
}

//收集事件
function collectPaths(targetElement: DOMElement, container: Container, eventType: string) {
  const paths: Paths = {
    capture: [],
    bubble: []
  }

  while (targetElement && targetElement != container) {  //开始收集
    const elementProps = targetElement[elementPropsKey];
    if (elementProps) {
      const callbackNameList = getEventCallbackNameFromEventType(eventType); //对应事件名的数组
      if (callbackNameList) {
        //遍历事件名数组
        callbackNameList.forEach((callbackName, index) => {
          const eventCallback = elementProps[callbackName];
          if (eventCallback) {
            if (index == 0) { //捕获事件
              paths.capture.unshift(eventCallback); //反向插入 因为捕获是从上往下执行, 冒泡是从下往上执行
            } else {  //冒泡事件
              paths.bubble.push(eventCallback)
            }
          }
        })
      }
    }
    targetElement = targetElement.parentNode as DOMElement
  }

  return paths;
}

//创建合成事件
function createSyntheticEvent(e: Event) {
  const syntheticEvent = e as SyntheticEvent;
  syntheticEvent.__stopPropagation = false;
  const originStopPropagation = e.stopPropagation;  //获取原生的stopPropagation事件
  //
  syntheticEvent.stopPropagation = () => {
    syntheticEvent.__stopPropagation = true;
    if (originStopPropagation) {
      originStopPropagation()
    }
  }
  return syntheticEvent
}

//触发事件流
function triggerEventFlow(paths: EventCallback[], syntheticEvent: SyntheticEvent) {
  for (let i = 0; i < paths.length; i++) {
    const callback = paths[i];
    callback.call(null, syntheticEvent)

    if (syntheticEvent.__stopPropagation) {
      break
    }
  }
}


//从事件名中获取事件回调名 click -> OnClick OnClickCapture  
function getEventCallbackNameFromEventType(eventType: string): string[] | undefined {
  return {
    click: ["OnClickCapture", "OnClick"]  //先捕获后冒泡
  }[eventType]
}




