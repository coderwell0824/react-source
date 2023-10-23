@typescript-eslint/eslint-plugin ts-eslint插件

---

第二节:

React项目结构
React(宿主环境无关的公用方法)
React-reconciler(协调器的实现, 宿主环境无关)
各种宿主环境的包
shared(公用辅助方法, 宿主环境无关)

jsx转换
包括两部分:
编译时: 由babel处理
运行时: jsx方法或React.createElement方法的实现(包括dev, prod两个环境)

编译时由babel编译实现, 我们来实现运行时, 主要工作包括:

1. 实现jsx方法
2. 实现打包流程
3. 实现调试打包结果的环境
   实现jsx方法
   包括:
   jsxDEV方法(dev环境)
   jsx方法(prod环境)
   React.createElement方法(class组件)

实现打包流程
对应上述3个方法, 打包对应文件:
react/jsx-dev-runtime.js(dev环境)
react/jsx-runtime.js(prod环境)
React

调试打包结果: --使用pnpm link

这种方式的优点: 可以模拟实际项目引用React的情况
缺点: 对于我们当前开发项目来说, 略显繁琐, 对于开发过程中, 更期望的是热更新效果

pnpm link react --global

---
