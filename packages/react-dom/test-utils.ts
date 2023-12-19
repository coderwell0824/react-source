import { ReactElementType } from "shared/ReactTypes";
//@ts-ignore
import { createRoot } from "react-dom";

//测试render
export function renderIntoDocuement(element: ReactElementType) {
  const div = document.createElement("div");
  return createRoot(div).render(element);
}