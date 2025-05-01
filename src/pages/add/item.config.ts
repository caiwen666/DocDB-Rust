import { DocumentInfo } from "@/bindings.ts";

export interface ItemProps {
	form: DocumentInfo;
	onChange: (form: DocumentInfo) => void;
	onValid: (v: boolean) => void;
	onDelete: () => void;
	file: string;
}
