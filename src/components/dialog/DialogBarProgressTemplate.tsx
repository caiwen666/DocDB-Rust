import DialogProgressTemplate from "./DialogCircleProgressTemplate";
import { useEffect, useState } from "react";
import { events } from "@/bindings.ts";
import { UnlistenFn } from "@tauri-apps/api/event";

export default function DialogBarProgressTemplate({ info }: { info: string }) {
	const [ok, setOk] = useState(-1);
	const [total, setTotal] = useState(-1);
	useEffect(() => {
		let unlisten: UnlistenFn | undefined;
		let done = false;
		const init = async () => {
			unlisten = await events.progressEvent.listen((e) => {
				setOk(e.payload[0]);
				setTotal(e.payload[1]);
			});
			if (done && unlisten) {
				unlisten();
			}
		};
		init();
		return () => {
			// 有时候事件监听还没注册好，主进程就处理结束了
			done = true;
			if (unlisten) {
				unlisten();
			}
		};
	}, []);
	return (
		<DialogProgressTemplate info={info} variant={"bar"} ok={ok} total={total} />
	);
}
