import {
	ButtonBase,
	Checkbox,
	Chip,
	CircularProgress,
	DialogContent,
	DialogContentText,
	Divider,
	FormControlLabel,
	IconButton,
	Stack,
	TextField,
} from "@mui/material";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import {
	ChangeEvent,
	KeyboardEventHandler,
	MouseEventHandler,
	useRef,
	useState,
} from "react";
import PlagiarismOutlinedIcon from "@mui/icons-material/PlagiarismOutlined";
import _ from "lodash";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useDialogStore } from "../stores/dialog";
import { useSelectedStore } from "../stores/selected.ts";
import classNames from "classnames";
import DocumentItem from "../components/DocumentItem";
import { commands, Document, DocumentType } from "../bindings";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import DialogProgressTemplate from "../components/dialog/DialogCircleProgressTemplate.tsx";
import { unwrap } from "../utils/result.ts";
import DialogErrorTemplate from "../components/dialog/DialogErrorTemplate.tsx";
import {
	calcMoney,
	clearSelected,
	editDocument,
	fetchDocument,
} from "../utils/document.tsx";
import { clone } from "../utils";

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

interface Tag {
	tag: string;
	show: boolean; // 是否显示，选中试卷类型和试卷名称之后部分标签可能会被隐藏
	chosen: boolean; // 是否被选中
}

interface Name {
	// 课程名称
	name: string;
	show: boolean;
	chosen: boolean; // 是否被选中
}

