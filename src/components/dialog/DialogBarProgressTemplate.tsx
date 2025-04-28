import DialogProgressTemplate from "./DialogCircleProgressTemplate";
import { useEffect, useState } from "react";
import { events } from "../../bindings.ts";

export default function DialogBarProgressTemplate({ info }: { info: string }) {
	const [ok, setOk] = useState(-1);
	const [total, setTotal] = useState(-1);
	useEffect(() => {
		events.progressEvent.listen((e) => {
			setOk(e.payload[0]);
			setTotal(e.payload[1]);
		});
	}, []);
	return (
		<DialogProgressTemplate info={info} variant={"bar"} ok={ok} total={total} />
	);
}
