import React, { useState } from "react";
import { ItemProps } from "@/pages/add/item.config.ts";
import {
	Button,
	ButtonBase,
	Collapse,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Divider,
} from "@mui/material";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import ExpandLessOutlinedIcon from "@mui/icons-material/ExpandLessOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DocumentForm from "@/components/DocumentForm.tsx";

const Item: React.FC<ItemProps> = (props) => {
	//the panel
	const [isExpanded, setIsExpanded] = useState(true);
	const [deleteDialog, setDeleteDialog] = useState(false);
	return (
		<Collapse
			in={isExpanded}
			collapsedSize={32}
			className={"w-full bg-white rounded overflow-hidden mt-2 select-none"}
		>
			<div className={"flex"}>
				<ButtonBase
					component={"div"}
					className={"h-8 flex items-center justify-start px-1 flex-1 min-w-0"}
					onClick={() => {
						setIsExpanded(!isExpanded);
					}}
				>
					<AttachFileOutlinedIcon fontSize={"small"} />
					<div className={"text-sm pl-1 flex-1 overflow-hidden"}>
						<div className={"truncate"}>{props.file}</div>
					</div>
					{isExpanded ? (
						<ExpandLessOutlinedIcon fontSize={"small"} className={"ml-auto"} />
					) : (
						<ExpandMoreOutlinedIcon fontSize={"small"} className={"ml-auto"} />
					)}
				</ButtonBase>
				<ButtonBase className={"w-8 h-8"} onClick={() => setDeleteDialog(true)}>
					<DeleteOutlineOutlinedIcon fontSize={"small"} />
				</ButtonBase>
			</div>
			<Divider />
			<DocumentForm
				form={props.form}
				onChange={props.onChange}
				onValid={props.onValid}
				className={"p-2"}
			/>
			<Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
				<DialogTitle>删除试卷</DialogTitle>
				<DialogContent>
					<DialogContentText>确定要删除这份试卷吗？</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteDialog(false)}>取消</Button>
					<Button
						onClick={() => {
							props.onDelete();
							setDeleteDialog(false);
						}}
					>
						删除
					</Button>
				</DialogActions>
			</Dialog>
		</Collapse>
	);
};

export default Item;
