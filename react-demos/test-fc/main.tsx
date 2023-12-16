import { useState } from "react";
import ReactDOM from "react-dom";

function App() {
	const [num, setNum] = useState(100);

	setNum(200);
	console.log(num);
	return <div>{num}</div>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
