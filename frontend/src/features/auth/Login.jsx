import { useState } from "react";

export function Login({ onLogin, onRegister, loading, error }) {
	const [mode, setMode] = useState("login");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("demo@ahal.dev");
	const [password, setPassword] = useState("password123");

	const submit = (event) => {
		event.preventDefault();
		if (mode === "login") onLogin(email, password);
		else onRegister(name, email, password);
	};

	return (
		<main className="auth-screen">
			<form className="auth-card" onSubmit={submit}>
				<div className="auth-brand">
					<img src="/favicon.svg" alt="" width="32" height="32" />
					<span>Ahal</span>
				</div>
				<p className="auth-subtitle">API Reliability Workbench</p>
				<div className="auth-tabs" role="tablist">
					<button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")} role="tab" aria-selected={mode === "login"}>
						Sign in
					</button>
					<button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")} role="tab" aria-selected={mode === "register"}>
						Create account
					</button>
				</div>
				{mode === "register" && (
					<label className="field">
						<span>Name</span>
						<input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
					</label>
				)}
				<label className="field">
					<span>Email</span>
					<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
				</label>
				<label className="field">
					<span>Password</span>
					<input required type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
				</label>
				{error && (
					<div className="auth-error" role="alert">
						{error}
					</div>
				)}
				<button className="btn btn-primary btn-block" type="submit" disabled={loading}>
					{loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
				</button>
				<p className="auth-hint">Demo account: demo@ahal.dev / password123</p>
			</form>
		</main>
	);
}
