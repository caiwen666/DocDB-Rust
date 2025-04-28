import { useSelectedStore } from "../stores/selected.ts";
import { DialogContent, DialogContentText } from "@mui/material";
import DialogBarProgressTemplate from "../components/dialog/DialogBarProgressTemplate.tsx";
import { useDialogStore } from "../stores/dialog.ts";
import {
	commands,
	DocumentInfo,
	SelectedDocument,
	Document,
} from "../bindings.ts";
import { unwrap } from "./result.ts";
import DialogErrorTemplate from "../components/dialog/DialogErrorTemplate.tsx";
import DocumentForm from "../components/DocumentForm.tsx";
import { clone } from "./index.ts";
import DialogProgressTemplate from "../components/dialog/DialogCircleProgressTemplate.tsx";

/**
 * 清空所有选中
 */
export const clearSelected = () => {
	useSelectedStore.setState(() => ({ selected: [] }));
};

/**
 * 取回选中文件
 */
export const fetchDocument = async (
	list: SelectedDocument[],
	double: boolean,
) => {
	const dialogStore = useDialogStore.getState();
	const normalTarget = [];
	const colorTarget = [];
	for (const item of list) {
		if (item.color) colorTarget.push(item);
		else normalTarget.push(item);
	}
	dialogStore.pushWaitingDialog({
		title: "取回",
		content: (
			<DialogContent>
				<DialogBarProgressTemplate info={"正在取回"} />
			</DialogContent>
		),
	});
	try {
		if (normalTarget.length != 0) {
			const result = unwrap(await commands.fetchDocument(normalTarget, double));
			dialogStore.closeWaitingDialog();
			await commands.openTempFile(result);
			await new Promise((resolve) => {
				const callback = (btn: string) => {
					if (btn === "重新打开文件") {
						commands.openTempFile(result);
						return false;
					}
					if (btn === "打开文件夹") {
						commands.openTempDir();
						return false;
					}
					resolve("ok");
				};
				dialogStore.push({
					title: "成功",
					content: (
						<DialogContent>
							<DialogContentText>
								取回成功，请使用<span className={"font-bold"}>黑白</span>
								打印机，选用A4纸张，
								<span className={"font-bold"}>{double ? "双面" : "单面"}</span>
								打印。
							</DialogContentText>
							{colorTarget.length !== 0 && (
								<DialogContentText>
									注意，取回操作尚未全部完成，点击“下一步”继续取回彩印文件。
								</DialogContentText>
							)}
						</DialogContent>
					),
					buttons: [
						"打开文件夹",
						"重新打开文件",
						colorTarget.length === 0 ? "完成" : "下一步",
					],
					callback,
				});
			});
		}
		if (colorTarget.length !== 0) {
			dialogStore.pushWaitingDialog({
				title: "取回",
				content: (
					<DialogContent>
						<DialogBarProgressTemplate info={"正在取回"} />
					</DialogContent>
				),
			});
			const result = unwrap(await commands.fetchDocument(colorTarget, double));
			dialogStore.closeWaitingDialog();
			await commands.openTempFile(result);
			const callback = (btn: string) => {
				if (btn === "重新打开文件") {
					commands.openTempFile(result);
					return false;
				}
				if (btn === "打开文件夹") {
					commands.openTempDir();
					return false;
				}
			};
			dialogStore.push({
				title: "成功",
				content: (
					<DialogContent>
						<DialogContentText>
							取回成功，请使用<span className={"font-bold"}>彩色</span>
							打印机，选用A4纸张，
							<span className={"font-bold"}>{double ? "双面" : "单面"}</span>
							打印。
						</DialogContentText>
					</DialogContent>
				),
				buttons: ["打开文件夹", "重新打开文件", "完成"],
				callback,
			});
		}
	} catch (e) {
		dialogStore.closeWaitingDialog();
		dialogStore.push({
			title: "错误",
			content: (
				<DialogContent>
					<DialogErrorTemplate info={"取回失败"} error={e} />
				</DialogContent>
			),
		});
	}
};

/**
 * 计算试卷价格
 * @param target
 * @param double
 */
export const calcMoney = (target: SelectedDocument[], double: boolean) => {
	let res = 0;
	for (const item of target) {
		let t = 0;
		const page = item.doc.info.page;
		if (double) {
			t = Math.ceil(page / 2) * 0.12;
		} else {
			t = page * 0.08;
		}
		if (item.color) t *= 10;
		res += t * item.count;
	}
	return res.toFixed(2);
};