function Search() {
	// dialog
	const pushDialog = useDialogStore((state) => state.push);
	// selected
	const selectedStore = useSelectedStore();
	// loading
	const [loading, setLoading] = useState(false);
	const loadingRef = useRef(false);
	// type
	const [type, setType] = useState<DocumentType[]>([
		"FinalExam",
		"MidExam",
		"Other",
	]);
	const typeRef = useRef<DocumentType[]>(type);
	// keyword
	const [keyword, setKeyword] = useState("");
	const keywordRef = useRef("");
	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		keywordRef.current = value;
		setKeyword(value);
		handleSearch();
	};
	// search data
	const [time, setTime] = useState(0); // 搜索耗时
	const [data, setData] = useState<Document[]>([]); // 显示的数据
	const dataRef = useRef(data);
	const allDataRef = useRef<Document[]>([]); // 实际上所有关键词命中的数据
	const [tagList, setTagList] = useState<Tag[]>([]);
	const tagListRef = useRef<Tag[]>([]);
	const [nameList, setNameList] = useState<Name[]>([]);
	const nameListRef = useRef<Name[]>([]);
	// nameList, tag, keyword 相当于一组搜索状态
	// 搜索时先根据关键字从后端拿到所有试卷信息（handleSearch），后续根据筛选条件执行 filterData 来筛选
	const filterData = (calcTime = true) => {
		const startTime = new Date().getTime();
		// 当前选中的名称。选中不一定显示
		const chosenNames = nameListRef.current
			.filter((item) => item.chosen)
			.map((item) => item.name);
		// 设置显示状态
		const showNames: string[] = [];
		const showTags: string[] = [];
		for (const doc of allDataRef.current) {
			if (!typeRef.current.includes(doc.info.type)) continue; // 类型不匹配，名称和标签都不显示
			if (!showNames.includes(doc.info.name)) showNames.push(doc.info.name);
			if (!chosenNames.includes(doc.info.name)) continue; // 没选上名称，标签不显示
			for (const tag of doc.info.filter) {
				if (!showTags.includes(tag)) showTags.push(tag);
			}
		}
		nameListRef.current.forEach((item) => {
			item.show = showNames.includes(item.name);
		});
		tagListRef.current.forEach((item) => {
			item.show = showTags.includes(item.tag);
		});
		setNameList(nameListRef.current);
		setTagList(tagListRef.current);
		// 筛出当前已经选中的tag
		const chosenTags = tagListRef.current
			.filter((item) => item.show && item.chosen)
			.map((item) => item.tag);
		const result = allDataRef.current.filter((item) => {
			if (!typeRef.current.includes(item.info.type)) return false; // 类型不匹配
			if (!chosenNames.includes(item.info.name)) return false; // 课程名称未选中
			if (
				_.intersection(chosenTags, item.info.filter).length ===
				item.info.filter.length
			)
				// 需要所有标签都被选中
				return true;
			return false;
		});
		// 然后再根据年份排个序
		result.sort((a, b) => {
			if (a.info.date === null) return -1;
			if (b.info.date === null) return 1;
			return b.info.date.year - a.info.date.year;
		});
		dataRef.current = result;
		setData(dataRef.current);
		if (calcTime) {
			const endTime = new Date().getTime();
			setTime(endTime - startTime);
		}
	};
	const handleSearch = (refresh = true) => {
		setLoading(true);
		loadingRef.current = true;
		_.debounce(async () => {
			if (keywordRef.current.length !== 0) {
				const startTime = new Date().getTime();
				const result = await commands.searchDocument(keywordRef.current);
				// 准备名称列表
				const allNames: string[] = [];
				for (const doc of result) {
					if (!allNames.includes(doc.info.name)) {
						allNames.push(doc.info.name);
					}
				}
				const remainNames: Name[] = allNames.map((name) => {
					// 刷新的话都不选中
					if (refresh) return { name, show: false, chosen: false };
					// 如果之前选中了，就保持选中
					const before = nameListRef.current.find((i) => i.name === name);
					if (before) return { name, show: false, chosen: before.chosen };
					// 如果之前没有，就是新的，不选中
					return { name, show: false, chosen: false };
				});
				// 准备标签，名称列表交给 filterData 处理
				const allTags: string[] = [];
				for (const doc of result) {
					for (const item of doc.info.filter) {
						if (!allTags.includes(item)) {
							allTags.push(item);
						}
					}
				}
				const remainTags: Tag[] = allTags.map((tag) => {
					// 刷新的话都不选中
					if (refresh) return { tag, show: false, chosen: false };
					// 如果之前选中了，就保持选中
					const before = tagListRef.current.find((i) => i.tag === tag);
					if (before) return { tag, show: false, chosen: before.chosen };
					// 如果之前没有，就是新的，不选中
					return { tag, show: false, chosen: false };
				});
				// 准备数据
				allDataRef.current = result;
				// taglist和namelist 先不提交，由 filterData 来设置是否显示
				tagListRef.current = remainTags;
				nameListRef.current = remainNames;
				// 基于搜索状态过滤数据
				filterData(false);
				// 计算耗时
				const endTime = new Date().getTime();
				setTime(endTime - startTime);
			} else {
				dataRef.current = [];
				setData(dataRef.current);
				setNameList([]);
				setTagList([]);
			}
			setLoading(false);
			loadingRef.current = false;
		}, 500)();
	};
	// 全选快捷键支持
	const handleKeyDown: KeyboardEventHandler = (e) => {
		// 判断是否来自与右侧的区域
		const target = (e.target as HTMLElement).closest(".side-area");
		if (target) return;
		if (e.ctrlKey && e.key === "a") {
			e.preventDefault();
			const state = useSelectedStore.getState();
			let selectedCount = 0; // 勾选了几个
			for (const item of dataRef.current) {
				const selected =
					state.selected.find((v) => v.doc.md5 === item.md5) != undefined;
				if (!selected) {
					// 没选上的选上
					selectedCount++;
					state.add(item);
				}
			}
			if (selectedCount === 0) {
				// 如果一个都没勾选上说明当前已经全选了。全不选
				for (const item of dataRef.current) {
					state.remove(item.md5);
				}
			}
		}
	};
	// 右键菜单
	const [contextMenu, setContextMenu] = useState<{
		mouseX: number;
		mouseY: number;
	} | null>(null);
	const handleContextMenu: MouseEventHandler<HTMLDivElement> = (event) => {
		event.stopPropagation();
		event.preventDefault();
		setContextMenu(
			contextMenu === null
				? {
						mouseX: event.clientX + 2,
						mouseY: event.clientY - 6,
					}
				: null,
		);
	};
	const handleContextMenuClose = () => {
		setContextMenu(null);
	};
	const contextDeleteAction = async () => {
		setContextMenu(null);
		const state = useSelectedStore.getState();
		const dialogStore = useDialogStore.getState();
		const op = await new Promise((resolve) => {
			pushDialog({
				title: "删除试卷",
				content: (
					<DialogContent>
						<DialogContentText>
							确定要删除这
							<span className={"font-bold"}>{state.selected.length}</span>
							份试卷吗？该操作不可逆。
						</DialogContentText>
					</DialogContent>
				),
				buttons: ["取消", "确定"],
				callback: resolve,
			});
		});
		if (op === "确定") {
			try {
				dialogStore.pushWaitingDialog({
					title: "删除中",
					content: (
						<DialogContent>
							<DialogProgressTemplate
								info={"正在删除试卷..."}
								total={-1}
								ok={-1}
							/>
						</DialogContent>
					),
				});
				for (const item of state.selected) {
					unwrap(await commands.deleteDocument(item.doc.md5));
					// 既然文件已经被删完了，那么我们就取消勾选
					selectedStore.remove(item.doc.md5);
				}
				dialogStore.closeWaitingDialog();
			} catch (e) {
				dialogStore.closeWaitingDialog();
				await new Promise((resolve) => {
					pushDialog({
						title: "错误",
						content: (
							<DialogContent>
								<DialogErrorTemplate info={"删除试卷时发生错误"} error={e} />
							</DialogContent>
						),
						buttons: ["确定"],
						callback: resolve,
					});
				});
			}
			handleSearch(false);
		}
	};
	const contextEditAction = async () => {
		setContextMenu(null);
		const state = useSelectedStore.getState();
		await editDocument(state.selected[0].doc);
	};
	const contextFetchAction = async () => {
		setContextMenu(null);
		const selected = clone(useSelectedStore.getState().selected);
		for (const item of selected) {
			item.color = false;
			item.count = 1;
		}
		const op = await new Promise((resolve) => {
			pushDialog({
				title: "简单取回",
				content: (
					<DialogContent>
						<DialogContentText>
							将以黑白双面，每个一份，A4的规格取回文件，共计：
						</DialogContentText>
						<div className={"text-primary mt-1"}>
							<span className={"font-bold text-3xl"}>
								{calcMoney(selected, true)}
							</span>
							<span className={"ml-1"}>元</span>
						</div>
					</DialogContent>
				),
				buttons: ["取消", "继续"],
				callback: resolve,
			});
		});
		if (op === "继续") {
			await fetchDocument(selected, true);
			clearSelected();
		}
	};
	return (
		<div
			className={"relative selection-container outline-none cursor-default"}
			style={{ minHeight: "calc(100vh - 90px)" }}
			contentEditable={true}
			onKeyDown={handleKeyDown}
		>
			<div className={"min-h-full"} contentEditable={false}>
				<div className={"min-h-full"}>
					<div className={"min-h-full mr-64"}>
						{loading && (
							<div className={"text-8xl text-title py-16 text-center"}>
								<CircularProgress size={"32px"}></CircularProgress>
							</div>
						)}
						{!loading && keyword.length === 0 && (
							<div className={"text-8xl text-title py-16 text-center"}>
								<PlagiarismOutlinedIcon
									fontSize={"inherit"}
								></PlagiarismOutlinedIcon>
								<div className={"text-sm text-center mt-2 select-none"}>
									输入关键字以搜索
								</div>
							</div>
						)}
						{!loading && keyword.length > 0 && data.length === 0 && (
							<div className={"text-8xl text-title py-16 text-center"}>
								<InfoOutlinedIcon fontSize={"inherit"}></InfoOutlinedIcon>
								<div className={"text-sm text-center mt-2 select-none"}>
									没有找到相关试卷
								</div>
							</div>
						)}
						{!loading && keyword.length > 0 && data.length !== 0 && (
							<>
								<Menu
									open={contextMenu !== null}
									onClose={handleContextMenuClose}
									anchorReference="anchorPosition"
									anchorPosition={
										contextMenu !== null
											? { top: contextMenu.mouseY, left: contextMenu.mouseX }
											: undefined
									}
								>
									<MenuItem
										onClick={contextFetchAction}
										disabled={selectedStore.selected.length == 0}
									>
										快速取回
									</MenuItem>
									<MenuItem
										onClick={contextEditAction}
										disabled={selectedStore.selected.length != 1}
									>
										编辑
									</MenuItem>
									<MenuItem
										onClick={contextDeleteAction}
										disabled={selectedStore.selected.length == 0}
									>
										删除
									</MenuItem>
								</Menu>
								<div className={"text-title text-xs pt-1 select-none"}>
									命中 {data.length} 条，耗时 {time} ms
								</div>
								<div onContextMenu={handleContextMenu} className={"mr-3"}>
									{data.map((item) => {
										const selected =
											selectedStore.selected.find(
												(v) => v.doc.md5 === item.md5,
											) != undefined;
										return (
											<DocumentItem
												info={item.info}
												onSelect={() => {
													if (selected) {
														selectedStore.remove(item.md5);
													} else {
														selectedStore.add(item);
													}
												}}
												key={item.md5}
												selected={selected}
												onDoubleClick={() => commands.openDocument(item.md5)}
												id={item.id}
											/>
										);
									})}
								</div>
							</>
						)}
					</div>
					<div
						className={
							"bg-white fixed w-64 rounded right-3 top-12 overflow-y-auto py-2 select-none side-area"
						}
						style={{ maxHeight: "calc(100% - 90px)" }}
						onMouseDown={(e) => e.stopPropagation()}
					>
						<div className={"flex items-center ml-2 mr-1"}>
							<TextField
								className={"flex-1"}
								label="搜索"
								size="small"
								variant="standard"
								value={keyword}
								onChange={handleChange}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleSearch();
									}
								}}
							/>
							<IconButton onClick={() => handleSearch()}>
								<SearchOutlinedIcon />
							</IconButton>
						</div>
						<Stack spacing={1} direction={"row"} className={"ml-1 mt-1"}>
							{["期末", "期中", "其他"].map((item, index) => {
								let item_type: DocumentType = "FinalExam";
								if (index == 1) item_type = "MidExam";
								if (index == 2) item_type = "Other";
								return (
									<FormControlLabel
										key={item}
										control={
											<Checkbox
												checked={type.includes(item_type)}
												size={"small"}
											/>
										}
										label={<div className={"text-sm"}>{item}</div>}
										onClick={(e) => {
											e.preventDefault();
											if (type.includes(item_type)) {
												typeRef.current = type.filter(
													(item) => item !== item_type,
												);
											} else {
												typeRef.current.push(item_type);
											}
											setType([...typeRef.current]);
											if (!loadingRef.current) filterData();
										}}
									/>
								);
							})}
						</Stack>
						{nameList.filter((name) => name.show).length !== 0 && (
							<>
								<Divider className={"mt-1"} />
								{nameList.map((item, index) => (
									<ButtonBase
										component={"div"}
										className={classNames(
											"block px-3 py-1.5 text-sm transition-all text-title",
											{
												"bg-black bg-opacity-0 hover:bg-opacity-20":
													!item.chosen,
												"bg-primary bg-opacity-20 hover:bg-opacity-40":
													item.chosen,
												hidden: !item.show,
											},
										)}
										key={item.name}
										onClick={() => {
											nameListRef.current[index].chosen = !item.chosen;
											setNameList([...nameListRef.current]);
											filterData();
										}}
									>
										{item.name}
									</ButtonBase>
								))}
							</>
						)}
						{tagList.filter((tag) => tag.show).length !== 0 && (
							<>
								<Divider className={"mt-1"} />
								<div className={"flex flex-wrap m-1 z-50"}>
									{tagList.map((item, index) => (
										<Chip
											key={item.tag}
											label={item.tag}
											color={item.chosen ? "primary" : "default"}
											variant="outlined"
											size={"small"}
											className={classNames("m-1", {
												hidden: !item.show,
											})}
											onClick={() => {
												tagListRef.current[index].chosen = !item.chosen;
												setTagList([...tagListRef.current]);
												filterData();
											}}
										/>
									))}
								</div>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default Search;
