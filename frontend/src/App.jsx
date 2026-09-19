import { useCallback, useEffect, useState } from "react";
import { authApi } from "./features/auth/auth.api.js";
import { Login } from "./features/auth/Login.jsx";
import { WorkspacePanel } from "./features/workspace/WorkspacePanel.jsx";
import { EnvironmentsPanel } from "./features/environments/EnvironmentsPanel.jsx";
import { WorkflowsPanel } from "./features/workflows/WorkflowsPanel.jsx";
import { HistoryPanel } from "./features/executions/HistoryPanel.jsx";
import { environmentsApi } from "./features/environments/environments.api.js";
import { hasSessionToken, setSessionToken } from "./shared/api/client.js";
import { applyTheme, readTheme } from "./shared/utils/theme.js";

const TABS = [
	{ id: "workspace", label: "Workspace" },
	{ id: "workflows", label: "Workflows" },
	{ id: "environments", label: "Environments" },
	{ id: "history", label: "History" },
];

function BootScreen() {
	return (
		<main className="app-boot" role="status" aria-label="Loading Ahal">
			<div className="spinner" />
		</main>
	);
}

const THEME_OPTIONS = [
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
];

function ThemeToggle() {
	const [theme, setTheme] = useState(readTheme);
	return (
		<div className="theme-toggle" role="group" aria-label="Appearance">
			{THEME_OPTIONS.map((option) => (
				<button key={option.value} type="button" aria-pressed={theme === option.value} onClick={() => setTheme(applyTheme(option.value))}>
					{option.label}
				</button>
			))}
		</div>
	);
}

function AppShell({ account, onLogout }) {
	const [tab, setTab] = useState("workspace");
	const [environments, setEnvironments] = useState([]);
	const [activeEnvironmentId, setActiveEnvironmentId] = useState(null);

	const loadEnvironments = useCallback(async () => {
		const list = await environmentsApi.list();
		setEnvironments(list);
		setActiveEnvironmentId((current) => current || list.find((environment) => environment.isActive)?._id || list[0]?._id || null);
	}, []);

	useEffect(() => {
		loadEnvironments();
	}, [loadEnvironments]);

	return (
		<div className="app-shell">
			<header className="app-header">
				<div className="app-brand">
					<img src="/favicon.svg" alt="" width="24" height="24" />
					<span>Ahal</span>
				</div>
				<nav className="app-tabs" role="tablist">
					{TABS.map((item) => (
						<button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)} role="tab" aria-selected={tab === item.id}>
							{item.label}
						</button>
					))}
				</nav>
				<div className="app-header-right">
					<ThemeToggle />
					<span className="muted">{account.email}</span>
					<button className="btn btn-ghost btn-small" onClick={onLogout}>
						Sign out
					</button>
				</div>
			</header>
			<main className="app-main">
				{tab === "workspace" && <WorkspacePanel environments={environments} activeEnvironmentId={activeEnvironmentId} onEnvironmentChange={setActiveEnvironmentId} />}
				{tab === "workflows" && <WorkflowsPanel environments={environments} activeEnvironmentId={activeEnvironmentId} onEnvironmentChange={setActiveEnvironmentId} />}
				{tab === "environments" && <EnvironmentsPanel environments={environments} onChanged={loadEnvironments} />}
				{tab === "history" && <HistoryPanel />}
			</main>
		</div>
	);
}

export default function App() {
	const [account, setAccount] = useState(null);
	const [bootstrapping, setBootstrapping] = useState(true);
	const [authLoading, setAuthLoading] = useState(false);
	const [authError, setAuthError] = useState("");

	useEffect(() => {
		const expire = (event) => {
			setSessionToken("");
			setAccount(null);
			setAuthError(event.detail || "Your Ahal session has expired.");
		};
		window.addEventListener("ahal-session-expired", expire);
		return () => window.removeEventListener("ahal-session-expired", expire);
	}, []);

	useEffect(() => {
		let active = true;
		(async () => {
			if (!hasSessionToken()) {
				setBootstrapping(false);
				return;
			}
			try {
				const session = await authApi.session();
				if (active) setAccount(session.account);
			} catch {
				setSessionToken("");
			} finally {
				if (active) setBootstrapping(false);
			}
		})();
		return () => {
			active = false;
		};
	}, []);

	const login = async (email, password) => {
		try {
			setAuthLoading(true);
			setAuthError("");
			const result = await authApi.login(email, password);
			setSessionToken(result.token);
			setAccount(result.account);
		} catch (error) {
			setAuthError(error.message);
		} finally {
			setAuthLoading(false);
		}
	};

	const register = async (name, email, password) => {
		try {
			setAuthLoading(true);
			setAuthError("");
			const result = await authApi.register(name, email, password);
			setSessionToken(result.token);
			setAccount(result.account);
		} catch (error) {
			setAuthError(error.message);
		} finally {
			setAuthLoading(false);
		}
	};

	const logout = async () => {
		try {
			await authApi.logout();
		} catch {
			// Already signed out client-side regardless of whether the server call succeeds.
		}
		setSessionToken("");
		setAccount(null);
	};

	if (bootstrapping) return <BootScreen />;
	if (!account) return <Login onLogin={login} onRegister={register} loading={authLoading} error={authError} />;
	return <AppShell account={account} onLogout={logout} />;
}
