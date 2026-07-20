
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/private';
 * 
 * console.log(ENVIRONMENT); // => "production"
 * console.log(PUBLIC_BASE_URL); // => throws error during build
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/private' {
	export const SVELTEKIT_FORK: string;
	export const INIT_CWD: string;
	export const EDITOR: string;
	export const METABASE_PASSWORD: string;
	export const DEVIN_API_KEY: string;
	export const npm_config_prefix: string;
	export const _: string;
	export const COLOR: string;
	export const Google_Account_google_password: string;
	export const HOME: string;
	export const VISUAL: string;
	export const npm_config_npm_version: string;
	export const RUST_LOG: string;
	export const npm_config_globalconfig: string;
	export const SYSTEMD_EXEC_PID: string;
	export const Slack_Account_slack_email: string;
	export const METABASE_USERNAME: string;
	export const DEBIAN_FRONTEND: string;
	export const npm_config_local_prefix: string;
	export const BUN_INSTALL: string;
	export const NODE_ENV: string;
	export const openai_api_key: string;
	export const __COG_BASH_ENV_SOURCED: string;
	export const devin_api_key: string;
	export const npm_config_userconfig: string;
	export const Google_Account_google_email: string;
	export const npm_api_token: string;
	export const Slack_Account_slack_password: string;
	export const SHLVL: string;
	export const npm_node_execpath: string;
	export const Github_Account_Credentials_rbtunes0_gmail_com: string;
	export const USER: string;
	export const npm_config_noproxy: string;
	export const BROWSER: string;
	export const OLDPWD: string;
	export const ENVRC: string;
	export const JOURNAL_STREAM: string;
	export const test: string;
	export const npm_package_json: string;
	export const DEVIN_DISABLE_HISTEXPAND: string;
	export const GIT_EDITOR: string;
	export const npm_config_cache: string;
	export const PATH: string;
	export const LOGNAME: string;
	export const npm_command: string;
	export const Figma_token: string;
	export const LANG: string;
	export const INVOCATION_ID: string;
	export const NODE: string;
	export const GIT_TERMINAL_PROMPT: string;
	export const Github_Personal_Access_Token: string;
	export const npm_package_name: string;
	export const npm_lifecycle_event: string;
	export const __COG_SKIP_PYENV: string;
	export const DISPLAY: string;
	export const npm_config_loglevel: string;
	export const npm_lifecycle_script: string;
	export const npm_config_global_prefix: string;
	export const npm_config_node_gyp: string;
	export const SHELL: string;
	export const npm_execpath: string;
	export const npm_config_user_agent: string;
	export const __COG_SHELL_INTEGRATION_SCRIPT: string;
	export const BASH_ENV: string;
	export const npm_config_init_module: string;
	export const PWD: string;
}

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/public';
 * 
 * console.log(ENVIRONMENT); // => throws error during build
 * console.log(PUBLIC_BASE_URL); // => "http://site.com"
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * 
 * console.log(env.ENVIRONMENT); // => "production"
 * console.log(env.PUBLIC_BASE_URL); // => undefined
 * ```
 */
declare module '$env/dynamic/private' {
	export const env: {
		SVELTEKIT_FORK: string;
		INIT_CWD: string;
		EDITOR: string;
		METABASE_PASSWORD: string;
		DEVIN_API_KEY: string;
		npm_config_prefix: string;
		_: string;
		COLOR: string;
		Google_Account_google_password: string;
		HOME: string;
		VISUAL: string;
		npm_config_npm_version: string;
		RUST_LOG: string;
		npm_config_globalconfig: string;
		SYSTEMD_EXEC_PID: string;
		Slack_Account_slack_email: string;
		METABASE_USERNAME: string;
		DEBIAN_FRONTEND: string;
		npm_config_local_prefix: string;
		BUN_INSTALL: string;
		NODE_ENV: string;
		openai_api_key: string;
		__COG_BASH_ENV_SOURCED: string;
		devin_api_key: string;
		npm_config_userconfig: string;
		Google_Account_google_email: string;
		npm_api_token: string;
		Slack_Account_slack_password: string;
		SHLVL: string;
		npm_node_execpath: string;
		Github_Account_Credentials_rbtunes0_gmail_com: string;
		USER: string;
		npm_config_noproxy: string;
		BROWSER: string;
		OLDPWD: string;
		ENVRC: string;
		JOURNAL_STREAM: string;
		test: string;
		npm_package_json: string;
		DEVIN_DISABLE_HISTEXPAND: string;
		GIT_EDITOR: string;
		npm_config_cache: string;
		PATH: string;
		LOGNAME: string;
		npm_command: string;
		Figma_token: string;
		LANG: string;
		INVOCATION_ID: string;
		NODE: string;
		GIT_TERMINAL_PROMPT: string;
		Github_Personal_Access_Token: string;
		npm_package_name: string;
		npm_lifecycle_event: string;
		__COG_SKIP_PYENV: string;
		DISPLAY: string;
		npm_config_loglevel: string;
		npm_lifecycle_script: string;
		npm_config_global_prefix: string;
		npm_config_node_gyp: string;
		SHELL: string;
		npm_execpath: string;
		npm_config_user_agent: string;
		__COG_SHELL_INTEGRATION_SCRIPT: string;
		BASH_ENV: string;
		npm_config_init_module: string;
		PWD: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://example.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.ENVIRONMENT); // => undefined, not public
 * console.log(env.PUBLIC_BASE_URL); // => "http://example.com"
 * ```
 * 
 * ```
 * 
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
