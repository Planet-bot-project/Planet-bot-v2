import js from "@eslint/js";

export default [
	js.configs.recommended,
	{
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "module",
			globals: {
				process: "readonly",
				console: "readonly",
				Buffer: "readonly",
				__dirname: "readonly",
				__filename: "readonly",
				global: "readonly",
				module: "readonly",
				require: "readonly",
				exports: "readonly",
				setTimeout: "readonly",
				clearTimeout: "readonly",
				setInterval: "readonly",
				clearInterval: "readonly",
				setImmediate: "readonly",
				clearImmediate: "readonly",
			},
		},
		rules: {
			// 基本的なコード品質ルール
			"no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
			"no-console": "off", // ログ出力のため許可
			"no-debugger": "error",
			"no-alert": "error",

			// コードスタイルルール
			indent: ["error", 2, { SwitchCase: 1 }],
			quotes: ["error", "single", { avoidEscape: true }],
			semi: ["error", "always"],
			"comma-dangle": ["error", "never"],
			"no-trailing-spaces": "error",
			"eol-last": "error",

			// ベストプラクティス
			eqeqeq: ["error", "always"],
			"no-var": "error",
			"prefer-const": "error",
			"prefer-arrow-callback": "error",
			"arrow-spacing": "error",
			"object-curly-spacing": ["error", "always"],
			"array-bracket-spacing": ["error", "never"],
			"comma-spacing": ["error", { before: false, after: true }],
			"key-spacing": ["error", { beforeColon: false, afterColon: true }],

			// 非同期処理
			"no-async-promise-executor": "error",
			"prefer-promise-reject-errors": "error",
			"require-await": "error",

			// セキュリティ
			"no-eval": "error",
			"no-implied-eval": "error",
			"no-new-func": "error",
		},
	},
	{
		// 特定のファイルタイプの設定
		files: ["**/*.js"],
		languageOptions: {
			sourceType: "commonjs",
		},
	},
	{
		// 無視するファイル/ディレクトリ
		ignores: [
			"node_modules/**",
			"lib/pomodoro/voicevox/**",
			"*.min.js",
			"dist/**",
			"build/**",
		],
	},
];
