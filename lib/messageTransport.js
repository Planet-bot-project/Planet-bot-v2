// 特定のキーと値に一致するエントリを抽出する関数
function filterMapByKeyValue(map, key, value) {
	const result = new Map();
	for (const [mapKey, mapValue] of map.entries()) {
		if (mapValue[key].startsWith(value)) {
			result.set(mapKey, mapValue);
		}
	}
	return result;
}

//メッセージ展開
// 引数：　client:discordBOTのクライアント,message:転送対象のメッセージ,sendChannelId:転送先チャンネルID, isDM:転送先がDMかを指定
async function messageTransport(client, message, sendChannelId, isDM) {
	const {
		ActionRowBuilder,
		ButtonBuilder,
		ButtonStyle,
		EmbedBuilder,
	} = require("discord.js");

	try {
		// button生成
		let guideButton = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setLabel("メッセージを見る")
				.setURL(message.url)
				.setStyle(ButtonStyle.Link),
			new ButtonBuilder()
				.setCustomId("cancel")
				.setEmoji("🗑️")
				.setStyle(ButtonStyle.Secondary)
		);
		let notificationButton = new ActionRowBuilder();

		let embed = new EmbedBuilder()
			.setURL(message.url)
			.setDescription(
				message.content ? message.content : "\u200B" //contentに何もなければゼロ幅スペースを入力
			)
			.setAuthor({
				name: message.author.tag,
				iconURL: message.author.displayAvatarURL(),
			})
			.setColor(0x4d4df7)
			.setTimestamp(new Date(message.createdTimestamp));

		// 添付ファイル関連処理
		let imageEmbed = [];
		if (message.attachments.size > 0) {
			// 画像添付ファイル処理
			let attachedImages = filterMapByKeyValue(
				message.attachments,
				"contentType",
				"image/"
			);
			if (attachedImages.size >= 2) {
				attachedImages.forEach((attachedImage) => {
					let attachmentField = {
						url: message.url,
						image: {
							url: attachedImage.url,
						},
					};
					imageEmbed.push(attachmentField);
				});
			}
			if (attachedImages.size > 4) {
				notificationButton.addComponents(
					new ButtonBuilder()
						.setCustomId("dummy0")
						.setEmoji("⚠️")
						.setLabel("元メッセージに5枚以上の画像あり")
						.setDisabled(true)
						.setStyle(ButtonStyle.Secondary)
				);
			}

			// 画像以外の添付ファイル処理
			if (message.attachments.size != attachedImages.size) {
				notificationButton.addComponents(
					new ButtonBuilder()
						.setCustomId("dummy1")
						.setEmoji("⚠️")
						.setLabel("元メッセージに画像以外の添付ファイルあり")
						.setDisabled(true)
						.setStyle(ButtonStyle.Secondary)
				);
			}
		}

		// 埋め込みがある場合
		if (message.embeds.length) {
			notificationButton.addComponents(
				new ButtonBuilder()
					.setCustomId("dummy2")
					.setEmoji("⚠️")
					.setLabel("元メッセージに埋め込みあり")
					.setDisabled(true)
					.setStyle(ButtonStyle.Secondary)
			);
		}

		let sendChannel,
			file = [];
		if (isDM) {
			sendChannel = await client.users.fetch(sendChannelId);

			const guildIcon = message.guild.iconURL();
			embed.setFooter({
				text: `${message.guild.name}より`,
				iconURL: guildIcon || "attachment://image.png",
			});

			if (!guildIcon) {
				file = [
					{
						attachment: "assets/images/no_image.png",
						name: "image.png",
					},
				];
			}
		} else {
			sendChannel = await client.channels.fetch(sendChannelId);
		}
		sendChannel.send({
			embeds: [embed].concat(imageEmbed),
			components: notificationButton.components.length
				? [guideButton, notificationButton]
				: [guideButton],
			files: file,
		});
	} catch (err) {
		console.log(err);
	}
}

module.exports = messageTransport;
