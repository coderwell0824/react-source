import { beginWork } from "./beginWork";
import { completeWork } from "./completeWork";
import { FiberNode } from "./fiber";

let workInProgress: FiberNode | null = null;

function prepareFreshStack(node: FiberNode) {
	workInProgress = node;
}

function renderRoot(root: FiberNode) {
	//初始化
	prepareFreshStack(root);

	do {
		try {
			workInProgress();
			break;
		} catch (e) {
			console.error(e, "workLoop 发生错误");
			workInProgress = null;
		}
	} while (true);
}

function workLoop() {
	while (workInProgress != null) {
		performUnitOfWork(workInProgress);
	}
}

function performUnitOfWork(fiber: FiberNode) {
	const next = beginWork(fiber);
	fiber.memoizedProps = fiber.pendingProps;

	if (next === null) {
		completeUnitOfWork(fiber);
	} else {
		workInProgress = next;
	}
}

function completeUnitOfWork(fiber: FiberNode) {
	let node: FiberNode | null = fiber;

	do {
		completeWork(node);

		const siblings = fiber.sibling;
		if (siblings !== null) {
			workInProgress = siblings;
			return;
		}
		node = node.return;
		workInProgress = node;
	} while (node !== null);
}
