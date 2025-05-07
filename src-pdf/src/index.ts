import { PDFDocument, degrees } from "pdf-lib";
import fontkit from "fontkit";
import * as fs from "node:fs";
import { Fontkit } from "pdf-lib/es/types/fontkit";
import * as path from "node:path";
import * as process from "node:process";

let fontPath = "";
let targetPath = "";
let watermark = true;

interface Item {
	path: string;
	double: boolean;
	count: number;
	page: number;
	name: string;
	id: number;
}

const list: Item[] = [];
let input = "";

process.stdin.on("data", (chunk) => {
	input += chunk.toString();
});

function pack_command(commands: string[]) {
	let step = 0;
	const now: Item = {
		path: "",
		double: false,
		count: 0,
		page: 0,
		name: "",
		id: 0,
	};
	for (const command of commands) {
		if (fontPath.length === 0) {
			fontPath = command;
			continue;
		}
		if (targetPath.length == 0) {
			targetPath = command;
			continue;
		}
		if (command == "END") {
			break;
		}
		if (command == "CLOSE_WATERMARK") {
			watermark = false;
			continue;
		}
		/**
		 * 路径
		 * 是否单双（double/single）
		 * 份数
		 * 名称
		 * 页数
		 * 试卷编号
		 */
		if (step == 0) {
			now.path = command;
			step++;
		} else if (step == 1) {
			now.double = command == "double";
			step++;
		} else if (step == 2) {
			now.count = Number(command);
			step++;
		} else if (step == 3) {
			now.name = command;
			step++;
		} else if (step == 4) {
			now.page = Number(command);
			step++;
		} else if (step == 5) {
			now.id = Number(command);
			step = 0;
			// 司马 nodejs，这里又传引用，需要深拷贝
			list.push(clone(now));
		}
	}
	pack().then((path) => {
		process.stdout.write("DONE " + path);
		process.exit(0);
	});
}

function parse_command(commands: string[]) {
	for (const command of commands) {
		if (command == "END") {
			break;
		}
		list.push({
			count: 0,
			double: false,
			id: 0,
			name: "",
			page: 0,
			path: command,
		});
	}
	parse().then(() => {
		process.exit(0);
	});
}

process.stdin.on("end", () => {
	/**
	 * 第一行是操作类型
	 * PACK 表示打包
	 * PARSE 表示解析pdf的页数
	 */
	/**
	 * PACK操作
	 * 字体文件目录
	 * 输出目录
	 * （可选）CLOSE_WATERMARK 是否关闭水印
	 * 后面跟若干个试卷信息
	 * END 表示结束
	 */
	/**
	 * PARSE 操作
	 * 若干个pdf路径
	 * END 表示结束
	 */
	const commands = input.split("\n");
	if (commands[0] == "PACK") pack_command(commands.slice(1));
	if (commands[0] == "PARSE") parse_command(commands.slice(1));
});

async function pack() {
	// console.log(list);
	process.stdout.write("-1\n");
	const time = new Date().getTime();
	const mergedPdf = await PDFDocument.create();
	const pages = [];
	let ok = 0;
	process.stdout.write("0 " + list.length + "\n");
	// 把所有页面都复制出来
	for (const item of list) {
		const file = await fs.promises.readFile(item.path);
		const pdf = await PDFDocument.load(file, { ignoreEncryption: true });
		const base = item.page;
		if (item.double && base % 2 === 1) {
			// 双面插空白页
			pdf.addPage();
		}
		// 根据份数复制
		for (let i = 0; i < item.count; i++) {
			const copy = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
			pages.push(...copy);
			// console.log("copied");
		}
		ok++;
		process.stdout.write(ok + " " + list.length + "\n");
	}
	process.stdout.write("-1\n");
	// 批量添加
	for (let i = 0; i < pages.length; i++) {
		mergedPdf.addPage(pages[i]);
	}
	// 嵌入字体
	const fontBytes = await fs.promises.readFile(fontPath);
	mergedPdf.registerFontkit(fontkit as unknown as Fontkit);
	const font = await mergedPdf.embedFont(fontBytes);
	// 添加水印
	let p = 0;
	const total = mergedPdf.getPageCount();
	process.stdout.write("0 " + total + "\n");
	for (const item of list) {
		for (let i = 0; i < item.count; i++) {
			for (let j = 0; j < item.page; j++) {
				const page = mergedPdf.getPage(p);
				const { width, height } = page.getSize();
				if (j == 0) {
					//首页
					const sign2 = `DocDB ID:${item.id}`;
					page.drawText(item.name, {
						x: width - font.widthOfTextAtSize(item.name, 12) - 20,
						y: 20,
						size: 12,
						opacity: 0.5,
						font,
					});
					page.drawText(sign2, {
						x: width - font.widthOfTextAtSize(sign2, 12) - 20,
						y: 20 + 12 + 2,
						size: 12,
						opacity: 0.5,
						font,
					});
				}
				if (watermark) {
					page.drawText("本资料由自强整理，仅供复习使用", {
						x: (width - 15 * 12) / 2,
						y: height - 34,
						size: 12,
						opacity: 0.5,
						font,
					});
					page.drawText("自强打印店", {
						x: (width - (5 * 80) / Math.sqrt(2)) / 2,
						y: (width - 80 / Math.sqrt(2)) / 2,
						size: 80,
						opacity: 0.3,
						rotate: degrees(45),
						font,
					});
				}
				if (item.double && item.page % 2 === 1 && j == item.page - 1) {
					// 双面打印，奇数页，且枚举到了最后一页
					p += 2;
				} else {
					// 双面打印，偶数页
					p++;
				}
				process.stdout.write(p + " " + total + "\n");
			}
		}
	}
	process.stdout.write("-1\n");
	const mergedPdfBytes = await mergedPdf.save();
	const mergedPdfPath = path.join(targetPath, time + ".pdf");
	await fs.promises.writeFile(mergedPdfPath, mergedPdfBytes);
	return time + ".pdf";
}

async function parse() {
	for (const item of list) {
		const file = await fs.promises.readFile(item.path);
		const pdf = await PDFDocument.load(file, { ignoreEncryption: true });
		process.stdout.write(pdf.getPageCount() + "\n");
	}
}

const clone = <T>(obj: T) => {
	return JSON.parse(JSON.stringify(obj)) as T;
};