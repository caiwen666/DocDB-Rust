import { Document, DocumentParseInfo } from "@/bindings.ts";
import { parseName } from "@/utils/document.tsx";

export interface DropEvent {
	paths: string[];
}

export interface DocumentFromFile {
	doc: Document;
	name: string;
}

export const parseToDocument = (info: DocumentParseInfo): DocumentFromFile => {
	const res: DocumentFromFile = {
		name: info.name,
		doc: {
			id: -1,
			md5: info.md5,
			info: {
				name: "",
				identifier: null,
				date: null,
				type: "FinalExam",
				answer: false,
				page: info.page,
				filter: [],
				tags: [],
			},
		},
	};
	res.doc.info = parseName(info.name.slice(0, -4), res.doc.info);
	return res;
};
