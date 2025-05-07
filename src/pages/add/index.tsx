import {
	Button,
	CircularProgress,
	DialogContent,
	DialogContentText,
} from "@mui/material";
import { commands } from "@/bindings";
import { useEffect, useRef, useState } from "react";
import FileOpenOutlinedIcon from "@mui/icons-material/FileOpenOutlined";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { useDialogStore } from "@/stores/dialog.ts";
import DialogErrorTemplate from "@/components/dialog/DialogErrorTemplate";
import Item from "./item";
import { listen, TauriEvent, UnlistenFn, Event } from "@tauri-apps/api/event";
import { usePageStore } from "@/stores/page.ts";
import {
	DocumentFromFile,
	DropEvent,
	parseToDocument,
} from "@/pages/add/index.config.ts";
import { unwrap } from "@/utils/result.ts";
import { clone } from "@/utils";
import _ from "lodash";
import DocumentItem from "@/components/DocumentItem";
import DialogBarProgressTemplate from "@/components/dialog/DialogBarProgressTemplate";
import { openDocument } from "@/utils/document";

const Index = () => {
	const pushDialog = useDialogStore((state) => state.push);
	const pushWaitingDialog = useDialogStore((state) => state.pushWaitingDialog);
	const closeWaitingDialog = useDialogStore(
		(state) => state.closeWaitingDialog,
	);
	const [loading, setLoading] = useState(false);
	const selfRef = useRef<HTMLDivElement>(null);
	const [documents, setDocuments] = useState<DocumentFromFile[]>([]);
	const documentsRef = useRef<DocumentFromFile[]>([]);
	// 用于判断表单是否通过了验证，key为表单对应文件的md5
	const isValidRef = useRef<{ [key: string]: boolean | undefined }>({});
	// tauri 拖入之后会触发两次事件，为了规避，我们做个特判
	const lastDropRef = useRef("");
	const handleDrop = async (all_paths: string[]) => {
		if (all_paths.join(",") === lastDropRef.current) return;
		lastDropRef.current = all_paths.join(",");
		const paths = all_paths.filter((v) => v.endsWith(".pdf"));
		if (paths.length === 0) return;
		setLoading(true);
		try {
			const res = unwrap(await commands.parsePdf(paths));
			for (const item of res) {
				const pre = documentsRef.current.find((v) => v.doc.md5 === item.md5);
				if (pre) {
					continue;
				}
				documentsRef.current.push(parseToDocument(item));
			}
			setDocuments(documentsRef.current);
		} catch (e) {
			pushDialog({
				title: "错误",
				content: (
					<DialogContent>
						<DialogErrorTemplate info={"添加试卷时错误"} error={e} />
					</DialogContent>
				),
			});
		}
		setLoading(false);
	};
	useEffect(() => {
		let unlisten: UnlistenFn | null = null;
		const init = async () => {
			unlisten = await listen<DropEvent>(
				TauriEvent.DRAG_DROP,
				(e: Event<DropEvent>) => handleDrop(e.payload.paths),
			);
		};
		usePageStore.subscribe((state) => {
			if (state.now === 3) {
				init();
			} else {
				if (unlisten) unlisten();
			}
		});
	}, []);
	const pushDocument = async () => {
		setLoading(true);
		const readyDocuments: DocumentFromFile[] = [];
		const remainDocuments: DocumentFromFile[] = [];
		// 这里需要克隆一下，防止表单组件莫名其妙刷新，使得我们的对象发生修改，nodejs的引用传递真的很恶心
		const list = clone(documentsRef.current);
		for (const item of list) {
			if (!isValidRef.current[item.doc.md5]) {
				remainDocuments.push(item);
				continue;
			}
			// 探测是否可能重复
			const searchList = await commands.searchDocument(item.doc.info.name);
			let flag = true; // 是否保留
			for (const doc of searchList) {
				// 两者都有年份且年份不同，则不会重复
				if (
					doc.info.date &&
					item.doc.info.date &&
					doc.info.date.year !== item.doc.info.date.year
				)
					continue;
				// 试卷类型不同不会重复
				if (doc.info.type !== item.doc.info.type) continue;
				// 两者都有课程编号且不同不会重复
				if (
					doc.info.identifier &&
					item.doc.info.identifier &&
					doc.info.identifier !== item.doc.info.identifier
				)
					continue;
				// 两者的筛选标签不重叠，不会重复
				if (_.intersection(doc.info.filter, item.doc.info.filter).length === 0)
					continue;
				const op = await new Promise((resolve) => {
					pushDialog({
						title: "可能的重复",
						content: (
							<DialogContent>
								<DialogContentText>
									如下的试卷可能已经存在于数据库中，是否继续添加？
								</DialogContentText>
								<div className={"mt-2"}>要添加的试卷：</div>
								<DocumentItem
									doc={item.doc}
									onDoubleClick={() => openDocument(item.doc.md5)}
									className={"bg-card"}
								></DocumentItem>
								<div className={"mt-2"}>已经存在的试卷：</div>
								<DocumentItem
									doc={doc}
									className={"bg-card"}
									onDoubleClick={() => openDocument(doc.md5)}
								/>
							</DialogContent>
						),
						buttons: ["取消", "取消但保留", "不再询问", "继续"],
						callback: resolve,
					});
				});
				if (op === "取消") {
					flag = false;
					break;
				}
				if (op === "取消但保留") {
					flag = false;
					remainDocuments.push(item);
					break;
				}
				if (op === "不再询问") {
					break;
				}
			}
			if (flag) {
				readyDocuments.push(item);
			}
		}
		pushWaitingDialog({
			title: "添加试卷",
			content: (
				<DialogContent>
					<DialogBarProgressTemplate
						info={"正在添加试卷..."}
					></DialogBarProgressTemplate>
				</DialogContent>
			),
		});
		let ok = 0;
		await commands.setProgress([ok, readyDocuments.length]);
		let reject = false; // 后续的文件推送是否被取消
		for (const item of readyDocuments) {
			if (reject) {
				remainDocuments.push(item);
				continue;
			}
			try {
				unwrap(await commands.addDocument(item.doc));
				ok += 1;
				await commands.setProgress([ok, readyDocuments.length]);
			} catch (e) {
				closeWaitingDialog();
				remainDocuments.push(item);
				reject = true;
				pushDialog({
					title: "错误",
					content: (
						<DialogContent>
							<DialogErrorTemplate info={"添加试卷失败"} error={e} />
							<DocumentItem doc={item.doc} />
						</DialogContent>
					),
				});
			}
		}
		if (!reject) {
			closeWaitingDialog();
			pushDialog({
				title: "成功",
				content: (
					<DialogContent>
						<DialogContentText>
							已经把所有的试卷成功添加到数据库中。
						</DialogContentText>
					</DialogContent>
				),
			});
		}
		setDocuments(remainDocuments);
		documentsRef.current = remainDocuments;
		await commands.updateDatabase();
		setLoading(false);
	};
	return (
		<div className={"min-h-full"} ref={selfRef}>
			<div className={"flex items-center"}>
				<div className={"text-title text-lg select-none ml-2"}>添加试卷</div>
				{loading && <CircularProgress size="16px" className={"ml-2"} />}
				<Button
					className={"ml-auto mr-1"}
					startIcon={<FileUploadOutlinedIcon />}
					disabled={documents.length === 0 || loading}
					onClick={pushDocument}
				>
					添加
				</Button>
			</div>
			{documents.length === 0 && (
				<div className={"text-8xl text-title mt-16 text-center"}>
					<FileOpenOutlinedIcon fontSize={"inherit"} />
					<div className={"text-sm text-center mt-2 select-none"}>
						将文件拖入以添加
					</div>
				</div>
			)}
			{documents.map((item, index) => (
				<Item
					file={item.name}
					form={item.doc.info}
					onChange={(form) => {
						documentsRef.current[index].doc.info = form;
						setDocuments([...documentsRef.current]);
					}}
					key={item.doc.md5}
					onValid={(v) => {
						isValidRef.current[item.doc.md5] = v;
					}}
					onDelete={() => {
						isValidRef.current[documentsRef.current[index].doc.md5] = undefined;
						documentsRef.current.splice(index, 1);
						setDocuments([...documentsRef.current]);
					}}
				/>
			))}
		</div>
	);
};

export default Index;
