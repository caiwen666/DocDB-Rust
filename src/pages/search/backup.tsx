// const ItemList = ({
// 	className,
// 	list,
// 	onRefresh,
// }: {
// 	className: string;
// 	list: Document[];
// 	onRefresh: () => void;
// }) => {
// 	const pushDialog = useDialogStore((state) => state.push);
// 	const pushWaitingDialog = useDialogStore((state) => state.pushWaitingDialog);
// 	const closeWaitingDialog = useDialogStore(
// 		(state) => state.closeWaitingDialog,
// 	);
// 	const selectedStore = useSelectedStore();
// 	const selfRef = useRef<HTMLDivElement>(null);
// 	const itemRefs = useRef<HTMLDivElement[]>([]);
// 	// 闭包中可能无法获得prompt的最新状态，这里要搞一下
// 	const listRef = useRef<Document[]>([]);
// 	useEffect(() => {
// 		listRef.current = list;
// 	}, [list]);
// 	const handleMenuCallback: ExportedCallback["onMenuCallback"] = (
// 		target,
// 		operation,
// 	) => {
// 		//console.log("onMenuCallback", target, operation);
// 		const handle = async () => {
// 			if (operation === "编辑" || operation === "删除") {
// 				const databaseStore = useDatabaseStore.getState();
// 				if (databaseStore.now !== databaseStore.latest) {
// 					pushDialog({
// 						title: "错误",
// 						content: (
// 							<DialogContent>
// 								<DialogContentText>
// 									本地数据库不是最新版本，请先同步数据库。
// 								</DialogContentText>
// 							</DialogContent>
// 						),
// 					});
// 					return;
// 				}
// 			}
// 			if (operation === "编辑") {
// 				let form = target[0].info;
// 				let isValidate = false;
// 				const op = await new Promise((resolve) => {
// 					const callback = (btn: string) => {
// 						if (btn === "确定") {
// 							if (isValidate) {
// 								resolve("确定");
// 							} else {
// 								return false;
// 							}
// 						} else {
// 							resolve("取消");
// 						}
// 					};
// 					pushDialog({
// 						title: "编辑试卷信息",
// 						content: (
// 							<DialogContent>
// 								<DocumentForm
// 									form={form}
// 									onChange={(v) => (form = v)}
// 									onValid={(v) => (isValidate = v)}
// 								/>
// 							</DialogContent>
// 						),
// 						buttons: ["取消", "确定"],
// 						callback,
// 					});
// 				});
// 				if (op === "确定") {
// 					// 最好先克隆一下防止更新
// 					const formClone = clone(form);
// 					if (formClone.date && formClone.date.year === -1)
// 						formClone.date = undefined;
// 					(
// 						await invoke("updateDocument", target[0].id, formClone)
// 					).unwrap_or_else((e) => {
// 						pushDialog({
// 							title: "错误",
// 							content: (
// 								<DialogContent>
// 									<DialogErrorTemplate
// 										info={"更新试卷信息时发生错误"}
// 										error={e}
// 									/>
// 								</DialogContent>
// 							),
// 						});
// 					});
// 					onRefresh();
// 				}
// 			}
// 			if (operation === "删除") {
// 				const op = await new Promise((resolve) => {
// 					pushDialog({
// 						title: "删除试卷",
// 						content: (
// 							<DialogContent>
// 								<DialogContentText>
// 									确定要删除这
// 									<span className={"font-bold"}>{target.length}</span>
// 									份试卷吗？该操作不可逆。
// 								</DialogContentText>
// 							</DialogContent>
// 						),
// 						buttons: ["取消", "确定"],
// 						callback: resolve,
// 					});
// 				});
// 				if (op === "确定") {
// 					pushWaitingDialog({
// 						title: "删除中",
// 						content: (
// 							<DialogContent>
// 								<DialogProgressTemplate info={"正在删除试卷..."} />
// 							</DialogContent>
// 						),
// 					});
// 					for (const item of target) {
// 						const result = await invoke("deleteDocument", item.id);
// 						if (!result.isOk()) {
// 							await new Promise((resolve) => {
// 								pushDialog({
// 									title: "错误",
// 									content: (
// 										<DialogContent>
// 											<DialogErrorTemplate
// 												info={"删除试卷时发生错误"}
// 												error={result.getError()}
// 											/>
// 										</DialogContent>
// 									),
// 									buttons: ["确定"],
// 									callback: resolve,
// 								});
// 							});
// 						}
// 						// 既然文件已经被删完了，那么我们就取消勾选
// 						selectedStore.remove(item.id);
// 					}
// 					onRefresh();
// 					closeWaitingDialog();
// 				}
// 			}
// 			if (operation === "简单取回") {
// 				const selected = target.map((item): SelectedDocument => {
// 					return { color: false, double: true, count: 1, document: item };
// 				});
// 				const op = await new Promise((resolve) => {
// 					pushDialog({
// 						title: "简单取回",
// 						content: (
// 							<DialogContent>
// 								<DialogContentText>
// 									将以黑白双面，每个一份，A4的规格取回文件，共计：
// 								</DialogContentText>
// 								<div className={"text-primary mt-1"}>
// 									<span className={"font-bold text-3xl"}>
// 										{calcMoney(selected)}
// 									</span>
// 									<span className={"ml-1"}>元</span>
// 								</div>
// 							</DialogContent>
// 						),
// 						buttons: ["取消", "继续"],
// 						callback: resolve,
// 					});
// 				});
// 				if (op === "继续") {
// 					pushWaitingDialog({
// 						title: "简单取回",
// 						content: (
// 							<DialogContent>
// 								<DialogBarProgressTemplate
// 									event={"onFetchBackProgressUpdated"}
// 									info={"正在取回"}
// 								/>
// 							</DialogContent>
// 						),
// 					});
// 					const result = await invoke("fetchBack", selected);
// 					closeWaitingDialog();
// 					if (result.isOk()) {
// 						const callback = (btn: string) => {
// 							if (btn === "重新打开文件") {
// 								open(result.unwrap());
// 								return false;
// 							}
// 							if (btn === "打开文件夹") {
// 								invoke("openTempDir");
// 								return false;
// 							}
// 						};
// 						pushDialog({
// 							title: "成功",
// 							content: (
// 								<DialogContent>
// 									<DialogContentText>
// 										取回成功，请使用黑白打印机，选用A4纸张，双面打印。
// 									</DialogContentText>
// 								</DialogContent>
// 							),
// 							buttons: ["打开文件夹", "重新打开文件", "完成"],
// 							callback,
// 						});
// 						open(result.unwrap());
// 					} else {
// 						pushDialog({
// 							title: "错误",
// 							content: (
// 								<DialogContent>
// 									<DialogContentText>取回失败</DialogContentText>
// 									<div className={"whitespace-break-spaces mt-2"}>
// 										{formatToString(result.getError())}
// 									</div>
// 								</DialogContent>
// 							),
// 						});
// 					}
// 				}
// 			}
// 		};
// 		handle();
// 	};
// 	useEffect(() => {
// 		const container = selfRef.current.closest(".selection-container");
// 		container.addEventListener("keydown", onKeyDown);
// 		const f = subscribe("onMenuCallback", handleMenuCallback);
// 		return () => {
// 			container.removeEventListener("keydown", onKeyDown);
// 			unsubscribe("onMenuCallback", f);
// 		};
// 	}, []);
// 	const handleContextMenu: MouseEventHandler = (event) => {
// 		event.preventDefault();
// 		const target: Document[] = [];
// 		// 获取当前搜索结果中选中的
// 		const state = useSelectedStore.getState();
// 		for (const item of listRef.current) {
// 			if (state.selectedID.includes(item.id)) {
// 				target.push(item);
// 			}
// 		}
// 		invoke("popMenu", target, true);
// 	};
// 	return (
//
// 	);
// };
