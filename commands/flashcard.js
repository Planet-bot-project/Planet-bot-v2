const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const flashcard = require("../lib/flashcard/main.js");

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
								.setName("meaning")
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
			let subcommandGroup = interaction.options.getSubcommandGroup();
			let subcommand = interaction.options.getSubcommand();

			// カードに関するサブコマンド
			switch (subcommandGroup) {
				case "card":
					switch (subcommand) {
						case "create":
							// カード作成のロジック
							const word = interaction.options.getString("word");
							const meaning = interaction.options.getString("meaning");
							const category = interaction.options.getString("category");
							let card = await flashcard.add(
								interaction.guild.id,
								interaction.user.id,
								word,
								meaning,
								category
							);
							if (card && !card?.alreadyExists) {
								await interaction.reply({
									content: `カードが作成されました！\n表面: ${card.word}\n裏面: ${card.meaning}\nカテゴリー: ${card.category}`,
								});
							} else if (card && card?.alreadyExists) {
								await interaction.reply({
									content: `そのキーワードのカードは既に存在します！更新する場合は「/flashcard card edit」コマンドを使用してください。\n表面: ${card.word}\n裏面: ${card.meaning}\nカテゴリー: ${card.category}`,
								});
							} else {
								await interaction.reply({
									content:
										"カードの作成に失敗しました。不明なエラーが発生した可能性が有ります。時間を空けて再度お試しください。",
									flags: MessageFlags.Ephemeral,
								});
							}
							break;
						case "list":
							// カード一覧表示のロジック
							break;
						case "delete":
							// カード削除のロジック
							break;
					}
					break;
				case "category":
					switch (subcommand) {
						case "create":
							// カテゴリー作成のロジック
							break;
						case "list":
							// カテゴリー一覧表示のロジック
							break;
						case "delete":
							// カテゴリー削除のロジック
							break;
					}
					break;
			}
			await interaction.reply("このコマンドはまだ実装されていません。");
		} catch (err) {
			const errorNotification = require("../lib/errorNotification.js");
			errorNotification(client, interaction, err);
		}
	},
};
