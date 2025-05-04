import { ButtonBase, Checkbox, Chip } from "@mui/material";
import classNames from "classnames";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { Document } from "@/bindings";

interface Props {
	onSelect?: () => void; // 提供 onSelect 后会渲染勾选框，并增加鼠标悬浮状态和点击涟漪
	selected?: boolean; // 是否选中，如果没提供 onSelect，该属性无效
	ref?: (e: HTMLDivElement | null) => void;
	doc: Document;
	onDoubleClick?: () => void; // 双击事件，提供这个后会增加鼠标悬浮状态和点击涟漪
	className?: string;
}

const DocumentItem: React.FC<Props> = (props) => {
	let yearFormat = "未知年份";
	const info = props.doc.info;
	if (info.date) {
		yearFormat = info.date.year.toString();
		if (info.date.type === "Year") yearFormat += "年";
		else yearFormat += "级";
	}
	const selectStyle = props.onSelect || props.onDoubleClick;
	return (
		<div
			className={classNames(
				"mt-2 rounded overflow-hidden select-none no-drag transition",
				{
					"bg-primary bg-opacity-20 hover:bg-opacity-30":
						selectStyle && props.selected,
					"bg-white hover:bg-gray-100": selectStyle && !props.selected,
				},
				props.className,
			)}
			ref={(el) => {
				if (props.ref) props.ref(el);
			}}
		>
			<ButtonBase
				className={"p-1 block cursor-default"}
				component={"div"}
				onClick={props.onSelect}
				disableRipple={!selectStyle}
				onDoubleClick={props.onDoubleClick}
			>
				<div className={"flex items-center"}>
					{props.onSelect ? (
						<Checkbox size={"small"} checked={props.selected} />
					) : (
						<AttachFileIcon />
					)}
					<div className={"ml-1"}>
						<div className={"text-sm"}>{`${yearFormat} / ${info.name}`}</div>
						<div className={"text-xs"}>
							{info.type === "FinalExam"
								? "期末"
								: info.type === "MidExam"
									? "期中"
									: "其他"}{" "}
							<span
								className={classNames({
									"text-error": !info.answer,
									"text-success": info.answer,
								})}
							>
								{info.answer ? "有答案" : "仅试卷"}
							</span>
							{info.identifier &&
								info.identifier.length != 0 &&
								" " + info.identifier}
							{" " + info.page + "页"}
							<span className={"text-title"}>
								{props.doc.id ? " #" + props.doc.id : ""}
							</span>
						</div>
					</div>
				</div>
				<div className={"flex flex-wrap mt-0.5"}>
					{info.filter.map((tag) => (
						<Chip
							key={tag}
							label={tag}
							size={"small"}
							color={"primary"}
							variant={"outlined"}
							className={"m-0.5"}
						/>
					))}
					{info.tags.map((tag) => (
						<Chip
							key={tag}
							label={tag}
							size={"small"}
							color={"success"}
							variant={"outlined"}
							className={"m-0.5"}
						/>
					))}
				</div>
			</ButtonBase>
		</div>
	);
};

export default DocumentItem;