/**
 * 把文件名中潜在的试卷信息自动解析出来
 * @param str 文件名
 * @param info 原始试卷信息
 * @returns 解析后的试卷信息
 */
export const parseName = (str: string, info: DocumentInfo) => {
	const yearMatch = str.match(/[^0-9]*[0-9]+[^0-9]*/g);
	if (yearMatch != null) {
		for (let s of yearMatch) {
			s = s.replace(/[^0-9]*/g, "");
			if (s.length === 2 || s.length === 4) {
				let year = Number(s);
				if (year < 100) year += 2000;
				if (!info.date) {
					info.date = {
						type: "Year",
						year,
					};
				} else {
					info.date.year = year;
				}
				str = str.replace(s, "");
			}
		}
	}
	const idMatch = str.match(/[A-Z]+\d+/g);
	if (idMatch != null) {
		const id = idMatch[0];
		info.identifier = id;
		str = str.replace(/[A-Z]+\d+/g, "");
	}
	const keys = [
		"试卷及",
		"试题及",
		"试卷",
		"试题",
		"未知年份",
		"年",
		"级",
		"月",
	];
	for (const key of keys) {
		str = str.replace(key, "");
	}
	if (str.includes("期中")) {
		info.type = "MidExam";
		str = str.replace("期中", "");
	}
	if (str.includes("期末")) {
		info.type = "FinalExam";
		str = str.replace("期末", "");
	}
	if (str.includes("机考")) {
		info.type = "Other";
		str = str.replace("机考", "");
	}
	if (str.includes("答案")) {
		info.answer = true;
		str = str.replace("答案", "");
	} else {
		info.answer = false;
	}
	str = str.replace(/[^\u4e00-\u9fa5]/g, "");
	info.name = str;
	return info;
};

/**
 * 格式化试卷信息为字符串
 * @param info
 */
export const formatDocumentInfo = (info: DocumentInfo) => {
	let result = "";
	if (info.date) {
		if (info.date.type === "Year") {
			result += info.date.year + "年";
		} else {
			result += info.date.year + "级";
		}
	} else {
		result += "未知年份-";
	}
	result += info.name;
	if (info.type === "FinalExam") {
		result += "期末试卷";
	} else if (info.type === "MidExam") {
		result += "期中试卷";
	} else if (info.type === "Other") {
		result += "其他试卷";
	}
	if (info.answer) {
		result += "及答案";
	}
	if (info.identifier) {
		result += "-" + info.identifier;
	}
	for (const tag of info.filter) {
		result += "-" + tag;
	}
	for (const tag of info.tags) {
		result += "-" + tag;
	}
	return result;
};

/**
 * 编辑试卷
 */
export const editDocument = async (target: Document) => {
	const doc = clone(target);
	const dialogStore = useDialogStore.getState();
	let isValidate = false;
	const op = await new Promise((resolve) => {
		const callback = (btn: string) => {
			if (btn === "确定") {
				if (isValidate) {
					resolve("确定");
				} else {
					return false;
				}
			} else {
				resolve("取消");
			}
		};
		dialogStore.push({
			title: "编辑试卷信息",
			content: (
				<DialogContent>
					<DocumentForm
						form={doc.info}
						onChange={(v) => (doc.info = v)}
						onValid={(v) => (isValidate = v)}
					/>
				</DialogContent>
			),
			buttons: ["取消", "确定"],
			callback,
		});
	});
	if (op === "确定") {
		try {
			dialogStore.pushWaitingDialog({
				title: "更新试卷",
				content: (
					<DialogContent>
						<DialogProgressTemplate
							info={"正在更新试卷信息..."}
							total={-1}
							ok={-1}
							variant={"circle"}
						/>
					</DialogContent>
				),
			});
			unwrap(await commands.updateDocument(doc));
			dialogStore.closeWaitingDialog();
		} catch (e) {
			dialogStore.closeWaitingDialog();
			dialogStore.push({
				title: "错误",
				content: (
					<DialogContent>
						<DialogErrorTemplate info={"更新试卷信息时发生错误"} error={e} />
					</DialogContent>
				),
			});
		}
		// onRefresh();
	}
};
