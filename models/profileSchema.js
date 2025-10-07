const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
	{
		_id: { type: String }, //サーバーID
		sticky: {
			status: { type: Boolean }, //スティッキーメッセージの有効/無効
			channels: [
				{
					_id: { type: String },
					stickyMessage: {
						oldMessageId: { type: String }, //送信済みメッセージのメッセージID
						message: {
							title: { type: String },
							body: { type: String },
							imageURL: { type: String },
						},
					},
				},
			], //スティッキーメッセージのチャンネルIDとメッセージ
		},
		starboard: {
			status: { type: Boolean }, //スターボードの有効/無効
			board: [
				{
					_id: { type: String }, //スターボードのチャンネルID
					emoji: { type: String }, //スターボードの投票カウントをする絵文字の設定
					emojiAmount: { type: Number }, //スターボードに表示するスターの数
				},
			],
			transportedMessages: [{ type: String }],
		},
		pomodoro: {
			defaultWorkTime: { type: Number, default: 25 }, //デフォルトの作業時間（分）
			defaultBreakTime: { type: Number, default: 5 }, //デフォルトの休憩時間（分）
			defaultLongBreakTime: { type: Number, default: 15 }, //デフォルトの長い休憩時間（分）
			defaultCycleCount: { type: Number, default: 4 }, //デフォルトのポモドーロセッションの回数
			defaultVoiceNotification: { type: Boolean, default: false }, //ボイス通知の有効/無効
			defaultVoiceNotificationVolume: { type: Number, default: 50 }, //ボイス通知の音量（1-100%）
		},
		flashcards: [
			{
				userId: { type: String, required: true }, //ユーザーID
				categories: { type: [String], default: ['一般'] }, //利用可能なカテゴリー一覧
				cards: [
					{
						_id: { type: String }, //フラッシュカードのユニークID
						word: { type: String, required: true }, //キーワード（表面）
						meaning: { type: String, required: true }, //定義（裏面）
						category: { type: String, default: '一般' }, //カテゴリ
						createdAt: { type: Date, default: Date.now }, //作成日時
						lastReviewed: { type: Date }, //最後に確認した日時
						reviewCount: { type: Number, default: 0 }, //確認回数
						correctCount: { type: Number, default: 0 }, //正解回数
						incorrectCount: { type: Number, default: 0 }, //不正解回数
					},
				],
			},
		],
	},
	{ versionKey: false },
);

const model = mongoose.model('servers', profileSchema);

module.exports = model;
