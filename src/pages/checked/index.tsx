import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	TextField,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import DoneAllOutlinedIcon from "@mui/icons-material/DoneAllOutlined";
import RemoveDoneOutlinedIcon from "@mui/icons-material/RemoveDoneOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { usePageStore } from "@/stores/page.ts";
import { useSelectedStore } from "@/stores/selected.ts";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import { SelectedDocument } from "@/bindings.ts";
import { clone } from "@/utils";
import { calcMoney, clearSelected, fetchDocument } from "@/utils/document.tsx";
import Item from "./item.tsx";
import Grid from "@mui/material/Grid";

const Index = () => {
	// data
	const selectedStore = useSelectedStore();
	const [localSelected, setLocalSelected] = useState<SelectedDocument[]>([]);
	const localSelectedRef = useRef(localSelected);
	const [double, setDouble] = useState(true);
	const doubleRef = useRef(double);
	const [money, setMoney] = useState("0.00");
	// 批量编辑
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [applyColor, setApplyColor] = useState(-1);
	const applyColorRef = useRef(applyColor);
	const [applyCount, setApplyCount] = useState("1");
	const applyCountRef = useRef(applyCount);
	const [applyCountValid, setApplyCountValid] = useState(true);
	const applyCountValidRef = useRef(applyCountValid);
	useEffect(() => {
		usePageStore.subscribe((pageStore) => {
			if (pageStore.now != 2) return;
			const state = useSelectedStore.getState();
			// 克隆到当前页面一份。这样做的前提是在当前页面，selected 一定为 localSelected 的子集
			localSelectedRef.current = clone(state.selected);
			setLocalSelected(localSelectedRef.current);
		});
		useSelectedStore.subscribe((selectStore) => {
			setMoney(calcMoney(selectStore.selected, doubleRef.current));
		});
	}, []);
	useEffect(() => {
		const state = useSelectedStore.getState();
		setMoney(calcMoney(state.selected, doubleRef.current));
	}, [double]);
	return (
		<div>
			<div>
				<div className={"flex"}>
					<div>
						<div className={"text-title text-xs"}>当前价格</div>
						<div className={"text-primary mt-1"}>
							<span className={"font-bold text-2xl"}>{money}</span>
							<span className={"ml-1"}>元</span>
						</div>
					</div>
					<Button
						className={"ml-auto self-center"}
						startIcon={<FileDownloadOutlinedIcon />}
						disabled={selectedStore.selected.length === 0}
						onClick={() => fetchDocument(double)}
					>
						取回
					</Button>
				</div>
				<div className={"mt-2 flex"}>
					<Button
						startIcon={<DoneAllOutlinedIcon className={"text-xs"} />}
						className={"text-xs"}
						disabled={localSelected.length === 0}
						onClick={() => {
							if (selectedStore.selected.length === localSelected.length) {
								clearSelected();
							} else {
								useSelectedStore.setState({
									selected: localSelected,
								});
							}
						}}
					>
						全选
					</Button>
					<Button
						size={"small"}
						startIcon={<RemoveDoneOutlinedIcon className={"text-xs"} />}
						className={"mx-2 text-xs"}
						disabled={localSelected.length === 0}
						onClick={() => {
							const newSelected = [];
							for (const item of localSelected) {
								if (
									!selectedStore.selected.find((v) => v.doc.md5 == item.doc.md5)
								) {
									newSelected.push(item);
								}
							}
							useSelectedStore.setState({
								selected: newSelected,
							});
						}}
					>
						反选
					</Button>
					<Button
						size={"small"}
						startIcon={<EditOutlinedIcon className={"text-xs"} />}
						className={"text-xs"}
						disabled={localSelected.length === 0}
						onClick={() => {
							setApplyCount("");
							setApplyColor(-1);
							setApplyCountValid(true);
							applyCountValidRef.current = true;
							applyCountRef.current = "";
							applyColorRef.current = -1;
							setShowEditDialog(true);
						}}
					>
						批量编辑
					</Button>
					<FormControl className={"ml-4"}>
						<RadioGroup row>
							<FormControlLabel
								control={
									<Radio
										size={"small"}
										disabled={localSelected.length === 0}
										checked={double}
										onClick={() => {
											doubleRef.current = true;
											setDouble(doubleRef.current);
										}}
									/>
								}
								label={<div className={"text-xs self-center"}>双面</div>}
							/>
							<FormControlLabel
								className={"-ml-1.5"}
								control={
									<Radio
										size={"small"}
										disabled={selectedStore.selected.length === 0}
										checked={!double}
										onClick={() => {
											doubleRef.current = false;
											setDouble(doubleRef.current);
										}}
									/>
								}
								label={<div className={"text-xs self-center"}>单面</div>}
							/>
						</RadioGroup>
					</FormControl>
				</div>
				{localSelected.map((item, index) => {
					const id = item.doc.id;
					return (
						<Item
							key={id}
							selected={
								selectedStore.selected.find(
									(v) => v.doc.md5 === item.doc.md5,
								) !== undefined
							}
							info={item.doc.info}
							formColor={item.color}
							formCount={item.count}
							onChange={(color, count) => {
								localSelectedRef.current[index].count = count == -1 ? 1 : count;
								localSelectedRef.current[index].color = color;
								setLocalSelected([...localSelectedRef.current]);
								// 同步到 selectedStore
								const state = useSelectedStore.getState();
								const target = state.selected.findIndex((v) => v.doc.id == id);
								if (target != -1) {
									state.selected[target].count = count == -1 ? 1 : count;
									state.selected[target].color = color;
									useSelectedStore.setState({ selected: [...state.selected] });
								}
							}}
							onSelect={() => {
								const state = useSelectedStore.getState();
								const target = state.selected.findIndex((v) => v.doc.id == id);
								if (target == -1) {
									state.selected.push(item);
								} else {
									state.selected.splice(target, 1);
								}
								useSelectedStore.setState({ selected: [...state.selected] });
							}}
						/>
					);
				})}
			</div>
			<Dialog open={showEditDialog}>
				<DialogTitle>批量编辑</DialogTitle>
				<DialogContent>
					<Grid container spacing={1}>
						<Grid size={6}>
							<FormControl variant="standard" fullWidth>
								<InputLabel>颜色</InputLabel>
								<Select
									value={applyColor}
									onChange={(e) => {
										applyColorRef.current = e.target.value as number;
										setApplyColor(applyColorRef.current);
									}}
									size={"small"}
								>
									<MenuItem value={-1}>不更改</MenuItem>
									<MenuItem value={1}>彩印</MenuItem>
									<MenuItem value={0}>黑白</MenuItem>
								</Select>
							</FormControl>
						</Grid>
						<Grid size={6}>
							<TextField
								fullWidth
								label="份数"
								variant="standard"
								size={"small"}
								value={applyCount}
								error={!applyCountValid}
								onChange={(e) => {
									const str = e.target.value;
									applyCountRef.current = str;
									setApplyCount(str);
									if (str.length === 0) {
										applyCountValidRef.current = true;
									} else {
										const num = Number(e.target.value);
										if (isNaN(num) || num < 1) {
											applyCountValidRef.current = false;
										} else {
											applyCountValidRef.current = true;
										}
									}
									setApplyCountValid(applyCountValidRef.current);
								}}
							/>
						</Grid>
					</Grid>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setShowEditDialog(false)}>取消</Button>
					<Button
						onClick={() => {
							if (!applyCountValidRef.current) return;
							const selected = useSelectedStore.getState().selected;
							for (const item of selected) {
								// 同步
								const target = localSelectedRef.current.find(
									(v) => v.doc.id === item.doc.id,
								);
								if (applyColorRef.current !== -1) {
									item.color = applyColorRef.current === 1;
									if (target) target.color = item.color;
								}
								if (applyCountRef.current.length !== 0) {
									item.count = Number(applyCountRef.current);
									if (target) target.count = item.count;
								}
							}
							useSelectedStore.setState({ selected: [...selected] });
							setLocalSelected(localSelectedRef.current);
							setShowEditDialog(false);
						}}
					>
						应用
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
};

export default Index;
