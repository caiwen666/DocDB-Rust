import { useEffect, useState } from "react";
import { usePageStore } from "@/stores/page.ts";
import { commands } from "@/bindings.ts";

export default function Index() {
	const [summary, setSummary] = useState([0, 0]);
	useEffect(() => {
		const init = async () => {
			setSummary(await commands.getDatabaseSummary());
		};
		usePageStore.subscribe((page) => {
			if (page.now != 0) return;
			console.log("aaa");
			init();
		});
		init();
	}, []);
	return (
		<div className={"p-1"}>
			<div className={"bg-white rounded p-2"}>
				<div className={"text-sm font-bold"}>概览</div>
				<div className={"mt-2"}>
					<span className={"text-primary font-bold text-3xl"}>
						{summary[0]}
					</span>
					<span className={"text-sm ml-1"}>个科目，</span>
					<span className={"text-primary font-bold text-3xl"}>
						{summary[1]}
					</span>
					<span className={"text-sm ml-1"}>份试卷</span>
				</div>
			</div>
		</div>
	);
}
