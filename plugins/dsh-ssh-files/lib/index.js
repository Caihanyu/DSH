import { runNativeCommand } from "@deepseek-ai/dsh-native-command";
import { mkdir, readFile, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Client } from "ssh2";
import { randomUUID } from "node:crypto";
import { dshHomePath } from "@deepseek-ai/dsh-home-paths";
import { defineTool } from "@deepseek-ai/dsh-tools";
//#region ../../../vendor/cosmokit/lib/index.js
/** Return true when a value is `null` or `undefined`. */
function isNullable(value) {
	return value === null || value === void 0;
}
/** Return true for non-array object values. */
function isPlainObject(data) {
	return data && typeof data === "object" && !Array.isArray(data);
}
/** Filter object entries and return a new object. */
function filterKeys(object, filter) {
	return Object.fromEntries(Object.entries(object).filter(([key, value]) => filter(key, value)));
}
/** Map object values while preserving the original key set. */
function mapValues(object, transform) {
	return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, transform(value, key)]));
}
/** Pick selected keys from an object, optionally including `undefined` values. */
function pick(source, keys, forced) {
	if (!keys) return { ...source };
	const result = {};
	for (const key of keys) if (forced || source[key] !== void 0) result[key] = source[key];
	return result;
}
/** Test values using `instanceof` with a `toStringTag` fallback. */
function is(type, value) {
	if (arguments.length === 1) return (value) => is(type, value);
	return type in globalThis && value instanceof globalThis[type] || Object.prototype.toString.call(value).slice(8, -1) === type;
}
function isArrayBufferLike(value) {
	return is("ArrayBuffer", value) || is("SharedArrayBuffer", value);
}
function isArrayBufferSource(value) {
	return isArrayBufferLike(value) || ArrayBuffer.isView(value);
}
/** Binary source detection and base64/hex conversion helpers. */
var Binary;
(function(Binary) {
	Binary.is = isArrayBufferLike;
	Binary.isSource = isArrayBufferSource;
	function fromSource(source) {
		if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
		else return source;
	}
	Binary.fromSource = fromSource;
	function toBase64(source) {
		source = fromSource(source);
		if (typeof Buffer !== "undefined") return Buffer.from(source).toString("base64");
		let binary = "";
		const bytes = new Uint8Array(source);
		for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
		return btoa(binary);
	}
	Binary.toBase64 = toBase64;
	function fromBase64(source) {
		if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "base64"));
		return Uint8Array.from(atob(source), (c) => c.charCodeAt(0));
	}
	Binary.fromBase64 = fromBase64;
	function toHex(source) {
		source = fromSource(source);
		if (typeof Buffer !== "undefined") return Buffer.from(source).toString("hex");
		return Array.from(new Uint8Array(source), (byte) => byte.toString(16).padStart(2, "0")).join("");
	}
	Binary.toHex = toHex;
	function fromHex(source) {
		if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "hex"));
		const hex = source.length % 2 === 0 ? source : source.slice(0, source.length - 1);
		const buffer = [];
		for (let i = 0; i < hex.length; i += 2) buffer.push(parseInt(`${hex[i]}${hex[i + 1]}`, 16));
		return Uint8Array.from(buffer).buffer;
	}
	Binary.fromHex = fromHex;
})(Binary || (Binary = {}));
Binary.fromBase64;
Binary.toBase64;
Binary.fromHex;
Binary.toHex;
/** Deep-clone common JavaScript values while preserving prototypes and cycles. */
function clone(source, refs = /* @__PURE__ */ new Map()) {
	if (!source || typeof source !== "object") return source;
	if (is("Date", source)) return new Date(source.valueOf());
	if (is("RegExp", source)) return new RegExp(source.source, source.flags);
	if (isArrayBufferLike(source)) return source.slice(0);
	if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
	const cached = refs.get(source);
	if (cached) return cached;
	if (Array.isArray(source)) {
		const result = [];
		refs.set(source, result);
		source.forEach((value, index) => {
			result[index] = Reflect.apply(clone, null, [value, refs]);
		});
		return result;
	}
	const result = Object.create(Object.getPrototypeOf(source));
	refs.set(source, result);
	for (const key of Reflect.ownKeys(source)) {
		const descriptor = { ...Reflect.getOwnPropertyDescriptor(source, key) };
		if ("value" in descriptor) descriptor.value = Reflect.apply(clone, null, [descriptor.value, refs]);
		Reflect.defineProperty(result, key, descriptor);
	}
	return result;
}
/** Deeply compare arrays, dates, regexps, buffers, and plain object fields. */
function deepEqual(a, b, strict) {
	if (a === b) return true;
	if (!strict && isNullable(a) && isNullable(b)) return true;
	if (typeof a !== typeof b) return false;
	if (typeof a !== "object") return false;
	if (!a || !b) return false;
	function check(test, then) {
		return test(a) ? test(b) ? then(a, b) : false : test(b) ? false : void 0;
	}
	return check(Array.isArray, (a, b) => a.length === b.length && a.every((item, index) => deepEqual(item, b[index]))) ?? check(is("Date"), (a, b) => a.valueOf() === b.valueOf()) ?? check(is("RegExp"), (a, b) => a.source === b.source && a.flags === b.flags) ?? check(isArrayBufferLike, (a, b) => {
		if (a.byteLength !== b.byteLength) return false;
		const viewA = new Uint8Array(a);
		const viewB = new Uint8Array(b);
		for (let i = 0; i < viewA.length; i++) if (viewA[i] !== viewB[i]) return false;
		return true;
	}) ?? Object.keys({
		...a,
		...b
	}).every((key) => deepEqual(a[key], b[key], strict));
}
/** Time constants plus parsing and formatting helpers. */
var Time;
(function(Time) {
	Time.millisecond = 1;
	Time.second = 1e3;
	Time.minute = Time.second * 60;
	Time.hour = Time.minute * 60;
	Time.day = Time.hour * 24;
	Time.week = Time.day * 7;
	let timezoneOffset = (/* @__PURE__ */ new Date()).getTimezoneOffset();
	function setTimezoneOffset(offset) {
		timezoneOffset = offset;
	}
	Time.setTimezoneOffset = setTimezoneOffset;
	function getTimezoneOffset() {
		return timezoneOffset;
	}
	Time.getTimezoneOffset = getTimezoneOffset;
	function getDateNumber(date = /* @__PURE__ */ new Date(), offset) {
		if (typeof date === "number") date = new Date(date);
		if (offset === void 0) offset = timezoneOffset;
		return Math.floor((date.valueOf() / Time.minute - offset) / 1440);
	}
	Time.getDateNumber = getDateNumber;
	function fromDateNumber(value, offset) {
		const date = new Date(value * Time.day);
		if (offset === void 0) offset = timezoneOffset;
		return new Date(+date + offset * Time.minute);
	}
	Time.fromDateNumber = fromDateNumber;
	const numeric = /\d+(?:\.\d+)?/.source;
	const timeRegExp = new RegExp(`^${[
		"w(?:eek(?:s)?)?",
		"d(?:ay(?:s)?)?",
		"h(?:our(?:s)?)?",
		"m(?:in(?:ute)?(?:s)?)?",
		"s(?:ec(?:ond)?(?:s)?)?"
	].map((unit) => `(${numeric}${unit})?`).join("")}$`);
	function parseTime(source) {
		const capture = timeRegExp.exec(source);
		if (!capture) return 0;
		return (parseFloat(capture[1]) * Time.week || 0) + (parseFloat(capture[2]) * Time.day || 0) + (parseFloat(capture[3]) * Time.hour || 0) + (parseFloat(capture[4]) * Time.minute || 0) + (parseFloat(capture[5]) * Time.second || 0);
	}
	Time.parseTime = parseTime;
	function parseDate(date) {
		const parsed = parseTime(date);
		if (parsed) date = Date.now() + parsed;
		else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(date)) date = `${(/* @__PURE__ */ new Date()).toLocaleDateString()}-${date}`;
		else if (/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(date)) date = `${(/* @__PURE__ */ new Date()).getFullYear()}-${date}`;
		return date ? new Date(date) : /* @__PURE__ */ new Date();
	}
	Time.parseDate = parseDate;
	function format(ms) {
		const abs = Math.abs(ms);
		if (abs >= Time.day - Time.hour / 2) return Math.round(ms / Time.day) + "d";
		else if (abs >= Time.hour - Time.minute / 2) return Math.round(ms / Time.hour) + "h";
		else if (abs >= Time.minute - Time.second / 2) return Math.round(ms / Time.minute) + "m";
		else if (abs >= Time.second) return Math.round(ms / Time.second) + "s";
		return ms + "ms";
	}
	Time.format = format;
	function toDigits(source, length = 2) {
		return source.toString().padStart(length, "0");
	}
	Time.toDigits = toDigits;
	function template(template, time = /* @__PURE__ */ new Date()) {
		return template.replace("yyyy", time.getFullYear().toString()).replace("yy", time.getFullYear().toString().slice(2)).replace("MM", toDigits(time.getMonth() + 1)).replace("dd", toDigits(time.getDate())).replace("hh", toDigits(time.getHours())).replace("mm", toDigits(time.getMinutes())).replace("ss", toDigits(time.getSeconds())).replace("SSS", toDigits(time.getMilliseconds(), 3));
	}
	Time.template = template;
})(Time || (Time = {}));
//#endregion
//#region ../../../vendor/schemastery/lib/index.mjs
const kSchema = Symbol.for("schemastery");
const kValidationError = Symbol.for("ValidationError");
globalThis.__schemastery_index__ ??= 0;
globalThis.__schemastery_refs__ = void 0;
var ValidationError = class extends TypeError {
	options;
	name = "ValidationError";
	constructor(message, options) {
		let prefix = "$";
		for (const segment of options.path || []) if (typeof segment === "string") prefix += "." + segment;
		else if (typeof segment === "number") prefix += "[" + segment + "]";
		else if (typeof segment === "symbol") prefix += `[Symbol(${segment.toString()})]`;
		if (prefix.startsWith(".")) prefix = prefix.slice(1);
		super((prefix === "$" ? "" : `${prefix} `) + message);
		this.options = options;
	}
	static is(error) {
		return !!error?.[kValidationError];
	}
};
Object.defineProperty(ValidationError.prototype, kValidationError, { value: true });
const Schema = function(options) {
	const schema = function(data, options = {}) {
		return Schema.resolve(data, schema, options)[0];
	};
	if (options.refs) {
		const refs = mapValues(options.refs, (options) => new Schema(options));
		const getRef = (uid) => refs[uid];
		for (const key in refs) {
			const options = refs[key];
			options.sKey = getRef(options.sKey);
			options.inner = getRef(options.inner);
			options.list = options.list && options.list.map(getRef);
			options.dict = options.dict && mapValues(options.dict, getRef);
		}
		return refs[options.uid];
	}
	Object.assign(schema, options);
	if (typeof schema.callback === "string") try {
		schema.callback = new Function("return " + schema.callback)();
	} catch {}
	Object.defineProperty(schema, "uid", { value: globalThis.__schemastery_index__++ });
	Object.setPrototypeOf(schema, Schema.prototype);
	schema.meta ||= {};
	schema.toString = schema.toString.bind(schema);
	return schema;
};
Schema.prototype = Object.create(Function.prototype);
Schema.prototype[kSchema] = true;
Object.defineProperty(Schema.prototype, "~standard", { get() {
	return {
		version: 1,
		vendor: "schemastery",
		validate: (value) => {
			try {
				return { value: Schema.resolve(value, this, {})[0] };
			} catch (error) {
				if (ValidationError.is(error)) return { issues: [{
					message: error.message,
					path: error.options.path
				}] };
				throw error;
			}
		}
	};
} });
Schema.ValidationError = ValidationError;
Schema.prototype.toJSON = function toJSON() {
	if (globalThis.__schemastery_refs__) {
		globalThis.__schemastery_refs__[this.uid] ??= JSON.parse(JSON.stringify({ ...this }));
		return this.uid;
	}
	globalThis.__schemastery_refs__ = { [this.uid]: { ...this } };
	globalThis.__schemastery_refs__[this.uid] = JSON.parse(JSON.stringify({ ...this }));
	const result = {
		uid: this.uid,
		refs: globalThis.__schemastery_refs__
	};
	globalThis.__schemastery_refs__ = void 0;
	return result;
};
Schema.prototype.set = function set(key, value) {
	this.dict[key] = value;
	return this;
};
Schema.prototype.push = function push(value) {
	this.list.push(value);
	return this;
};
function mergeDesc(original, messages) {
	const result = typeof original === "string" ? { "": original } : { ...original };
	for (const locale in messages) {
		const value = messages[locale];
		if (value?.$description || value?.$desc) result[locale] = value.$description || value.$desc;
		else if (typeof value === "string") result[locale] = value;
	}
	return result;
}
function getInner(value) {
	return value?.$value ?? value?.$inner;
}
function extractKeys(data) {
	return filterKeys(data ?? {}, (key) => !key.startsWith("$"));
}
Schema.prototype.i18n = function i18n(messages) {
	const schema = Schema(this);
	const desc = mergeDesc(schema.meta.description, messages);
	if (Object.keys(desc).length) schema.meta.description = desc;
	if (schema.dict) schema.dict = mapValues(schema.dict, (inner, key) => {
		return inner.i18n(mapValues(messages, (data) => getInner(data)?.[key] ?? data?.[key]));
	});
	if (schema.list) schema.list = schema.list.map((inner, index) => {
		return inner.i18n(mapValues(messages, (data = {}) => {
			if (Array.isArray(getInner(data))) return getInner(data)[index];
			if (Array.isArray(data)) return data[index];
			return extractKeys(data);
		}));
	});
	if (schema.inner) schema.inner = schema.inner.i18n(mapValues(messages, (data) => {
		if (getInner(data)) return getInner(data);
		return extractKeys(data);
	}));
	if (schema.sKey) schema.sKey = schema.sKey.i18n(mapValues(messages, (data) => data?.$key));
	return schema;
};
Schema.prototype.extra = function extra(key, value) {
	const schema = Schema(this);
	schema.meta = {
		...schema.meta,
		[key]: value
	};
	return schema;
};
for (const key of [
	"required",
	"disabled",
	"collapse",
	"hidden",
	"loose"
]) Object.assign(Schema.prototype, { [key](value = true) {
	const schema = Schema(this);
	schema.meta = {
		...schema.meta,
		[key]: value
	};
	return schema;
} });
Schema.prototype.deprecated = function deprecated() {
	const schema = Schema(this);
	schema.meta.badges ||= [];
	schema.meta.badges.push({
		text: "deprecated",
		type: "danger"
	});
	return schema;
};
Schema.prototype.experimental = function experimental() {
	const schema = Schema(this);
	schema.meta.badges ||= [];
	schema.meta.badges.push({
		text: "experimental",
		type: "warning"
	});
	return schema;
};
Schema.prototype.pattern = function pattern(regexp) {
	const schema = Schema(this);
	const pattern = pick(regexp, ["source", "flags"]);
	schema.meta = {
		...schema.meta,
		pattern
	};
	return schema;
};
Schema.prototype.simplify = function simplify(value) {
	if (deepEqual(value, this.meta.default, this.type === "dict")) return null;
	if (isNullable(value)) return value;
	if (this.type === "object" || this.type === "dict") {
		const result = {};
		for (const key in value) {
			const item = (this.type === "object" ? this.dict[key] : this.inner)?.simplify(value[key]);
			if (this.type === "dict" || !isNullable(item)) result[key] = item;
		}
		if (deepEqual(result, this.meta.default, this.type === "dict")) return null;
		return result;
	} else if (this.type === "array" || this.type === "tuple") {
		const result = [];
		value.forEach((value, index) => {
			const schema = this.type === "array" ? this.inner : this.list[index];
			const item = schema ? schema.simplify(value) : value;
			result.push(item);
		});
		return result;
	} else if (this.type === "intersect") {
		const result = {};
		for (const item of this.list) Object.assign(result, item.simplify(value));
		return result;
	} else if (this.type === "union") for (const schema of this.list) try {
		Schema.resolve(value, schema, {});
		return schema.simplify(value);
	} catch {}
	return value;
};
Schema.prototype.toString = function toString(inline) {
	return formatters[this.type]?.(this, inline) ?? `Schema<${this.type}>`;
};
Schema.prototype.role = function role(role, extra) {
	const schema = Schema(this);
	schema.meta = {
		...schema.meta,
		role,
		extra
	};
	return schema;
};
for (const key of [
	"default",
	"link",
	"comment",
	"description",
	"max",
	"min",
	"step"
]) Object.assign(Schema.prototype, { [key](value) {
	const schema = Schema(this);
	schema.meta = {
		...schema.meta,
		[key]: value
	};
	return schema;
} });
const resolvers = {};
Schema.extend = function extend(type, resolve) {
	resolvers[type] = resolve;
};
Schema.resolve = function resolve(data, schema, options = {}, strict = false) {
	if (!schema) return [data];
	if (options.ignore?.(data, schema)) return [data];
	if (isNullable(data) && schema.type !== "lazy") {
		if (schema.meta.required) throw new ValidationError(`missing required value`, options);
		let current = schema;
		let fallback = schema.meta.default;
		while (current?.type === "intersect" && isNullable(fallback)) {
			current = current.list[0];
			fallback = current?.meta.default;
		}
		if (isNullable(fallback)) return [data];
		data = clone(fallback);
	}
	const callback = resolvers[schema.type];
	if (!callback) throw new ValidationError(`unsupported type "${schema.type}"`, options);
	try {
		return callback(data, schema, options, strict);
	} catch (error) {
		if (!schema.meta.loose) throw error;
		return [schema.meta.default];
	}
};
Schema.from = function from(source) {
	if (isNullable(source)) return Schema.any();
	else if ([
		"string",
		"number",
		"boolean"
	].includes(typeof source)) return Schema.const(source).required();
	else if (source[kSchema]) return source;
	else if (typeof source === "function") switch (source) {
		case String: return Schema.string().required();
		case Number: return Schema.number().required();
		case Boolean: return Schema.boolean().required();
		case Function: return Schema.function().required();
		default: return Schema.is(source).required();
	}
	else throw new TypeError(`cannot infer schema from ${source}`);
};
Schema.lazy = function lazy(builder) {
	const toJSON = () => {
		if (!schema.inner[kSchema]) {
			schema.inner = schema.builder();
			schema.inner.meta = {
				...schema.meta,
				...schema.inner.meta
			};
		}
		return schema.inner.toJSON();
	};
	const schema = new Schema({
		type: "lazy",
		builder,
		inner: { toJSON }
	});
	return schema;
};
Schema.natural = function natural() {
	return Schema.number().step(1).min(0);
};
Schema.percent = function percent() {
	return Schema.number().step(.01).min(0).max(1).role("slider");
};
Schema.date = function date() {
	return Schema.union([Schema.is(Date), Schema.transform(Schema.string().role("datetime"), (value, options) => {
		const date = new Date(value);
		if (isNaN(+date)) throw new ValidationError(`invalid date "${value}"`, options);
		return date;
	}, true)]);
};
Schema.regExp = function regExp(flag = "") {
	return Schema.union([Schema.is(RegExp), Schema.transform(Schema.string().role("regexp", { flag }), (value, options) => {
		try {
			return new RegExp(value, flag);
		} catch (e) {
			throw new ValidationError(e.message, options);
		}
	}, true)]);
};
Schema.arrayBuffer = function arrayBuffer(encoding) {
	return Schema.union([
		Schema.is(ArrayBuffer),
		Schema.is(SharedArrayBuffer),
		Schema.transform(Schema.any(), (value, options) => {
			if (Binary.isSource(value)) return Binary.fromSource(value);
			throw new ValidationError(`expected ArrayBufferSource but got ${value}`, options);
		}, true),
		...encoding ? [Schema.transform(Schema.string(), (value, options) => {
			try {
				return encoding === "base64" ? Binary.fromBase64(value) : Binary.fromHex(value);
			} catch (e) {
				throw new ValidationError(e.message, options);
			}
		}, true)] : []
	]);
};
Schema.extend("lazy", (data, schema, options, strict) => {
	if (!schema.inner[kSchema]) {
		schema.inner = schema.builder();
		schema.inner.meta = {
			...schema.meta,
			...schema.inner.meta
		};
	}
	return Schema.resolve(data, schema.inner, options, strict);
});
Schema.extend("any", (data) => {
	return [data];
});
Schema.extend("never", (data, _, options) => {
	throw new ValidationError(`expected nullable but got ${data}`, options);
});
Schema.extend("const", (data, { value }, options) => {
	if (deepEqual(data, value)) return [value];
	throw new ValidationError(`expected ${value} but got ${data}`, options);
});
function checkWithinRange(data, meta, description, options, skipMin = false) {
	const { max = Infinity, min = -Infinity } = meta;
	if (data > max) throw new ValidationError(`expected ${description} <= ${max} but got ${data}`, options);
	if (data < min && !skipMin) throw new ValidationError(`expected ${description} >= ${min} but got ${data}`, options);
}
Schema.extend("string", (data, { meta }, options) => {
	if (typeof data !== "string") throw new ValidationError(`expected string but got ${data}`, options);
	if (meta.pattern) {
		const regexp = new RegExp(meta.pattern.source, meta.pattern.flags);
		if (!regexp.test(data)) throw new ValidationError(`expect string to match regexp ${regexp}`, options);
	}
	checkWithinRange(data.length, meta, "string length", options);
	return [data];
});
function decimalShift(data, digits) {
	const str = data.toString();
	if (str.includes("e")) return data * Math.pow(10, digits);
	const index = str.indexOf(".");
	if (index === -1) return data * Math.pow(10, digits);
	const frac = str.slice(index + 1);
	const integer = str.slice(0, index);
	if (frac.length <= digits) return +(integer + frac.padEnd(digits, "0"));
	return +(integer + frac.slice(0, digits) + "." + frac.slice(digits));
}
function isMultipleOf(data, min, step) {
	step = Math.abs(step);
	if (!/^\d+\.\d+$/.test(step.toString())) return (data - min) % step === 0;
	const index = step.toString().indexOf(".");
	const digits = step.toString().slice(index + 1).length;
	return Math.abs(decimalShift(data, digits) - decimalShift(min, digits)) % decimalShift(step, digits) === 0;
}
Schema.extend("number", (data, { meta }, options) => {
	if (typeof data !== "number") throw new ValidationError(`expected number but got ${data}`, options);
	checkWithinRange(data, meta, "number", options);
	const { step } = meta;
	if (step && !isMultipleOf(data, meta.min ?? 0, step)) throw new ValidationError(`expected number multiple of ${step} but got ${data}`, options);
	return [data];
});
Schema.extend("boolean", (data, _, options) => {
	if (typeof data === "boolean") return [data];
	throw new ValidationError(`expected boolean but got ${data}`, options);
});
Schema.extend("bitset", (data, { bits, meta }, options) => {
	let value = 0, keys = [];
	if (typeof data === "number") {
		value = data;
		for (const key in bits) if (data & bits[key]) keys.push(key);
	} else if (Array.isArray(data)) {
		keys = data;
		for (const key of keys) {
			if (typeof key !== "string") throw new ValidationError(`expected string but got ${key}`, options);
			if (key in bits) value |= bits[key];
		}
	} else throw new ValidationError(`expected number or array but got ${data}`, options);
	if (value === meta.default) return [value];
	return [value, keys];
});
Schema.extend("function", (data, _, options) => {
	if (typeof data === "function") return [data];
	throw new ValidationError(`expected function but got ${data}`, options);
});
Schema.extend("is", (data, { constructor }, options) => {
	if (typeof constructor === "function") {
		if (data instanceof constructor) return [data];
		throw new ValidationError(`expected ${constructor.name} but got ${data}`, options);
	} else {
		if (isNullable(data)) throw new ValidationError(`expected ${constructor} but got ${data}`, options);
		let prototype = Object.getPrototypeOf(data);
		while (prototype) {
			if (prototype.constructor?.name === constructor) return [data];
			prototype = Object.getPrototypeOf(prototype);
		}
		throw new ValidationError(`expected ${constructor} but got ${data}`, options);
	}
});
function property(data, key, schema, options) {
	try {
		const [value, adapted] = Schema.resolve(data[key], schema, {
			...options,
			path: [...options.path || [], key]
		});
		if (adapted !== void 0) data[key] = adapted;
		return value;
	} catch (e) {
		if (!options?.autofix) throw e;
		delete data[key];
		return schema.meta.default;
	}
}
Schema.extend("array", (data, { inner, meta }, options) => {
	if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
	checkWithinRange(data.length, meta, "array length", options, !isNullable(inner.meta.default));
	return [data.map((_, index) => property(data, index, inner, options))];
});
Schema.extend("dict", (data, { inner, sKey }, options, strict) => {
	if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
	const result = {};
	for (const key in data) {
		let rKey;
		try {
			rKey = Schema.resolve(key, sKey, options)[0];
		} catch (error) {
			if (strict) continue;
			throw error;
		}
		result[rKey] = property(data, key, inner, options);
		data[rKey] = data[key];
		if (key !== rKey) delete data[key];
	}
	return [result];
});
Schema.extend("tuple", (data, { list }, options, strict) => {
	if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
	const result = list.map((inner, index) => property(data, index, inner, options));
	if (strict) return [result];
	result.push(...data.slice(list.length));
	return [result];
});
function merge(result, data) {
	for (const key in data) {
		if (key in result) continue;
		result[key] = data[key];
	}
}
Schema.extend("object", (data, { dict }, options, strict) => {
	if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
	const result = {};
	for (const key in dict) {
		const value = property(data, key, dict[key], options);
		if (!isNullable(value) || key in data) result[key] = value;
	}
	if (!strict) merge(result, data);
	return [result];
});
Schema.extend("union", (data, { list, toString }, options, strict) => {
	const messages = [];
	for (const inner of list) try {
		return Schema.resolve(data, inner, options, strict);
	} catch (error) {
		messages.push(error);
	}
	throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
});
Schema.extend("intersect", (data, { list, toString }, options, strict) => {
	if (!list.length) return [data];
	let result;
	for (const inner of list) {
		const value = Schema.resolve(data, inner, options, true)[0];
		if (isNullable(value)) continue;
		if (isNullable(result)) result = value;
		else if (typeof result !== typeof value) throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
		else if (typeof value === "object") merge(result ??= {}, value);
		else if (result !== value) throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
	}
	if (!strict && isPlainObject(data)) merge(result, data);
	return [result];
});
Schema.extend("transform", (data, { inner, callback, preserve }, options) => {
	const [result, adapted = data] = Schema.resolve(data, inner, options, true);
	if (preserve) return [callback(result)];
	else return [callback(result), callback(adapted)];
});
const formatters = {};
function defineMethod(name, keys, format) {
	formatters[name] = format;
	Object.assign(Schema, { [name](...args) {
		const schema = new Schema({ type: name });
		keys.forEach((key, index) => {
			switch (key) {
				case "sKey":
					schema.sKey = args[index] ?? Schema.string();
					break;
				case "inner":
					schema.inner = Schema.from(args[index]);
					break;
				case "list":
					schema.list = args[index].map(Schema.from);
					break;
				case "dict":
					schema.dict = mapValues(args[index], Schema.from);
					break;
				case "bits":
					schema.bits = {};
					for (const key in args[index]) {
						if (typeof args[index][key] !== "number") continue;
						schema.bits[key] = args[index][key];
					}
					break;
				case "callback": {
					const callback = schema.callback = args[index];
					callback["toJSON"] ||= () => callback.toString();
					break;
				}
				case "constructor": {
					const constructor = schema.constructor = args[index];
					if (typeof constructor === "function") constructor["toJSON"] ||= () => constructor["name"];
					break;
				}
				default: schema[key] = args[index];
			}
		});
		if (name === "object" || name === "dict") schema.meta.default = {};
		else if (name === "array" || name === "tuple") schema.meta.default = [];
		else if (name === "bitset") schema.meta.default = 0;
		return schema;
	} });
}
defineMethod("is", ["constructor"], ({ constructor }) => {
	if (typeof constructor === "function") return constructor.name;
	else return constructor;
});
defineMethod("any", [], () => "any");
defineMethod("never", [], () => "never");
defineMethod("const", ["value"], ({ value }) => typeof value === "string" ? JSON.stringify(value) : value);
defineMethod("string", [], () => "string");
defineMethod("number", [], () => "number");
defineMethod("boolean", [], () => "boolean");
defineMethod("bitset", ["bits"], () => "bitset");
defineMethod("function", [], () => "function");
defineMethod("array", ["inner"], ({ inner }) => `${inner.toString(true)}[]`);
defineMethod("dict", ["inner", "sKey"], ({ inner, sKey }) => `{ [key: ${sKey.toString()}]: ${inner.toString()} }`);
defineMethod("tuple", ["list"], ({ list }) => `[${list.map((inner) => inner.toString()).join(", ")}]`);
defineMethod("object", ["dict"], ({ dict }) => {
	if (Object.keys(dict).length === 0) return "{}";
	return `{ ${Object.entries(dict).map(([key, inner]) => {
		return `${key}${inner.meta.required ? "" : "?"}: ${inner.toString()}`;
	}).join(", ")} }`;
});
defineMethod("union", ["list"], ({ list }, inline) => {
	const result = list.map(({ toString: format }) => format()).join(" | ");
	return inline ? `(${result})` : result;
});
defineMethod("intersect", ["list"], ({ list }) => {
	return `${list.map((inner) => inner.toString(true)).join(" & ")}`;
});
defineMethod("transform", [
	"inner",
	"callback",
	"preserve"
], ({ inner }, isInner) => inner.toString(isInner));
//#endregion
//#region lib/types/ssh.js
/**
* The SSH connection manager: one live ssh2 client with its SFTP channel at a
* time, plus the remote file operations (list/read/write/mkdir/unlink) the
* panel's file tree and editor use. Authentication follows the saved server
* record: password, private key file, or the platform SSH agent.
* @module @deepseek-ai/dsh-ssh-files/ssh
*/
/** One ssh2 SFTP method invoked with its trailing callback, as a promise.
*  The `any[]` parameter and spread are required because ssh2's callback
*  overloads are not assignable to a precise generic signature; the runtime
*  call site is the only place argument arity is enforced. */
function sftpCall(fn, ...args) {
	return new Promise((resolve, reject) => {
		fn(...args, (error, value) => {
			if (error) reject(error);
			else resolve(value);
		});
	});
}
/** Join a remote directory and a base name with the POSIX separator (SFTP
*  paths are always `/`-separated, never platform `node:path` separators). */
function joinRemote(dir, name) {
	return dir.endsWith("/") ? dir + name : `${dir}/${name}`;
}
/** Single-quote a POSIX shell word (the remote server's login shell parses it). */
function posixQuote(value) {
	return `'${value.replace(/'/g, `'\\''`)}'`;
}
/** Cap a captured command stream; a `…` suffix marks truncation. */
function capOutput(text, maxChars) {
	return text.length > maxChars ? `${text.slice(0, maxChars)}\n… (输出已截断)` : text;
}
/** Translate common ssh2 failure messages into actionable Chinese text. */
function mapSshError(error, server) {
	const message = error instanceof Error ? error.message : String(error);
	const host = `${server.username}@${server.host}:${server.port}`;
	if (/timed out while waiting for handshake|ETIMEDOUT|timeout/i.test(message)) return /* @__PURE__ */ new Error(`连接 ${host} 超时（${message}）`);
	if (/all configured authentication methods failed|authentication failed/i.test(message)) return /* @__PURE__ */ new Error(`认证失败：请检查 ${host} 的用户名、密码或私钥`);
	if (/ECONNREFUSED|Connection refused/i.test(message)) return /* @__PURE__ */ new Error(`连接被拒绝：${host} 的端口可能未开放或服务未启动`);
	if (/ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(message)) return /* @__PURE__ */ new Error(`无法解析主机名：${server.host}`);
	if (/encrypted private key|passphrase/i.test(message)) return /* @__PURE__ */ new Error(`私钥已加密：请使用 ssh-agent 认证或在服务器记录中改用密码认证`);
	if (/no supported authentication methods/i.test(message)) return /* @__PURE__ */ new Error(`服务器不支持该认证方式：请为 ${host} 更换认证方式`);
	return /* @__PURE__ */ new Error(`连接 ${host} 失败：${message}`);
}
/** SFTP error codes we surface with friendlier text. */
const SFTP_ERROR_MESSAGES = {
	NO_SUCH_FILE: "文件或目录不存在",
	PERMISSION_DENIED: "权限不足",
	FAILURE: "操作失败（服务器拒绝）",
	NOT_A_DIRECTORY: "不是目录",
	IS_A_DIRECTORY: "是目录而非文件",
	NO_SUCH_PATH: "路径不存在",
	ALREADY_EXISTS: "已存在同名文件或目录"
};
/** Map an SFTP error to actionable Chinese text. */
function mapSftpError(error) {
	const err = error;
	const code = err?.code;
	const friendly = SFTP_ERROR_MESSAGES[typeof code === "string" ? code : String(code)] ?? SFTP_ERROR_MESSAGES[code?.toString() ?? ""];
	const raw = err?.message !== void 0 && err.message !== "" ? err.message : String(error);
	return /* @__PURE__ */ new Error(friendly !== void 0 ? `${friendly}（${raw}）` : `远程操作失败：${raw}`);
}
/** A bounded SFTP round trip ended by caller cancellation or the op deadline.
*  Tagged so file ops rethrow it verbatim instead of mapping it like a server
*  failure: the connection is already gone by the time it is raised. */
var SftpStallError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "SftpStallError";
	}
};
/**
* The live SSH connection. Owns exactly one ssh2 client + SFTP channel;
* `connect` replaces any previous connection and `disconnect` tears it down.
* All file operations throw when no connection is active.
*/
var SshConnection = class {
	opTimeoutMs;
	client = null;
	sftp = null;
	server = null;
	home = null;
	/**
	* @param opTimeoutMs - deadline for one SFTP round trip. A server that does
	*   not answer within it is disconnected: ssh2 cannot cancel an in-flight
	*   SFTP request, so ending the connection is how the wait ends.
	*/
	constructor(opTimeoutMs = 12e4) {
		this.opTimeoutMs = opTimeoutMs;
	}
	/** Whether an SFTP channel is currently usable. */
	get connected() {
		return this.client !== null && this.sftp !== null;
	}
	/** The server record of the active connection, or null. */
	get activeServer() {
		return this.server;
	}
	/** The resolved login home of the active connection, or null. */
	get activeHome() {
		return this.home;
	}
	/** The active SFTP channel, throwing a clear error when not connected. */
	requireSftp() {
		if (this.sftp === null) throw new Error("尚未连接服务器，请先在面板中选择并连接");
		return this.sftp;
	}
	/**
	* Connect to a server: open the ssh2 client, then its SFTP channel, then
	* resolve the login home. Any prior connection is dropped first.
	* @param server - the server record to connect to.
	* @param timeoutMs - handshake timeout (ssh2 `readyTimeout`).
	* @param signal - abort cancels the attempt.
	* @returns the login home and the effective tree root.
	*/
	async connect(server, timeoutMs, signal) {
		await this.disconnect();
		const client = new Client();
		this.client = client;
		this.server = server;
		try {
			const sftp = await this.openSftp(client, server, timeoutMs, signal);
			this.sftp = sftp;
			let home;
			try {
				home = await this.boundedSftp("解析主目录", signal, () => sftpCall(sftp.realpath.bind(sftp), "."));
			} catch (error) {
				if (error instanceof SftpStallError) throw error;
				home = server.root.trim() !== "" ? server.root : "/";
			}
			this.home = home;
			const root = server.root.trim() !== "" ? server.root : home;
			return {
				home,
				root
			};
		} catch (error) {
			this.client = null;
			this.sftp = null;
			this.server = null;
			this.home = null;
			try {
				client.end();
			} catch {}
			throw error;
		}
	}
	/** Open the ssh2 client and its SFTP channel as one promise. */
	async openSftp(client, server, timeoutMs, signal) {
		let config;
		try {
			config = await this.buildConfig(server, timeoutMs);
		} catch (error) {
			throw mapSshError(error, server);
		}
		return new Promise((resolve, reject) => {
			let settled = false;
			const fail = (error) => {
				if (settled) return;
				settled = true;
				signal.removeEventListener("abort", onAbort);
				reject(error);
			};
			const onAbort = () => {
				fail(/* @__PURE__ */ new Error("连接已取消"));
				try {
					client.end();
				} catch {}
			};
			const onError = (error) => {
				fail(mapSshError(error, server));
			};
			client.once("error", onError);
			client.once("ready", () => {
				client.sftp((error, sftp) => {
					if (error) {
						fail(mapSshError(error, server));
						return;
					}
					if (sftp === void 0) {
						fail(/* @__PURE__ */ new Error("服务器未提供 SFTP 通道"));
						return;
					}
					settled = true;
					signal.removeEventListener("abort", onAbort);
					resolve(sftp);
				});
			});
			client.once("close", () => {
				if (!settled) fail(/* @__PURE__ */ new Error("连接在就绪前被服务器关闭"));
			});
			if (signal.aborted) {
				onAbort();
				return;
			}
			signal.addEventListener("abort", onAbort, { once: true });
			try {
				client.connect(config);
			} catch (error) {
				fail(error instanceof Error ? error : new Error(String(error)));
			}
		});
	}
	/**
	* Build the ssh2 connect config from a server record. `password` and `key`
	* set their ssh2 fields; `agent` (and any record with neither) leaves ssh2
	* to its default authentication order (agent then `~/.ssh` keys).
	*/
	async buildConfig(server, timeoutMs) {
		const config = {
			host: server.host,
			port: server.port,
			username: server.username,
			readyTimeout: timeoutMs,
			keepaliveInterval: 3e4,
			keepaliveCountMax: 3
		};
		if (server.auth === "password" && server.password !== void 0 && server.password !== "") config.password = server.password;
		else if (server.auth === "key" && server.keyPath !== void 0 && server.keyPath !== "") try {
			config.privateKey = await readFile(server.keyPath, "utf8");
		} catch (error) {
			throw new Error(`无法读取私钥文件 ${server.keyPath}：${error.code ?? error}`);
		}
		return config;
	}
	/** Tear down the active connection (no-op when none is active). */
	async disconnect() {
		const client = this.client;
		this.client = null;
		this.home = null;
		this.sftp = null;
		this.server = null;
		if (client === null) return;
		try {
			client.end();
		} catch {}
	}
	/**
	* Run one SFTP request under the op deadline and the caller's abort signal,
	* mapping genuine SFTP failures to friendly text. ssh2 cannot cancel one
	* in-flight request: when the deadline passes or the signal aborts, the
	* whole connection is ended so this request (and any sibling on it) settles
	* instead of hanging — the caller-visible stop path requires the tool body
	* to reach quiescence before the turn can abort.
	* @param what - operation name for the stall message.
	* @param signal - caller cancellation; abort rejects with a stall error.
	* @param start - starts the SFTP request and returns its promise.
	*/
	async boundedSftp(what, signal, start) {
		if (signal?.aborted === true) throw new SftpStallError(`操作已取消（${what}）`);
		return new Promise((resolve, reject) => {
			let settled = false;
			let timer;
			const finish = (error, value) => {
				if (settled) return;
				settled = true;
				if (timer !== void 0) clearTimeout(timer);
				signal?.removeEventListener("abort", onAbort);
				if (error !== null) reject(error);
				else resolve(value);
			};
			const onAbort = () => {
				if (settled) return;
				this.disconnect();
				finish(new SftpStallError(`操作已取消（${what}）`), void 0);
			};
			timer = setTimeout(() => {
				if (settled) return;
				this.disconnect();
				finish(new SftpStallError(`${what}超时：服务器超过 ${this.opTimeoutMs} ms 未响应，连接已断开`), void 0);
			}, this.opTimeoutMs);
			signal?.addEventListener("abort", onAbort, { once: true });
			if (signal?.aborted === true) {
				onAbort();
				return;
			}
			try {
				start().then((value) => finish(null, value), (error) => finish(mapSftpError(error), void 0));
			} catch (error) {
				finish(mapSftpError(error), void 0);
			}
		});
	}
	/** Classify one readdir row: resolve symlinks so the tree shows the target kind. */
	async classifyEntry(entry, dirPath, signal) {
		if (entry.attrs.isDirectory()) return "dir";
		if (entry.attrs.isFile()) return "file";
		if (entry.attrs.isSymbolicLink()) {
			const sftp = this.requireSftp();
			try {
				return (await this.boundedSftp("解析链接目标", signal, () => sftpCall(sftp.stat.bind(sftp), joinRemote(dirPath, entry.filename)))).isDirectory() ? "dir" : "file";
			} catch (error) {
				if (error instanceof SftpStallError) throw error;
				return "file";
			}
		}
		return "file";
	}
	/**
	* List one remote directory level: directories first, each group
	* name-sorted, symlinks classified by their resolved target.
	* @param path - absolute remote directory to list.
	* @returns the level's rows.
	*/
	async list(path, signal) {
		const sftp = this.requireSftp();
		const rows = await this.boundedSftp("列出目录", signal, () => sftpCall(sftp.readdir.bind(sftp), path));
		const entries = [];
		for (const row of rows) {
			const kind = await this.classifyEntry(row, path, signal);
			entries.push({
				name: row.filename,
				path: joinRemote(path, row.filename),
				kind,
				hidden: row.filename.startsWith(".")
			});
		}
		entries.sort((a, b) => a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "dir" ? -1 : 1);
		return {
			path,
			entries
		};
	}
	/**
	* Read a remote file as UTF-8 text. Binary content and files above
	* `maxBytes` are rejected so the browser editor never holds junk.
	* @param path - absolute remote path.
	* @param maxBytes - size cap; larger files are refused with a clear message.
	* @returns the decoded text.
	*/
	async read(path, maxBytes, signal) {
		const sftp = this.requireSftp();
		const stats = await this.boundedSftp("读取", signal, () => sftpCall(sftp.stat.bind(sftp), path));
		if (stats.isDirectory()) throw new Error("这是一个目录，请展开后选择文件");
		if (stats.size > maxBytes) throw new Error(`文件过大（${stats.size} 字节，超过 ${maxBytes} 字节上限），无法在面板中编辑`);
		const text = (await this.boundedSftp("读取", signal, () => sftpCall(sftp.readFile.bind(sftp), path))).toString("utf8");
		if (text.includes("\0")) throw new Error("检测到二进制内容，无法以文本方式编辑");
		return text;
	}
	/**
	* Write a remote file atomically: temp file on the server, then POSIX
	* rename over the target. A failed upload leaves the target untouched.
	* @param path - absolute remote path (created when missing).
	* @param content - the UTF-8 text to write.
	*/
	async write(path, content, signal) {
		const sftp = this.requireSftp();
		const tmp = `${path}.dsh-edit-${process.pid}-${Date.now()}`;
		const buffer = Buffer.from(content, "utf8");
		try {
			await this.boundedSftp("写入", signal, () => sftpCall(sftp.writeFile.bind(sftp), tmp, buffer));
			await this.boundedSftp("重命名", signal, () => sftpCall(sftp.rename.bind(sftp), tmp, path));
		} catch (error) {
			if (!(error instanceof SftpStallError)) try {
				await this.boundedSftp("清理临时文件", void 0, () => sftpCall(sftp.unlink.bind(sftp), tmp));
			} catch {}
			throw error;
		}
	}
	/** Create one remote directory (parent must exist). */
	async mkdir(path, signal) {
		const sftp = this.requireSftp();
		await this.boundedSftp("创建目录", signal, () => sftpCall(sftp.mkdir.bind(sftp), path));
	}
	/** Delete one remote file or (empty) directory. */
	async unlink(path, signal) {
		const sftp = this.requireSftp();
		if ((await this.boundedSftp("读取", signal, () => sftpCall(sftp.stat.bind(sftp), path))).isDirectory()) await this.boundedSftp("删除目录", signal, () => sftpCall(sftp.rmdir.bind(sftp), path));
		else await this.boundedSftp("删除", signal, () => sftpCall(sftp.unlink.bind(sftp), path));
	}
	/**
	* Run one remote command over the ssh2 shell channel and capture its
	* output. The command runs in the login shell; an optional `cwd` first
	* `cd`s into a directory (single-quoted against shell metacharacters).
	* @param command - the command line to run.
	* @param options - an optional working directory and per-stream cap.
	* @returns exit code plus captured stdout/stderr, each capped.
	*/
	async exec(command, options = {}, signal) {
		const client = this.client;
		if (client === null || this.sftp === null) throw new Error("尚未连接服务器，请先连接（ssh_connect 或右侧面板）");
		const maxChars = options.maxChars ?? 2e4;
		const full = options.cwd !== void 0 && options.cwd !== "" ? `cd ${posixQuote(options.cwd)} && ${command}` : command;
		return new Promise((resolve, reject) => {
			let settled = false;
			const finish = (outcome) => {
				if (settled) return;
				settled = true;
				signal?.removeEventListener("abort", onAbort);
				resolve(outcome);
			};
			const fail = (error) => {
				if (settled) return;
				settled = true;
				signal?.removeEventListener("abort", onAbort);
				reject(error);
			};
			const onAbort = () => {
				fail(/* @__PURE__ */ new Error("命令执行已取消"));
				try {
					stream?.close();
				} catch {}
			};
			let stream;
			client.exec(full, (error, channel) => {
				if (error) {
					fail(error instanceof Error ? error : new Error(String(error)));
					return;
				}
				stream = channel;
				let stdout = "";
				let stderr = "";
				let code = null;
				channel.on("data", (chunk) => {
					stdout = capOutput(stdout + chunk.toString("utf8"), maxChars);
				});
				if (channel.stderr !== void 0) channel.stderr.on("data", (chunk) => {
					stderr = capOutput(stderr + chunk.toString("utf8"), maxChars);
				});
				channel.on("close", (closeCode) => {
					code = closeCode;
					finish({
						code,
						stdout,
						stderr
					});
				});
				channel.on("error", (channelError) => {
					fail(channelError);
				});
			});
			if (signal?.aborted === true) onAbort();
			signal?.addEventListener("abort", onAbort, { once: true });
		});
	}
};
//#endregion
//#region lib/types/state.js
/**
* Durable `dsh-ssh-files` state, persisted as JSON under the harness home
* (`~/.dsh/ssh-files/state.json`): a shared pool of saved server records plus
* a working-mode preference per session (keyed by session id), so separate
* conversations can each remember their own local/SSH choice and server
* without touching each other. Brand-new sessions inherit the most recent
* choice (`defaultPref`). The file is plugin-owned user data, never part of a
* profile patch or a bundle, so harness updates cannot touch it.
* @module @deepseek-ai/dsh-ssh-files/state
*/
/** Directory and file names under the harness home. */
const STATE_DIR = "ssh-files";
const STATE_FILE = "state.json";
/** Absolute path of the state file. */
function stateFilePath() {
	return dshHomePath(STATE_DIR, STATE_FILE);
}
/** A fresh unique server record id. */
function createServerId() {
	return randomUUID();
}
/** A fresh local-mode, no-server preference. */
function freshPref() {
	return {
		mode: "local",
		serverId: null
	};
}
/**
* The preference a session starts from: its own durable one when present,
* else the shared most-recent default. Returns a copy — callers mutate and
* persist through the store, never the durable object in place.
* @param state - current durable state.
* @param sessionId - session key; `undefined`/empty means a brand-new session.
*/
function prefFor(state, sessionId) {
	return { ...(sessionId === void 0 || sessionId === "" ? void 0 : state.sessions[sessionId]) ?? state.defaultPref };
}
/** Validate one decoded record; returns it or `undefined` when malformed. */
function parseServer(value) {
	if (typeof value !== "object" || value === null) return void 0;
	const record = value;
	const id = record.id;
	const name = record.name;
	const host = record.host;
	const port = record.port;
	const username = record.username;
	const auth = record.auth;
	const root = record.root;
	if (typeof id !== "string" || id.length === 0) return void 0;
	if (typeof name !== "string" || typeof host !== "string" || host.length === 0) return void 0;
	if (typeof port !== "number" || !Number.isInteger(port) || port < 1 || port > 65535) return void 0;
	if (typeof username !== "string") return void 0;
	if (auth !== "password" && auth !== "key" && auth !== "agent") return void 0;
	const server = {
		id,
		name,
		host,
		port,
		username,
		auth,
		root: typeof root === "string" ? root : ""
	};
	if (typeof record.password === "string") server.password = record.password;
	if (typeof record.keyPath === "string") server.keyPath = record.keyPath;
	return server;
}
/** Parse one decoded preference object; falls back to local/no-server. */
function parsePref(value) {
	if (typeof value !== "object" || value === null) return freshPref();
	const record = value;
	return {
		mode: record.mode === "ssh" ? "ssh" : "local",
		serverId: typeof record.serverId === "string" && record.serverId.length > 0 ? record.serverId : typeof record.activeServerId === "string" && record.activeServerId.length > 0 ? record.activeServerId : null
	};
}
/**
* Parse a decoded state file, migrating the v1 shape (a single global
* `mode`/`activeServerId`) into the v2 default preference. Malformed rows are
* dropped rather than failing the whole boot (the file is best-effort user
* data), and an unreadable file is treated as fresh state.
* @param raw - the raw JSON text of the state file.
* @returns the validated state, always structurally sound.
*/
function parseState(raw) {
	let decoded;
	const fresh = () => ({
		servers: [],
		defaultPref: freshPref(),
		sessions: {}
	});
	try {
		decoded = JSON.parse(raw);
	} catch {
		return fresh();
	}
	if (typeof decoded !== "object" || decoded === null) return fresh();
	const state = decoded;
	const servers = Array.isArray(state.servers) ? state.servers.map(parseServer).filter((server) => server !== void 0) : [];
	if (state.defaultPref !== void 0 || state.sessions !== void 0) return {
		servers,
		defaultPref: parsePref(state.defaultPref),
		sessions: (() => {
			if (typeof state.sessions !== "object" || state.sessions === null) return {};
			const out = {};
			for (const [key, value] of Object.entries(state.sessions)) if (key.length > 0 && key !== "__proto__") out[key] = parsePref(value);
			return out;
		})()
	};
	return {
		servers,
		defaultPref: parsePref(state),
		sessions: {}
	};
}
/** Load the persisted state; a missing or unreadable file means fresh state. */
async function loadState() {
	try {
		return parseState(await readFile(stateFilePath(), "utf8"));
	} catch (error) {
		if (error.code === "ENOENT") return {
			servers: [],
			defaultPref: freshPref(),
			sessions: {}
		};
		throw error;
	}
}
/** Persist the state file atomically (temp + rename under the same directory). */
async function saveState(state) {
	const file = stateFilePath();
	await mkdir(dirname(file), { recursive: true });
	const tmp = `${file}.tmp-${process.pid}`;
	await writeFile(tmp, JSON.stringify(state, void 0, 2) + "\n", "utf8");
	await renameFile(tmp, file);
}
/** Cross-platform atomic rename (Windows rename cannot overwrite). */
async function renameFile(from, to) {
	try {
		await rename(from, to);
	} catch (error) {
		if (error.code !== "EEXIST" && error.code !== "EPERM") throw error;
		await unlink(to);
		await rename(from, to);
	}
}
//#endregion
//#region lib/types/store.js
/**
* Session-scoped runtime store for `dsh-ssh-files`. One store instance owns
* the durable state (shared server pool + per-session preferences) and a
* live `SshConnection` per session key — separate conversations connect to
* different servers and never share an SSH channel, which is the isolation
* boundary between local and remote work. Both the `/ssh-files` RPC channel
* and the model-facing `ssh_*` tools route through this store.
* @module @deepseek-ai/dsh-ssh-files/store
*/
/** One local directory listing (mirrors the remote listing shape). */
async function listLocal(path) {
	const dirents = await readdir(path, { withFileTypes: true });
	const entries = [];
	for (const dirent of dirents) {
		let kind;
		if (dirent.isDirectory()) kind = "dir";
		else if (dirent.isFile() || dirent.isSymbolicLink()) kind = "file";
		else continue;
		entries.push({
			name: dirent.name,
			path: join(path, dirent.name),
			kind,
			hidden: dirent.name.startsWith(".")
		});
	}
	entries.sort((a, b) => a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "dir" ? -1 : 1);
	return {
		path,
		entries
	};
}
/** Read one local text file with the same size/binary caps as the remote read. */
async function readLocal(path, maxBytes) {
	const stats = await stat(path);
	if (stats.isDirectory()) throw new Error("这是一个目录，请展开后选择文件");
	if (stats.size > maxBytes) throw new Error(`文件过大（${stats.size} 字节，超过 ${maxBytes} 字节上限），无法在面板中编辑`);
	const text = await readFile(path, "utf8");
	if (text.includes("\0")) throw new Error("检测到二进制内容，无法以文本方式编辑");
	return text;
}
/** Write one local file atomically (temp + rename). */
async function writeLocal(path, content) {
	const tmp = `${path}.dsh-edit-${process.pid}-${Date.now()}`;
	try {
		await writeFile(tmp, content, "utf8");
		await rename(tmp, path);
	} catch (error) {
		try {
			await unlink(tmp);
		} catch {}
		throw error;
	}
}
/** Create one local directory. */
async function mkdirLocal(path) {
	await mkdir(path, { recursive: false });
}
/** Delete one local file or (empty) directory. */
async function unlinkLocal(path) {
	if ((await stat(path)).isDirectory()) {
		const { rmdir } = await import("node:fs/promises");
		await rmdir(path);
	} else await unlink(path);
}
/** The server record for a prefs serverId, or undefined when stale. */
function serverOf(state, serverId) {
	if (serverId === null) return void 0;
	return state.servers.find((candidate) => candidate.id === serverId);
}
/**
* The session-scoped store: durable state plus one live SSH connection per
* session key. Every preference write persists before returning; connection
* state is intentionally memory-only (a restart requires reconnecting).
*/
var SshSessionStore = class {
	opTimeoutMs;
	ready;
	state = null;
	runtimes = /* @__PURE__ */ new Map();
	/**
	* @param opTimeoutMs - deadline for one remote SFTP round trip; passed to
	*   every per-session {@link SshConnection} (see its constructor).
	*/
	constructor(opTimeoutMs = 12e4) {
		this.opTimeoutMs = opTimeoutMs;
		this.ready = loadState().then((state) => {
			this.state = state;
		}, () => {
			this.state = {
				servers: [],
				defaultPref: freshPref(),
				sessions: {}
			};
		});
	}
	/** Wait for the initial load and return the current state. */
	async current() {
		await this.ready;
		const state = this.state;
		if (state === null) throw new Error("ssh-files: state failed to initialize");
		return state;
	}
	/** Persist the current state. */
	async persist() {
		const state = this.state;
		if (state === null) throw new Error("ssh-files: state failed to initialize");
		await saveState(state);
	}
	/** The runtime for a session key (created lazily, never shared across keys). */
	runtimeFor(sessionId) {
		let runtime = this.runtimes.get(sessionId);
		if (runtime === void 0) {
			runtime = { conn: new SshConnection(this.opTimeoutMs) };
			this.runtimes.set(sessionId, runtime);
		}
		return runtime;
	}
	/** Write a session's durable preference (both its own row and the default). */
	async writePref(sessionId, pref) {
		const state = await this.current();
		if (sessionId !== "") state.sessions[sessionId] = { ...pref };
		state.defaultPref = { ...pref };
		await this.persist();
	}
	/** The effective tree root for a connected session's server. */
	async rootFor(state, sessionId) {
		const runtime = this.runtimeFor(sessionId);
		const server = serverOf(state, prefFor(state, sessionId === "" ? void 0 : sessionId).serverId);
		if (server !== void 0 && server.root.trim() !== "") return server.root;
		return runtime.conn.activeHome ?? "/";
	}
	/** The full wire state response for one session. */
	async response(sessionId) {
		const state = await this.current();
		const pref = prefFor(state, sessionId === "" ? void 0 : sessionId);
		const connected = this.runtimeFor(sessionId).conn.connected;
		const root = connected ? await this.rootFor(state, sessionId) : null;
		return {
			state: {
				mode: pref.mode,
				serverId: pref.serverId,
				servers: state.servers,
				connected
			},
			root
		};
	}
	/** Switch one session's working mode (also remembered as the default). */
	async setMode(sessionId, mode) {
		const pref = prefFor(await this.current(), sessionId === "" ? void 0 : sessionId);
		await this.writePref(sessionId, {
			mode,
			serverId: pref.serverId
		});
		return this.response(sessionId);
	}
	/** Add a server record (id generated, shared by every session). */
	async addServer(input, sessionId = "") {
		(await this.current()).servers.push({
			...input,
			id: createServerId()
		});
		await this.persist();
		return this.response(sessionId);
	}
	/** Replace one server record's fields. */
	async updateServer(id, input, sessionId = "") {
		const state = await this.current();
		const index = state.servers.findIndex((candidate) => candidate.id === id);
		const previous = state.servers[index];
		if (previous === void 0) throw new Error("服务器记录不存在");
		state.servers[index] = {
			...input,
			id: previous.id
		};
		await this.persist();
		return this.response(sessionId);
	}
	/** Remove one server record, dropping connections and prefs that target it. */
	async removeServer(id, sessionId = "") {
		const state = await this.current();
		const index = state.servers.findIndex((candidate) => candidate.id === id);
		if (index === -1) throw new Error("服务器记录不存在");
		state.servers.splice(index, 1);
		for (const [runtimeSessionId, runtime] of this.runtimes) {
			if (runtime.conn.activeServer?.id !== id) continue;
			await runtime.conn.disconnect();
			const pref = prefFor(state, runtimeSessionId === "" ? void 0 : runtimeSessionId);
			if (pref.serverId === id && runtimeSessionId !== "") state.sessions[runtimeSessionId] = {
				...pref,
				serverId: null
			};
		}
		if (state.defaultPref.serverId === id) state.defaultPref = {
			...state.defaultPref,
			serverId: null
		};
		await this.persist();
		return this.response(sessionId);
	}
	/** Connect one session to a saved server; its mode becomes `ssh`. */
	async connect(sessionId, id, timeoutMs, signal) {
		const state = await this.current();
		const server = state.servers.find((candidate) => candidate.id === id);
		if (server === void 0) throw new Error("服务器记录不存在");
		const result = await this.runtimeFor(sessionId).conn.connect(server, timeoutMs, signal);
		await this.writePref(sessionId, {
			mode: "ssh",
			serverId: id
		});
		return {
			state: {
				mode: "ssh",
				serverId: id,
				servers: state.servers,
				connected: true
			},
			root: result.root
		};
	}
	/** Tear down one session's live connection (its preference is kept). */
	async disconnect(sessionId) {
		const state = await this.current();
		await this.runtimeFor(sessionId).conn.disconnect();
		const pref = prefFor(state, sessionId === "" ? void 0 : sessionId);
		return {
			state: {
				mode: pref.mode,
				serverId: pref.serverId,
				servers: state.servers,
				connected: false
			},
			root: null
		};
	}
	/** Resolve a server reference (id or display name) to a record. */
	findServer(state, reference) {
		if (reference === void 0 || reference === "") return void 0;
		return state.servers.find((candidate) => candidate.id === reference) ?? state.servers.find((candidate) => candidate.name === reference);
	}
	/** The connected server of one session, throwing when not connected. */
	requireServer(sessionId) {
		if (this.state === null) throw new Error("ssh-files: state failed to initialize");
		const server = this.runtimeFor(sessionId).conn.activeServer;
		if (server === null) throw new Error("本会话尚未连接服务器：请先用 ssh_connect 连接（或右侧面板连接）");
		return server;
	}
	/**
	* Ensure one session is connected to a target server (its reference or the
	* session's remembered server), then return the runtime's connection.
	* @param sessionId - session key.
	* @param reference - server id or name; omitted uses the session's remembered server.
	*/
	async ensureConnected(sessionId, reference, timeoutMs, signal) {
		const state = await this.current();
		const runtime = this.runtimeFor(sessionId);
		const active = runtime.conn.activeServer;
		const wanted = reference === void 0 || reference === "" ? serverOf(state, prefFor(state, sessionId === "" ? void 0 : sessionId).serverId) : this.findServer(state, reference);
		if (active !== null && (wanted === void 0 || active.id === wanted.id)) return {
			conn: runtime.conn,
			server: active
		};
		if (wanted === void 0) throw new Error("找不到目标服务器：请提供已保存服务器的 id 或名称（ssh_status 可列出）");
		await runtime.conn.connect(wanted, timeoutMs, signal);
		await this.writePref(sessionId, {
			mode: "ssh",
			serverId: wanted.id
		});
		return {
			conn: runtime.conn,
			server: wanted
		};
	}
	/** Mode-aware directory listing for one session (panel behavior). */
	async list(sessionId, path, signal) {
		if (prefFor(await this.current(), sessionId === "" ? void 0 : sessionId).mode !== "ssh") return listLocal(path);
		const runtime = this.runtimeFor(sessionId);
		if (!runtime.conn.connected) throw new Error("SSH 模式下请先连接服务器");
		return runtime.conn.list(path, signal);
	}
	/** Mode-aware text read with the configured size cap. */
	async read(sessionId, path, maxBytes, signal) {
		if (prefFor(await this.current(), sessionId === "" ? void 0 : sessionId).mode !== "ssh") return readLocal(path, maxBytes);
		const runtime = this.runtimeFor(sessionId);
		if (!runtime.conn.connected) throw new Error("SSH 模式下请先连接服务器");
		return runtime.conn.read(path, maxBytes, signal);
	}
	/** Mode-aware atomic text write. */
	async write(sessionId, path, content, signal) {
		if (prefFor(await this.current(), sessionId === "" ? void 0 : sessionId).mode !== "ssh") return writeLocal(path, content);
		const runtime = this.runtimeFor(sessionId);
		if (!runtime.conn.connected) throw new Error("SSH 模式下请先连接服务器");
		return runtime.conn.write(path, content, signal);
	}
	/** Mode-aware directory creation. */
	async mkdir(sessionId, path, signal) {
		if (prefFor(await this.current(), sessionId === "" ? void 0 : sessionId).mode !== "ssh") return mkdirLocal(path);
		const runtime = this.runtimeFor(sessionId);
		if (!runtime.conn.connected) throw new Error("SSH 模式下请先连接服务器");
		return runtime.conn.mkdir(path, signal);
	}
	/** Mode-aware file/directory deletion. */
	async unlink(sessionId, path, signal) {
		if (prefFor(await this.current(), sessionId === "" ? void 0 : sessionId).mode !== "ssh") return unlinkLocal(path);
		const runtime = this.runtimeFor(sessionId);
		if (!runtime.conn.connected) throw new Error("SSH 模式下请先连接服务器");
		return runtime.conn.unlink(path, signal);
	}
	/** The live connection of one session (must be connected first). */
	connection(sessionId) {
		return this.runtimeFor(sessionId).conn;
	}
	/** The connected connection of one session, throwing when not connected. */
	requireConnectedFor(sessionId) {
		const runtime = this.runtimeFor(sessionId);
		if (!runtime.conn.connected) throw new Error("本会话尚未连接服务器：请先用 ssh_connect 连接（或右侧面板连接）");
		return runtime.conn;
	}
	/** Tear down every live connection (host teardown). */
	async dispose() {
		await Promise.all([...this.runtimes.values()].map((runtime) => runtime.conn.disconnect()));
		this.runtimes.clear();
	}
};
//#endregion
//#region lib/types/tools.js
/**
* Model-facing `ssh_*` tools for `dsh-ssh-files`. Each call routes through
* the session of the agent that issued it (`exec.agent.id` — the same session
* key the `/ssh-files` panel uses), so a conversation's SSH operations are
* isolated per session: server A in one conversation never shares a channel
* or preference with server B in another, and local work is untouched.
* Without an agent (direct SDK/headless dispatch) the tools fall back to the
* `''` default session, matching the RPC channel's default.
* @module @deepseek-ai/dsh-ssh-files/tools
*/
/** Session key of the agent that called a tool ('' when none). */
function sessionKeyOf$1(exec) {
	const id = exec.agent?.id;
	return typeof id === "string" && id.length > 0 ? id : "";
}
/** A plain text model block. */
const text = (value) => [{
	type: "text",
	text: value
}];
/** Register the full `ssh_*` tool suite on `ctx.tools`. */
function registerSshTools(ctx, store, caps) {
	const tools = ctx.tools;
	tools.register(defineTool({
		name: "ssh_status",
		description: "Report this conversation's SSH working state: every saved server (id, name, host) and which one this session is connected to (with its home). Use this first to learn the server ids for ssh_connect and the current connection.",
		parameters: {},
		output: {
			schema: { type: "string" },
			render: (_args, value) => text(value)
		},
		async execute(_args, exec) {
			const state = await store.response(sessionKeyOf$1(exec));
			const connected = state.state.connected;
			const server = connected ? state.state.servers.find((candidate) => candidate.id === state.state.serverId) : void 0;
			return [
				`已保存服务器 ${state.state.servers.length} 台：`,
				...state.state.servers.map((item) => `- ${item.id}  ${item.name}  (${item.username}@${item.host}:${item.port})`),
				connected && server !== void 0 ? `本会话已连接：${server.id}（${server.name}）` : "本会话未连接（用 ssh_connect 连接）"
			].join("\n");
		}
	}));
	tools.register(defineTool({
		name: "ssh_connect",
		description: "Connect this conversation's session to a saved server over SSH/SFTP. Pass the server id or display name from ssh_status. After this, ssh_list / ssh_read / ssh_write / ssh_exec operate on that server for this session only.",
		parameters: { server: {
			type: "string",
			description: "Saved server id or display name (see ssh_status)."
		} },
		output: {
			schema: { type: "string" },
			render: (_args, value) => text(value)
		},
		async execute(args, exec) {
			const sessionId = sessionKeyOf$1(exec);
			const reference = args.server;
			const { server } = await store.ensureConnected(sessionId, typeof reference === "string" ? reference : void 0, caps.connectTimeoutMs, exec.signal);
			return `已连接 ${server.name}（${server.username}@${server.host}）`;
		}
	}));
	tools.register(defineTool({
		name: "ssh_disconnect",
		description: "Disconnect this conversation's session from its current SSH server. The saved server record and preference are kept.",
		parameters: {},
		output: {
			schema: { type: "string" },
			render: (_args, value) => text(value)
		},
		async execute(_args, exec) {
			const state = await store.disconnect(sessionKeyOf$1(exec));
			const name = state.state.servers.find((item) => item.id === state.state.serverId)?.name ?? "";
			return name !== "" ? `已断开 ${name}。` : "本会话未连接。";
		}
	}));
	tools.register(defineTool({
		name: "ssh_list",
		description: "List one directory on this conversation's connected SSH server. The tree is like a local readdir: directories first, then files, each name-sorted.",
		parameters: { path: {
			type: "string",
			required: true,
			description: "Absolute remote directory to list (e.g. /home/user or /)."
		} },
		output: {
			schema: { type: "string" },
			render: (_args, value) => text(value)
		},
		async execute(args, exec) {
			const conn = store.requireConnectedFor(sessionKeyOf$1(exec));
			const path = args.path;
			const rows = (await conn.list(path, exec.signal)).entries.map((entry) => `${entry.kind === "dir" ? "dir " : "file"} ${entry.path}${entry.hidden ? "  (hidden)" : ""}`);
			return rows.length > 0 ? rows.join("\n") : "（空目录）";
		}
	}));
	tools.register(defineTool({
		name: "ssh_read",
		description: "Read a UTF-8 text file on this conversation's connected SSH server and return numbered lines. Use offset/limit to page through large files. Binary or oversized files are rejected.",
		parameters: {
			path: {
				type: "string",
				required: true,
				description: "Absolute remote file path."
			},
			offset: {
				type: "number",
				description: "1-based first line to return. Defaults to 1."
			},
			limit: {
				type: "number",
				description: `Maximum number of lines to return. Defaults to ${caps.readMaxLines}.`
			}
		},
		output: {
			schema: { type: "string" },
			render: (_args, value) => text(value)
		},
		async execute(args, exec) {
			const conn = store.requireConnectedFor(sessionKeyOf$1(exec));
			const input = args;
			const lines = (await conn.read(input.path, caps.readMaxBytes, exec.signal)).split("\n");
			const total = lines.length;
			const offset = typeof input.offset === "number" && Number.isFinite(input.offset) && input.offset >= 1 ? Math.floor(input.offset) : 1;
			const limit = typeof input.limit === "number" && Number.isFinite(input.limit) && input.limit >= 1 ? Math.floor(input.limit) : caps.readMaxLines;
			const slice = lines.slice(offset - 1, offset - 1 + limit);
			const width = String(offset - 1 + slice.length).length;
			const body = slice.map((lineText, index) => `${String(offset + index).padStart(width)} | ${lineText}`).join("\n");
			const truncated = offset - 1 + slice.length < total;
			return `<path>${input.path}</path>\n<type>file</type>\n<content>\n${body}\n</content>\n${truncated ? `（共 ${total} 行，已显示 ${offset}-${offset - 1 + slice.length} 行；用 offset=${offset + slice.length} 继续）` : `共 ${total} 行`}`;
		}
	}));
	tools.register(defineTool({
		name: "ssh_write",
		description: "Write (create or overwrite) one UTF-8 text file on this conversation's connected SSH server, atomically (temp + rename). Parent directories must exist; create them with ssh_mkdir.",
		parameters: {
			path: {
				type: "string",
				required: true,
				description: "Absolute remote file path."
			},
			content: {
				type: "string",
				required: true,
				description: "Full text content to write."
			}
		},
		output: {
			schema: { type: "string" },
			render: (_args, value) => text(value)
		},
		async execute(args, exec) {
			const conn = store.requireConnectedFor(sessionKeyOf$1(exec));
			const input = args;
			if (input.content.length > caps.writeMaxChars) throw new Error(`内容过长（${input.content.length} 字符，上限 ${caps.writeMaxChars}）：请分批或改用 ssh_exec 处理`);
			await conn.write(input.path, input.content, exec.signal);
			return `已写入 ${input.path}`;
		}
	}));
	tools.register(defineTool({
		name: "ssh_mkdir",
		description: "Create one directory on this conversation's connected SSH server (parent must exist).",
		parameters: { path: {
			type: "string",
			required: true,
			description: "Absolute remote directory path."
		} },
		output: {
			schema: { type: "string" },
			render: (_args, value) => text(value)
		},
		async execute(args, exec) {
			await store.requireConnectedFor(sessionKeyOf$1(exec)).mkdir(args.path, exec.signal);
			return "已创建目录";
		}
	}));
	tools.register(defineTool({
		name: "ssh_rm",
		description: "Delete one file or (empty) directory on this conversation's connected SSH server. Use with care — this is not reversible.",
		parameters: { path: {
			type: "string",
			required: true,
			description: "Absolute remote path to delete."
		} },
		output: {
			schema: { type: "string" },
			render: (_args, value) => text(value)
		},
		async execute(args, exec) {
			await store.requireConnectedFor(sessionKeyOf$1(exec)).unlink(args.path, exec.signal);
			return "已删除";
		}
	}));
	tools.register(defineTool({
		name: "ssh_exec",
		description: "Run one shell command on this conversation's connected SSH server and return its exit code plus captured stdout/stderr. The remote login shell parses the command (POSIX syntax on typical servers). Use this for work ssh_list/ssh_read/ssh_write cannot do (git, package managers, scripts).",
		parameters: {
			command: {
				type: "string",
				required: true,
				description: "The command line to run remotely."
			},
			cwd: {
				type: "string",
				description: "Optional remote working directory to cd into first."
			}
		},
		output: {
			schema: { type: "string" },
			render: (_args, value) => text(value)
		},
		async execute(args, exec) {
			const conn = store.requireConnectedFor(sessionKeyOf$1(exec));
			const input = args;
			const outcome = await conn.exec(input.command, input.cwd !== void 0 ? {
				cwd: input.cwd,
				maxChars: caps.execMaxChars
			} : { maxChars: caps.execMaxChars }, exec.signal);
			const lines = [`$ ${input.cwd !== void 0 ? `cd ${input.cwd} && ` : ""}${input.command}`];
			if (outcome.stdout !== "") lines.push(outcome.stdout);
			if (outcome.stderr !== "") lines.push(`[stderr]\n${outcome.stderr}`);
			lines.push(outcome.code === 0 ? "[exit 0]" : `[exit ${String(outcome.code)}] — 命令非零退出，请检查上面的错误输出`);
			return lines.join("\n");
		}
	}));
	ctx.systemPrompt.section({
		name: "tool:ssh-files",
		order: 100,
		text: "SSH 工具（ssh_status / ssh_connect / ssh_list / ssh_read / ssh_write / ssh_mkdir / ssh_rm / ssh_exec）作用于本对话各自记住的服务器，与会话隔离：每个对话独立连接、互不影响。需要操作远程服务器时，先 ssh_status 查看可用服务器，再 ssh_connect 连接（或沿用本会话已连的），然后使用 ssh_* 工具。本地文件仍用 read/write 等内置工具。"
	});
}
//#endregion
//#region lib/types/index.js
/**
* `dsh-ssh-files` host half: mounts the `/ssh-files` RPC channel that the
* browser panel drives and registers the model-facing `ssh_*` tools. Both
* route through one {@link SshSessionStore}, which keeps a shared saved-server
* pool plus an isolated preference and live SSH connection per session — local
* work and each remote server session never share state or a channel. The
* channel is loopback-only (the same trust fence as every `/api` request).
* @module @deepseek-ai/dsh-ssh-files
*/
const Config = Schema.object({
	readMaxBytes: Schema.number().default(1024 * 1024),
	connectTimeoutMs: Schema.number().default(15e3),
	opTimeoutMs: Schema.number().default(12e4),
	writeMaxChars: Schema.number().default(2e5),
	readMaxLines: Schema.number().default(2e3),
	execMaxChars: Schema.number().default(2e4),
	code: Schema.string().default("code"),
	marktext: Schema.string().default("marktext")
});
/** Stable Cordis plugin name. */
const name = "ssh-files";
/** Required services: the RPC registry, the tool registry, and system prompt. */
const inject = [
	"connection",
	"tools",
	"systemPrompt"
];
/** Recover the session key from a payload (`''` when absent = default session). */
function sessionKeyOf(payload) {
	if (typeof payload === "object" && payload !== null) {
		const value = payload.sessionId;
		return typeof value === "string" && value.length > 0 ? value : "";
	}
	return "";
}
/** Recovers a validated `{ mode }` payload; undefined = malformed. */
function parseMode(payload) {
	if (typeof payload !== "object" || payload === null) return void 0;
	const mode = payload.mode;
	return mode === "local" || mode === "ssh" ? mode : void 0;
}
/** Recovers a valid non-empty string field from a request payload. */
function parseStringField(payload, key) {
	if (typeof payload !== "object" || payload === null) return void 0;
	const value = payload[key];
	return typeof value === "string" && value.length > 0 ? value : void 0;
}
/** Recovers a valid string field (may be empty) from a request payload. */
function parseOptionalString(payload, key) {
	if (typeof payload !== "object" || payload === null) return void 0;
	const value = payload[key];
	return typeof value === "string" ? value : void 0;
}
/**
* Validate an add/update server payload, or throw with the first invalid
* field named. Passwords arrive over the loopback fence; the record is
* persisted in the plugin's own state file.
*/
function parseServerInput(payload) {
	if (typeof payload !== "object" || payload === null) throw new Error("服务器信息格式无效");
	const record = payload;
	const name = parseStringField(record, "name");
	const host = parseStringField(record, "host");
	const username = parseOptionalString(record, "username");
	const root = parseOptionalString(record, "root") ?? "";
	const auth = record.auth;
	if (name === void 0) throw new Error("请填写服务器名称");
	if (host === void 0) throw new Error("请填写主机地址");
	if (username === void 0 || username === "") throw new Error("请填写登录用户名");
	if (auth !== "password" && auth !== "key" && auth !== "agent") throw new Error("认证方式无效");
	const port = record.port;
	if (typeof port !== "number" || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error("端口必须是 1-65535 的整数");
	const input = {
		name,
		host,
		port,
		username,
		auth,
		root
	};
	const password = parseOptionalString(record, "password");
	if (password !== void 0) input.password = password;
	const keyPath = parseOptionalString(record, "keyPath");
	if (keyPath !== void 0) input.keyPath = keyPath;
	return input;
}
/** PowerShell single-quoted literal (doubles embedded quotes). */
function powershellLiteral(value) {
	return `'${value.replace(/'/g, "''")}'`;
}
/** Whether a native-command failure names a missing executable (en/zh text). */
const NOT_FOUND_RE = /not (recognized|found)|CommandNotFound|无法将.+识别为|不是内部或外部命令/;
/**
* Open one local path in a desktop app. Windows opens through PowerShell
* because common openers are `.cmd` shims (`code` → `code.cmd`) that
* `execFile` cannot spawn directly; macOS/Linux run the executable directly.
*/
async function runOpener(command, path, signal) {
	try {
		if (process.platform === "win32") await runNativeCommand("powershell.exe", [
			"-NoProfile",
			"-Command",
			`& ${powershellLiteral(command)} ${powershellLiteral(path)}`
		], signal);
		else await runNativeCommand(command, [path], signal);
	} catch (error) {
		if (signal.aborted) throw error;
		const message = error instanceof Error ? error.message : String(error);
		if (error?.code === "ENOENT" || NOT_FOUND_RE.test(message)) throw new Error(`找不到可执行程序 "${command}"：请确认已安装并加入 PATH，或在插件配置（cordis.patch.yml 的 ssh-files 行）中填写完整路径`);
		throw error instanceof Error ? error : new Error(message);
	}
}
/**
* Mount the `/ssh-files` RPC channel and register the `ssh_*` tools.
*
* RPC endpoints (every state/fs endpoint takes the session id in `payload`,
* so each conversation panel reads and drives only its own session):
* - `get-state` / `set-mode` / `add-server` / `update-server` / `remove-server`
*   / `connect` / `disconnect` — per-session state and the shared server pool.
* - `list` / `read` / `write` / `mkdir` / `unlink` — mode-aware file operations
*   for the calling session.
* - `open-local` — open a local path in a desktop app (local mode only).
*
* The channel is loopback-only (the same trust fence as every `/api` request).
* @param ctx - cordis context carrying `connection`, `tools`, and `systemPrompt`.
* @param config - validated read caps, timeouts, and desktop openers.
*/
function apply(ctx, config) {
	const resolved = config;
	const store = new SshSessionStore(resolved.opTimeoutMs);
	ctx.effect(() => () => {
		store.dispose();
	}, "ssh-files: session teardown");
	registerSshTools(ctx, store, {
		connectTimeoutMs: resolved.connectTimeoutMs,
		readMaxBytes: resolved.readMaxBytes,
		writeMaxChars: resolved.writeMaxChars,
		readMaxLines: resolved.readMaxLines,
		execMaxChars: resolved.execMaxChars
	});
	const handler = async (endpoint, payload, signal) => {
		try {
			const session = sessionKeyOf(payload);
			switch (endpoint) {
				case "get-state": return {
					ok: true,
					value: await store.response(session)
				};
				case "set-mode": {
					const mode = parseMode(payload);
					if (mode === void 0) throw new Error("工作方式无效：仅支持 local 与 ssh");
					return {
						ok: true,
						value: await store.setMode(session, mode)
					};
				}
				case "add-server": return {
					ok: true,
					value: await store.addServer(parseServerInput(payload), session)
				};
				case "update-server": {
					const record = payload ?? {};
					const id = parseStringField(record, "id");
					if (id === void 0) throw new Error("缺少服务器 id");
					return {
						ok: true,
						value: await store.updateServer(id, parseServerInput(record.server), session)
					};
				}
				case "remove-server": {
					const id = parseStringField(payload, "id");
					if (id === void 0) throw new Error("缺少服务器 id");
					return {
						ok: true,
						value: await store.removeServer(id, session)
					};
				}
				case "connect": {
					const id = parseStringField(payload, "id");
					if (id === void 0) throw new Error("缺少服务器 id");
					return {
						ok: true,
						value: await store.connect(session, id, resolved.connectTimeoutMs, signal)
					};
				}
				case "disconnect": return {
					ok: true,
					value: await store.disconnect(session)
				};
				case "list": {
					const path = parseStringField(payload, "path");
					if (path === void 0) throw new Error("缺少目录路径");
					return {
						ok: true,
						value: await store.list(session, path, signal)
					};
				}
				case "read": {
					const path = parseStringField(payload, "path");
					if (path === void 0) throw new Error("缺少文件路径");
					return {
						ok: true,
						value: { content: await store.read(session, path, resolved.readMaxBytes, signal) }
					};
				}
				case "write": {
					const record = payload ?? {};
					const path = parseStringField(record, "path");
					const content = record.content;
					if (path === void 0) throw new Error("缺少文件路径");
					if (typeof content !== "string") throw new Error("缺少文件内容");
					await store.write(session, path, content, signal);
					return {
						ok: true,
						value: { written: true }
					};
				}
				case "mkdir": {
					const path = parseStringField(payload, "path");
					if (path === void 0) throw new Error("缺少目录路径");
					await store.mkdir(session, path, signal);
					return {
						ok: true,
						value: { created: true }
					};
				}
				case "unlink": {
					const path = parseStringField(payload, "path");
					if (path === void 0) throw new Error("缺少路径");
					await store.unlink(session, path, signal);
					return {
						ok: true,
						value: { removed: true }
					};
				}
				case "open-local": {
					const record = payload ?? {};
					const path = parseStringField(record, "path");
					const command = record.command;
					if (path === void 0) throw new Error("缺少文件路径");
					if (command !== "code" && command !== "marktext") throw new Error("缺少打开方式");
					await runOpener(command === "code" ? resolved.code : resolved.marktext, path, signal);
					return {
						ok: true,
						value: { opened: true }
					};
				}
				default: throw new Error(`未知端点 ${endpoint}`);
			}
		} catch (error) {
			if (signal.aborted) return {
				ok: false,
				error: {
					code: "cancelled",
					message: "操作已取消",
					details: {}
				}
			};
			return {
				ok: false,
				error: {
					code: "internal",
					message: error instanceof Error ? error.message : String(error),
					details: {}
				}
			};
		}
	};
	ctx.effect(() => ctx.connection.rpc.handle("/ssh-files", handler, { authority: "loopback" }), "ssh-files: rpc channel");
}
//#endregion
export { Config, SshSessionStore, apply, inject, name };
