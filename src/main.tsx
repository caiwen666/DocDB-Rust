import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// 禁用全局右键菜单
document.addEventListener("contextmenu", (event) => {
	event.preventDefault();
});

document.addEventListener("keydown", (event) => {
	// 禁用所有 Ctrl+ 快捷键
	if (event.ctrlKey) {
		event.preventDefault();
	}
	// 禁用 f12
	if (event.key === "F12") {
		event.preventDefault();
	}
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
