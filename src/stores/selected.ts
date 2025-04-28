import { SelectedDocument, Document } from "../bindings";
import { create } from "zustand";

export interface SelectedStore {
	selected: SelectedDocument[];
	add: (target: Document) => void;
	remove: (md5: string) => void;
}

export const useSelectedStore = create<SelectedStore>((set) => ({
	selected: [],
	add: (target) =>
		set((state) => ({
			selected: [
				...state.selected,
				{
					count: 1,
					color: false,
					doc: target,
				},
			],
		})),
	remove: (target) =>
		set((state) => ({
			selected: state.selected.filter((v) => v.doc.md5 !== target),
		})),
}));
