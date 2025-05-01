import React, { useEffect, useState } from "react";
import classNames from "classnames";
import {
	ButtonBase,
	Checkbox,
	Chip,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	TextField,
} from "@mui/material";
import { ItemProps } from "./item.config.ts";

const Item: React.FC<ItemProps> = (props) => {
	let yearFormat = "未知年份";
	if (props.info.date) {
		yearFormat = props.info.date.year.toString();
		if (props.info.date.type === "Year") yearFormat += "年";
		else yearFormat += "级";
	}
	const [color, setColor] = useState(props.formColor ? 1 : 0);
	const [count, setCount] = useState(props.formCount.toString());
	const [countValid, setCountValid] = useState(true);
	useEffect(() => {
		let validate = true;
		const num = Number(count);
		if (isNaN(num) || num < 1) {
			validate = false;
		}
		setCountValid(validate);
		if (props.onChange) props.onChange(color === 1, validate ? num : -1);
	}, [color, count]);
	useEffect(() => {
		setColor(props.formColor ? 1 : 0);
		setCount(props.formCount.toString());
	}, [props.formColor, props.formCount]);
	return (
		<div
			className={classNames(
				"mt-2 rounded select-none no-drag transition overflow-hidden",
				{
					"bg-primary bg-opacity-20 hover:bg-opacity-30": props.selected,
					"bg-white hover:bg-gray-100": !props.selected,
				},
			)}
		>
			<ButtonBase
				className={"p-1 block cursor-default"}
				component={"div"}
				onClick={props.onSelect}
			>
				<div className={"flex"}>
					<div className={"flex-1"}>
						<div className={"flex items-center"}>
							<Checkbox size={"small"} checked={props.selected} />
							<div className={"ml-1"}>
								<div
									className={"text-sm"}
								>{`${yearFormat} / ${props.info.name}`}</div>
								<div className={"text-xs"}>
									{props.info.type === "FinalExam"
										? "期末"
										: props.info.type === "MidExam"
											? "期中"
											: "其他"}{" "}
									<span
										className={classNames({
											"text-error": !props.info.answer,
											"text-success": props.info.answer,
										})}
									>
										{props.info.answer ? "有答案" : "仅试卷"}
									</span>
									{props.info.identifier &&
										props.info.identifier.length != 0 &&
										" " + props.info.identifier}
									<span
										className={"text-title"}
									>{` ${props.info.page}页`}</span>
								</div>
							</div>
						</div>
						<div className={"flex flex-wrap mt-0.5"}>
							{props.info.filter.map((tag) => (
								<Chip
									key={tag}
									label={tag}
									size={"small"}
									color={"primary"}
									variant={"outlined"}
									className={"m-0.5"}
								/>
							))}
							{props.info.tags.map((tag) => (
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
					</div>
					<div
						className={"flex items-center p-1"}
						onClick={(e) => e.stopPropagation()}
					>
						<FormControl variant="standard" className={"ml-2"}>
							<InputLabel>颜色</InputLabel>
							<Select
								value={color ? 1 : 0}
								onChange={() => setColor((v) => 1 - v)}
								size={"small"}
							>
								<MenuItem value={1}>彩印</MenuItem>
								<MenuItem value={0}>黑白</MenuItem>
							</Select>
						</FormControl>
						<TextField
							label="份数"
							variant="standard"
							size={"small"}
							className={"w-20 ml-2"}
							value={count}
							error={!countValid}
							onChange={(e) => setCount(e.target.value)}
						/>
					</div>
				</div>
			</ButtonBase>
		</div>
	);
};

export default Item;
