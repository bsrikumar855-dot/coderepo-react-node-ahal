const STORAGE_KEY = "ahal-theme";
const THEMES = ["light", "dark"];
const DEFAULT_THEME = "light";

export function readTheme() {
	const stored = localStorage.getItem(STORAGE_KEY);
	return THEMES.includes(stored) ? stored : DEFAULT_THEME;
}

export function applyTheme(theme) {
	const next = THEMES.includes(theme) ? theme : DEFAULT_THEME;
	document.documentElement.dataset.theme = next;
	localStorage.setItem(STORAGE_KEY, next);
	return next;
}
