// ReactDOM.createRoot(root).render(<App/>)
import { createContainer, updateContainer } from "react-reconciler/src/fiberReconciler";
import { Container } from "./hostConfig";
import { ReactElementType } from "shared/ReactTypes"

//
export function createRoot(container: Container) {

  const root = createContainer(container);  //生成ReactRootFiber
  return {
    render(element: ReactElementType) {
      updateContainer(element, root)
    }
  }
}


