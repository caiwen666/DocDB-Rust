import { DocumentInfo } from "@/bindings.ts";

export interface ItemProps {
	selected: boolean;
	onSelect?: () => void;
	onChange: (color: boolean, count: number) => void;
	formColor: boolean;
	formCount: number;
	info: DocumentInfo;
}
