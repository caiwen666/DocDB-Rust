/**
 * 格式化任意类型为字符串，对象会被转为 JSON 字符串且带缩进。用于把异常信息转为字符串
 * @param v
 */
export const formatToString = (v: unknown) => {
	if (typeof v === "string") return v;
	if (typeof v === "object") return JSON.stringify(v, null, 2);
	return v!.toString();
};

/**
 * 为什么js的async没有sleep？
 * @param ms
 */
export const asyncSleep = (ms: number) => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve("ok");
		}, ms);
	});
};

/**
 * nodejs这种高级语言还是把持不住
 */
export const clone = <T>(obj: T) => {
	return JSON.parse(JSON.stringify(obj)) as T;
};
