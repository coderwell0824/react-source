import { getBaseRollupPlugins } from "./utils";
import { resolvePkgPath, getPackageJSON } from "./utils";
import generatePackageJson from "rollup-plugin-generate-package-json"
import alias from "@rollup/plugin-alias"


const { name, module, peerDependencies } = getPackageJSON("react-dom");

//react-dom包的路径
const pkgPath = resolvePkgPath(name);
//react-dom产物的路径
const pkgDistPath = resolvePkgPath(name, true);

//对包兼容打包, v18之前是React-dom包, v18包是React-dom/client包

export default [
  //react-dom
  {
    input: `${pkgPath}/${module}`,
    output: [
      {
        file: `${pkgDistPath}/index.js`,
        name: "index.js",
        format: "umd"
      },
      {
        file: `${pkgDistPath}/client.js`,
        name: "client.js",
        format: "umd"
      },

    ],
    external: [...Object.keys(peerDependencies)],
    plugins: [...getBaseRollupPlugins(),
    alias({
      entries: {
        hostConfig: `${pkgPath}/src/hostConfig.ts`  //替换hostConfig的打包入金
      }
    }),
    generatePackageJson({
      inputFolder: pkgPath,
      outputFolder: pkgDistPath,
      baseContents: ({ name, description, version }) => ({
        name,
        description,
        version,
        //打包peerDependencies
        peerDependencies: {
          react: version //react的version和react-dom的version保持一致
        },
        main: "index.js",
      })
    })]
  }
];
