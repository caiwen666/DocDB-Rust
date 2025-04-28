import "./App.css";
import DataSaverOffOutlinedIcon from "@mui/icons-material/DataSaverOffOutlined";
import { Pages, usePageStore } from "./stores/page";
import classNames from "classnames";
import { ButtonBase, CircularProgress, Paper } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import RemoveOutlinedIcon from "@mui/icons-material/RemoveOutlined";
import CloseFullscreenOutlinedIcon from "@mui/icons-material/CloseFullscreenOutlined";
import CropSquareOutlinedIcon from "@mui/icons-material/CropSquareOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { animated, useSpring } from "@react-spring/web";
import DialogBase from "./components/dialog/DialogBase";
import React, { useEffect, useState } from "react";
import { useSelectedStore } from "./stores/selected.ts";
import { getCurrentWindow } from "@tauri-apps/api/window";

const SideMenuItem = ({
	active,
	title,
	onClick,
	Icon,
}: {
	active: boolean;
	title: string;
	onClick: () => void;
	Icon: React.ElementType;
}) => {
	const barStyles = useSpring({
		width: "100%",
		height: active ? "30px" : "0px",
		backgroundColor: "rgb(25,118,210)",
		config: {
			duration: 100,
		},
	});
	return (
		<div
			className={classNames(
				"w-48 hover:bg-gray-200 transition cursor-pointer h-10",
				{
					"bg-gray-300": active,
				},
			)}
			onClick={onClick}
		>
			<ButtonBase className={"w-full flex h-full"} component={"div"}>
				<div className={"h-10 w-10 flex"}>
					<Icon
						fontSize={"small"}
						className={"text-primary self-center mx-auto"}
					/>
				</div>
				<div className={"self-center text-sm flex-1"}>{title}</div>
			</ButtonBase>

			<div
				className={"z-20 -mt-10 h-10 flex items-center flex-shrink-0"}
				style={{ width: "2px" }}
			>
				<animated.div style={{ ...barStyles }}></animated.div>
			</div>
		</div>
	);
};

const appWindow = getCurrentWindow();

function App() {
	const pageStore = usePageStore();
	const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
	const [isMaximized, setIsMaximized] = useState(false);
	const selectStore = useSelectedStore();
	const menuStyles = useSpring({
		width: isSideMenuOpen ? "192px" : "40px",
		overflow: "hidden",
	});
	useEffect(() => {
		const resizeEvent = async () => {
			setIsMaximized(await appWindow.isMaximized());
		};
		window.addEventListener("resize", resizeEvent);
		return () => {
			window.removeEventListener("resize", resizeEvent);
		};
	}, []);
	return (
		<div className={"h-screen w-screen flex flex-col"}>
			<Paper
				data-tauri-drag-region
				elevation={0}
				className={"h-10 flex bg-white1 flex-shrink-0 select-none"}
				square
			>
				<ButtonBase
					className={
						"w-10 h-full hover:bg-gray-200 transition text-primary bg-white0 btn"
					}
					component={"div"}
					onClick={() => setIsSideMenuOpen(!isSideMenuOpen)}
				>
					<MenuIcon fontSize={"small"} />
				</ButtonBase>
				<div className={"text-2xl text-primary self-center flex mx-2"}>
					<DataSaverOffOutlinedIcon
						fontSize={"inherit"}
						className={"self-baseline"}
					/>
				</div>
				<div className={"self-center text-primary text-sm"}>DocDB</div>
				<div className={"ml-auto btn"}>
					<ButtonBase
						className={"w-10 h-full hover:bg-gray-200 transition text-primary"}
						component={"div"}
						onClick={() => appWindow.minimize()}
					>
						<RemoveOutlinedIcon fontSize={"small"} />
					</ButtonBase>
					<ButtonBase
						className={"w-10 h-full hover:bg-gray-200 transition text-primary"}
						component={"div"}
						onClick={() => appWindow.toggleMaximize()}
					>
						{isMaximized ? (
							<CloseFullscreenOutlinedIcon fontSize={"small"} />
						) : (
							<CropSquareOutlinedIcon fontSize={"small"} />
						)}
					</ButtonBase>
					<ButtonBase
						className={
							"w-10 h-full hover:bg-red-600 hover:text-white transition text-primary"
						}
						component={"div"}
						onClick={() => appWindow.close()}
					>
						<CloseOutlinedIcon fontSize={"small"} />
					</ButtonBase>
				</div>
			</Paper>
			<div className={"flex w-full flex-1 overflow-y-auto"}>
				{/* animated.div 能嵌套子元素，但是不知道为什么react-spring的类型声明没有children */}
				{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
				{/* @ts-ignore */}
				<animated.div style={{ ...menuStyles }}>
					<div className={"w-full h-full bg-white1"}>
						{Pages.map((page, index) => (
							<SideMenuItem
								Icon={page.icon}
								title={page.title}
								active={pageStore.now == index}
								onClick={() => {
									pageStore.setNow(index);
								}}
								key={index}
							/>
						))}
					</div>
				</animated.div>
				<div className={"flex-1 bg-background overflow-y-auto p-2"}>
					{Pages.map((page, index) => {
						return (
							<div
								key={index}
								className={classNames(
									{ hidden: pageStore.now != index },
									"min-h-full",
								)}
							>
								<page.content />
							</div>
						);
					})}
				</div>
			</div>
			<DialogBase />
		</div>
	);
}

export default App;
