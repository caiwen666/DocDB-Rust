import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Divider,
	Switch,
	TextField,
} from "@mui/material";
import { useDialogStore } from "@/stores/dialog";
import UpdateIcon from "@mui/icons-material/Update";
import WaterIcon from "@mui/icons-material/Water";
import DnsIcon from "@mui/icons-material/Dns";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import { useEffect, useRef, useState } from "react";
import { usePageStore } from "@/stores/page";
import { commands } from "@/bindings";
import { Controller, useForm } from "react-hook-form";
import DialogProgressTemplate from "@/components/dialog/DialogCircleProgressTemplate";
import { unwrap } from "@/utils/result";
import DialogErrorTemplate from "@/components/dialog/DialogErrorTemplate";
import DialogBarProgressTemplate from "@/components/dialog/DialogBarProgressTemplate";

interface ServerInfoForm {
	remote: string;
	token: string;
}

export default function Setting() {
	const pushDialog = useDialogStore((state) => state.push);
	const pushWaitingDialog = useDialogStore((state) => state.pushWaitingDialog);
	const closeWaitingDialog = useDialogStore(
		(state) => state.closeWaitingDialog,
	);

	const [enableWatermark, setEnableWatermark] = useState(false);
	const enableWatermarkRef = useRef(enableWatermark);
	const toggleEnableWatermark = async () => {
		enableWatermarkRef.current = !enableWatermarkRef.current;
		setEnableWatermark(enableWatermarkRef.current);
		console.log("enableWatermark", enableWatermarkRef.current);
		await commands.setWatermark(enableWatermarkRef.current);
	};
	const [showEditServerInfoDialog, setShowEditServerInfoDialog] =
		useState(false);
	const {
		control,
		trigger,
		getValues,
		setValue,
		formState: { errors },
	} = useForm<ServerInfoForm>({ mode: "onChange" });
	const handleDatabaseUpdate = async () => {
		pushWaitingDialog({
			title: "更新索引",
			content: (
				<DialogContent>
					<DialogProgressTemplate info={"正在更新索引..."} ok={-1} total={-1} />
				</DialogContent>
			),
		});
		try {
			unwrap(await commands.updateDatabase());
			closeWaitingDialog();
			pushDialog({
				title: "成功",
				content: (
					<DialogContent>
						<DialogContentText>已更新到最新版本！</DialogContentText>
					</DialogContent>
				),
			});
		} catch (e) {
			closeWaitingDialog();
			pushDialog({
				title: "错误",
				content: (
					<DialogContent>
						<DialogErrorTemplate info={"更新索引时出错"} error={e} />
					</DialogContent>
				),
			});
		}
	};
	const handleHotCache = async () => {
		pushWaitingDialog({
			title: "缓存预热",
			content: (
				<DialogContent>
					<DialogBarProgressTemplate info={"正在缓存预热..."} />
				</DialogContent>
			),
		});
		try {
			unwrap(await commands.hotCache());
			closeWaitingDialog();
			pushDialog({
				title: "成功",
				content: (
					<DialogContent>
						<DialogContentText>缓存预热完成！</DialogContentText>
					</DialogContent>
				),
			});
		} catch (e) {
			closeWaitingDialog();
			pushDialog({
				title: "错误",
				content: (
					<DialogContent>
						<DialogErrorTemplate info={"缓存预热时出错"} error={e} />
					</DialogContent>
				),
			});
		}
	};
	useEffect(() => {
		usePageStore.subscribe(async (pageStore) => {
			if (pageStore.now != 4) return;
			enableWatermarkRef.current = await commands.getWatermark();
			setEnableWatermark(enableWatermarkRef.current);
		});
	}, []);
	return (
		<div>
			<div className={"rounded overflow-hidden"}>
				<div className={"p-2 bg-white flex items-center"}>
					<UpdateIcon className={"text-primary ml-1.5"} />
					<div className={"ml-3.5"}>
						<div className={"text-sm"}>更新索引</div>
						<div className={"text-xs"}>立即更新本地索引，与远程数据库同步</div>
					</div>
					<div className={"ml-auto"}>
						<Button onClick={handleDatabaseUpdate}>执行</Button>
					</div>
				</div>
				<Divider />
				<div className={"p-2 bg-white flex items-center"}>
					<LocalFireDepartmentIcon className={"text-primary ml-1.5"} />
					<div className={"ml-3.5"}>
						<div className={"text-sm"}>缓存预热</div>
						<div className={"text-xs"}>
							将试卷的文件全部下载到本地，以减少后续文件下载的时间
						</div>
					</div>
					<div className={"ml-auto"}>
						<Button onClick={handleHotCache}>执行</Button>
					</div>
				</div>
				<Divider />
				<div className={"p-2 bg-white flex items-center"}>
					<AccountTreeIcon className={"text-primary ml-1.5"} />
					<div className={"ml-3.5"}>
						<div className={"text-sm"}>导出目录结构</div>
						<div className={"text-xs"}>
							将数据库的数据以目录的形式导出到本地
						</div>
					</div>
					<div className={"ml-auto"}>
						<Button>执行</Button>
					</div>
				</div>
			</div>
			<div className={"rounded overflow-hidden mt-2"}>
				<div className={"p-2 bg-white flex items-center"}>
					<DnsIcon className={"text-primary ml-1.5"} />
					<div className={"ml-3.5"}>
						<div className={"text-sm"}>服务器信息</div>
						<div className={"text-xs"}>设置远程服务器地址和token</div>
					</div>
					<div className={"ml-auto"}>
						<Button
							onClick={async () => {
								const [remote, token] = await commands.getServerInfo();
								setValue("remote", remote, { shouldValidate: true });
								setValue("token", token, { shouldValidate: true });
								setShowEditServerInfoDialog(true);
							}}
						>
							编辑
						</Button>
					</div>
				</div>
				<Divider />
				<div className={"p-2 bg-white flex items-center"}>
					<WaterIcon className={"text-primary ml-1.5"} />
					<div className={"ml-3.5"}>
						<div className={"text-sm"}>添加水印</div>
						<div className={"text-xs"}>是否在取回的试卷的中间添加水印</div>
					</div>
					<div className={"ml-auto"}>
						<Switch
							checked={enableWatermark}
							onClick={toggleEnableWatermark}
						></Switch>
					</div>
				</div>
			</div>
			<Dialog open={showEditServerInfoDialog} fullWidth maxWidth="xs">
				<DialogTitle>编辑服务器信息</DialogTitle>
				<DialogContent>
					<div>
						<Controller
							name="remote"
							control={control}
							rules={{ required: "服务器地址不能为空" }}
							render={({ field }) => (
								<TextField
									{...field}
									label="服务器地址"
									error={!!errors.remote}
									helperText={
										errors.remote?.message
											? errors.remote.message
											: "末尾不带斜杠"
									}
									variant="standard"
									fullWidth
								/>
							)}
						></Controller>
					</div>
					<div className={"mt-4"}>
						<Controller
							name="token"
							control={control}
							rules={{ required: "token不能为空" }}
							render={({ field }) => (
								<TextField
									{...field}
									label="token"
									error={!!errors.token}
									helperText={errors.token?.message}
									variant="standard"
									fullWidth
								/>
							)}
						/>
					</div>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setShowEditServerInfoDialog(false)}>
						取消
					</Button>
					<Button
						onClick={async () => {
							const isValid = await trigger();
							if (!isValid) return;
							const values = getValues();
							await commands.setServerInfo(values.remote, values.token);
							setShowEditServerInfoDialog(false);
						}}
					>
						应用
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}
