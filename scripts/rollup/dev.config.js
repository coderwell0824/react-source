import reactDomConfig from "./react-dom.config";
import reactConfig from "./react.config";

//合并打包
export default () => {
  return [...reactConfig, ...reactDomConfig]
}