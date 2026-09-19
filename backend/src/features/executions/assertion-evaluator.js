/**
 * Per-type assertion comparators.
 *
 * A naive evaluator that reaches for JavaScript's `==` (or JSON.stringify equality)
 * silently passes assertions that shouldn't pass: the string "200" equals the number
 * 200 under `==`, and a boolean `true` in a JSON body stringifies differently from the
 * string "true" a person might type into an assertion's expected value. Each assertion
 * type below declares what its "actual" value naturally is (a number, a header string,
 * a body value of unknown shape) and only then picks a comparison - numeric assertions
 * always coerce both sides through Number() before comparing, string assertions always
 * compare through String(), and nothing is compared without first deciding which of the
 * two rules applies.
 */
import { getByPath } from "../../shared/utils/json-path.js";

function parseBody(responseBody) {
	try {
		return { ok: true, value: JSON.parse(responseBody) };
	} catch {
		return { ok: false, value: responseBody };
	}
}

function numericCompare(operator, actual, expected) {
	const actualNumber = Number(actual);
	const expectedNumber = Number(expected);
	if (Number.isNaN(actualNumber) || Number.isNaN(expectedNumber)) {
		return { passed: false, message: `Expected a numeric value, got "${actual}".` };
	}
	const table = {
		equals: actualNumber === expectedNumber,
		notEquals: actualNumber !== expectedNumber,
		lessThan: actualNumber < expectedNumber,
		lessThanOrEqual: actualNumber <= expectedNumber,
		greaterThan: actualNumber > expectedNumber,
		greaterThanOrEqual: actualNumber >= expectedNumber,
	};
	if (!(operator in table)) return { passed: false, message: `Operator "${operator}" does not apply to numeric checks.` };
	return { passed: table[operator], message: table[operator] ? "" : `Expected ${operator} ${expectedNumber}, got ${actualNumber}.` };
}

function stringCompare(operator, actual, expected) {
	if (operator === "exists") {
		const passed = actual !== undefined && actual !== null;
		return { passed, message: passed ? "" : "Expected a value, found none." };
	}
	const actualText = actual === undefined || actual === null ? "" : String(actual);
	const expectedText = expected === undefined || expected === null ? "" : String(expected);
	const table = {
		equals: actualText === expectedText,
		notEquals: actualText !== expectedText,
		contains: actualText.includes(expectedText),
	};
	if (!(operator in table)) return { passed: false, message: `Operator "${operator}" does not apply to text checks.` };
	return { passed: table[operator], message: table[operator] ? "" : `Expected "${expectedText}", got "${actualText}".` };
}

function evaluateStatus(assertion, result) {
	const outcome = numericCompare(assertion.operator, result.status ?? Number.NaN, assertion.expected);
	return { actual: result.status, ...outcome };
}

function evaluateResponseTime(assertion, result) {
	const outcome = numericCompare(assertion.operator, result.durationMs, assertion.expected);
	return { actual: result.durationMs, ...outcome };
}

function evaluateHeader(assertion, result) {
	const headerKey = (assertion.key || "").toLowerCase();
	const actual = result.responseHeaders?.[headerKey] ?? result.responseHeaders?.[assertion.key] ?? null;
	const outcome = stringCompare(assertion.operator, actual, assertion.expected);
	return { actual, ...outcome };
}

function evaluateBody(assertion, result) {
	const parsed = parseBody(result.responseBody || "");
	const actual = assertion.path ? getByPath(parsed.value, assertion.path) : parsed.value;
	const looksNumeric = typeof actual === "number" || (typeof assertion.expected === "number" && actual !== undefined);
	const outcome = ["lessThan", "lessThanOrEqual", "greaterThan", "greaterThanOrEqual"].includes(assertion.operator) || looksNumeric
		? numericCompare(assertion.operator, actual, assertion.expected)
		: stringCompare(assertion.operator, typeof actual === "object" ? JSON.stringify(actual) : actual, assertion.expected);
	return { actual, ...outcome };
}

const EVALUATORS = {
	status: evaluateStatus,
	responseTime: evaluateResponseTime,
	header: evaluateHeader,
	body: evaluateBody,
};

export function evaluateAssertions(assertions, result) {
	const evaluated = (assertions || []).map((assertion) => {
		const evaluator = EVALUATORS[assertion.type];
		if (!evaluator) {
			return { ...assertion, actual: null, passed: false, message: `Unknown assertion type "${assertion.type}".` };
		}
		const { actual, passed, message } = evaluator(assertion, result);
		return { type: assertion.type, operator: assertion.operator, path: assertion.path || "", key: assertion.key || "", expected: assertion.expected ?? "", actual: actual ?? null, passed, message };
	});
	return { results: evaluated, allPassed: evaluated.every((item) => item.passed) };
}
