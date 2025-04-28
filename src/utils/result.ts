import { Result } from "../bindings.ts";

export const unwrap = <T, E>(r: Result<T, E>): T => {
	if (r.status == "ok") return r.data;
	throw r.error;
};
