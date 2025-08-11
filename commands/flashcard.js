const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("flashcard")
		.setDescription("🗒️単語帳で勉強したり、単語帳の管理が出来ます！")
		.addSubcommandGroup((subcommands) =>
			subcommands
				.setName("card")
				.setDescription("カードに関する操作を行います。")
				.addSubcommand((subcommand) =>
					subcommand
						.setName("create")
						.setDescription("新しいカードを作成します。")
						.addStringOption((option) =>
							option
								.setName("word")
								.setDescription(
									"カードの表面(英語など)の単語を入力してください。"
								)
								.setRequired(true)
						)
						.addStringOption((option) =>
							option
								.setName("answer")
								.setDescription(
									"カードの裏面(日本語など)の答えを入力してください。"
								)
								.setRequired(true)
						)
						.addStringOption((option) =>
							option
								.setName("category")
								.setDescription(
									"このカードのカテゴリーを選択してください。なお、カテゴリーは「/flashcard category create」コマンドで作成できます。"
								)
								.setAutocomplete(true)
								.setRequired(false)
						)
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("list")
						.setDescription("カードの一覧を表示します。")
						.addStringOption((option) =>
							option
								.setName("category")
								.setDescription("表示するカテゴリーを選択してください。")
								.setRequired(false)
						)
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("delete")
						.setDescription("カードを削除します。")
						.addStringOption((option) =>
							option
								.setName("word")
								.setDescription(
									"削除するカードの表面の単語を入力してください。"
								)
								.setRequired(true)
						)
				)
		)
		.addSubcommandGroup((subcommands) =>
			subcommands
				.setName("category")
				.setDescription("カテゴリーに関する操作を行います。")
				.addSubcommand((subcommand) =>
					subcommand
						.setName("create")
						.setDescription("新しいカテゴリーを作成します。")
						.addStringOption((option) =>
							option
								.setName("name")
								.setDescription("カテゴリーの名前を入力してください。")
								.setRequired(true)
						)
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("delete")
						.setDescription("カテゴリーを削除します。")
						.addStringOption((option) =>
							option
								.setName("name")
								.setDescription("削除するカテゴリーの名前を入力してください。")
								.setRequired(true)
						)
				)
		),

	run: async (client, interaction) => {
		try {
			await interaction.reply("このコマンドはまだ実装されていません。");
		} catch (err) {
			const errorNotification = require("../lib/errorNotification.js");
			errorNotification(client, interaction, err);
		}
	},
};
