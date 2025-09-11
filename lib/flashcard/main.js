const mongoose = require("mongoose");
const profileSchema = require("../../models/profileSchema");

/**
 * ユーザーのフラッシュカードセクションを初期化する
 * @param {string} serverId - サーバーID
 * @param {string} userId - ユーザーID
 * @returns {Promise<void>}
 */
async function ensureUserFlashcardsExist(serverId, userId) {
	try {
		// ユーザーのフラッシュカードセクションが存在するかチェック
		const server = await profileSchema.findOne({
			_id: serverId,
			"flashcards.userId": userId,
		});

		if (!server) {
			// ユーザーのフラッシュカードセクションが存在しない場合は作成
			await profileSchema.updateOne(
				{ _id: serverId },
				{
					$push: { flashcards: { userId: userId, cards: [] } },
					$setOnInsert: { _id: serverId },
				},
				{ upsert: true }
			);
		}
	} catch (error) {
		console.error("ユーザーフラッシュカードセクション初期化エラー:", error);
		throw error;
	}
}

/**
 * フラッシュカードを追加する
 * @param {string} serverId - サーバーID
 * @param {string} userId - ユーザーID
 * @param {string} word - キーワード（表面）
 * @param {string} meaning - 定義（裏面）
 * @param {string} category - カテゴリー（オプション）
 * @returns {Promise<object>} 作成されたフラッシュカード
 */
async function add(serverId, userId, word, meaning, category) {
	try {
		// キーワードの重複チェック
		const existingCard = await get(serverId, userId, { word: word });
		if (existingCard) {
			existingCard[0].alreadyExists = true;
			return existingCard[0]; // 既に存在する場合はそのカードを返す
		}

		const cardId = new mongoose.Types.ObjectId().toString();
		const newCard = {
			_id: cardId,
			word: word.trim(),
			meaning: meaning.trim(),
			category: category || "一般",
			createdAt: new Date(),
			reviewCount: 0,
			correctCount: 0,
			incorrectCount: 0,
		};

		// サーバーとユーザーのフラッシュカードセクションが存在するかチェック
		const server = await profileSchema.findOne({
			_id: serverId,
			"flashcards.userId": userId,
		});

		if (server) {
			// 既存のユーザーのフラッシュカードセクションにカードを追加
			await profileSchema.updateOne(
				{ _id: serverId, "flashcards.userId": userId },
				{ $push: { "flashcards.$.cards": newCard } }
			);
		} else {
			// サーバーまたはユーザーのフラッシュカードセクションが存在しない場合
			await profileSchema.updateOne(
				{ _id: serverId },
				{
					$push: { flashcards: { userId: userId, cards: [newCard] } },
					$setOnInsert: { _id: serverId },
				},
				{ upsert: true }
			);
		}

		return newCard;
	} catch (error) {
		console.error("フラッシュカード追加エラー:", error);
		throw error;
	}
}

/**
 * フラッシュカードを削除する
 * @param {string} serverId - サーバーID
 * @param {string} userId - ユーザーID
 * @param {string} word - 削除するキーワード
 * @returns {Promise<boolean>} 削除成功の可否
 */
async function remove(serverId, userId, word) {
	try {
		const result = await profileSchema.updateOne(
			{ _id: serverId, "flashcards.userId": userId },
			{ $pull: { "flashcards.$.cards": { word: word.trim() } } }
		);

		return result.modifiedCount > 0;
	} catch (error) {
		console.error("フラッシュカード削除エラー:", error);
		throw error;
	}
}

/**
 * フラッシュカードを取得する（filterオブジェクトで条件指定可能）
 * @param {string} serverId - サーバーID
 * @param {string} userId - ユーザーID
 * @param {object} [filter] - フィルター条件（例: {word, category}）
 * @returns {Promise<Array|null>} フラッシュカード
 */
async function get(serverId, userId, filter = {}) {
	try {
		const server = await profileSchema.findOne(
			{ _id: serverId },
			{ flashcards: 1 }
		);

		if (!server || !server.flashcards) {
			return null;
		}

		// ユーザーのフラッシュカードセクションを探す
		const userFlashcards = server.flashcards.find((fc) => fc.userId === userId);
		if (!userFlashcards || !userFlashcards.cards) {
			return null;
		}

		let filteredCards = userFlashcards.cards;
		if (filter.word) {
			filteredCards = filteredCards.filter(
				(card) => card.word.toLowerCase() === filter.word.trim().toLowerCase()
			);
		}
		if (filter.category) {
			filteredCards = filteredCards.filter(
				(card) => card.category === filter.category
			);
		}

		return filteredCards.length > 0 ? filteredCards : null;
	} catch (error) {
		console.error("フラッシュカード取得エラー:", error);
		throw error;
	}
}

/**
 * フラッシュカードを編集する
 * @param {string} serverId - サーバーID
 * @param {string} userId - ユーザーID
 * @param {string} word - 編集するキーワード
 * @param {object} updatedFlashcard - 更新内容
 * @returns {Promise<object|null>} 更新されたフラッシュカード
 */
async function edit(serverId, userId, word, updatedFlashcard) {
	try {
		const existingCard = await get(serverId, userId, { word: word });
		if (!existingCard) {
			return null;
		}

		const updateFields = {};
		if (updatedFlashcard.meaning !== undefined) {
			updateFields["flashcards.$[user].cards.$[card].meaning"] =
				updatedFlashcard.meaning.trim();
		}
		if (updatedFlashcard.category !== undefined) {
			updateFields["flashcards.$[user].cards.$[card].category"] =
				updatedFlashcard.category;
		}

		const result = await profileSchema.updateOne(
			{ _id: serverId },
			{ $set: updateFields },
			{
				arrayFilters: [{ "user.userId": userId }, { "card.word": word.trim() }],
			}
		);

		if (result.modifiedCount > 0) {
			const updatedCard = await get(serverId, userId, { word: word });
			return updatedCard ? updatedCard[0] : null;
		}

		return null;
	} catch (error) {
		console.error("フラッシュカード編集エラー:", error);
		throw error;
	}
}
/**
 * ユーザーのすべてのフラッシュカードを削除する
 * @param {string} serverId - サーバーID
 * @param {string} userId - ユーザーID
 * @returns {Promise<boolean>} 削除成功の可否
 */
async function clear(serverId, userId) {
	try {
		// ユーザーのフラッシュカードセクションが存在することを確認
		await ensureUserFlashcardsExist(serverId, userId);

		const result = await profileSchema.updateOne(
			{ _id: serverId, "flashcards.userId": userId },
			{ $set: { "flashcards.$.cards": [] } }
		);

		return result.modifiedCount > 0;
	} catch (error) {
		console.error("フラッシュカード全削除エラー:", error);
		throw error;
	}
}

/**
 * ランダムなフラッシュカードを取得する
 * @param {string} serverId - サーバーID
 * @param {string} userId - ユーザーID
 * @param {object} filters - フィルター条件（category）
 * @returns {Promise<object|null>} ランダムなフラッシュカード
 */
async function getRandom(serverId, userId, filters = {}) {
	try {
		const cards = await get(serverId, userId, filters);
		if (!cards || cards.length === 0) {
			return null;
		}

		const randomIndex = Math.floor(Math.random() * cards.length);
		return cards[randomIndex];
	} catch (error) {
		console.error("ランダムフラッシュカード取得エラー:", error);
		throw error;
	}
}

/**
 * フラッシュカードの復習記録を更新する
 * @param {string} serverId - サーバーID
 * @param {string} userId - ユーザーID
 * @param {string} word - キーワード
 * @param {boolean} isCorrect - 正解かどうか
 * @returns {Promise<object|null>} 更新されたフラッシュカード
 */
async function updateReview(serverId, userId, word, isCorrect) {
	try {
		const updateFields = {
			"flashcards.$[user].cards.$[card].lastReviewed": new Date(),
		};

		const incFields = {
			"flashcards.$[user].cards.$[card].reviewCount": 1,
		};

		if (isCorrect) {
			incFields["flashcards.$[user].cards.$[card].correctCount"] = 1;
		} else {
			incFields["flashcards.$[user].cards.$[card].incorrectCount"] = 1;
		}

		const result = await profileSchema.updateOne(
			{ _id: serverId },
			{
				$set: updateFields,
				$inc: incFields,
			},
			{
				arrayFilters: [{ "user.userId": userId }, { "card.word": word.trim() }],
			}
		);

		if (result.modifiedCount > 0) {
			const updatedCard = await get(serverId, userId, { word: word });
			return updatedCard ? updatedCard[0] : null;
		}

		return null;
	} catch (error) {
		console.error("復習記録更新エラー:", error);
		throw error;
	}
}
/**
 * カテゴリ一覧を取得する
 * @param {string} serverId - サーバーID
 * @param {string} userId - ユーザーID
 * @returns {Promise<Array>} カテゴリの配列
 */
async function getCategories(serverId, userId) {
	try {
		const cards = await get(serverId, userId);
		if (!cards || cards.length === 0) {
			return [];
		}
		const categories = [...new Set(cards.map((card) => card.category))];
		return categories.sort();
	} catch (error) {
		console.error("カテゴリ一覧取得エラー:", error);
		throw error;
	}
}

/**
 * 統計情報を取得する
 * @param {string} serverId - サーバーID
 * @param {string} userId - ユーザーID
 * @returns {Promise<object>} 統計情報
 */
async function getStats(serverId, userId) {
	try {
		const cards = (await get(serverId, userId)) || [];

		const stats = {
			totalCards: cards.length,
			totalReviews: cards.reduce((sum, card) => sum + card.reviewCount, 0),
			totalCorrect: cards.reduce((sum, card) => sum + card.correctCount, 0),
			totalIncorrect: cards.reduce((sum, card) => sum + card.incorrectCount, 0),
			averageAccuracy: 0,
			categoryCounts: {},
		};

		// 正解率を計算
		if (stats.totalReviews > 0) {
			stats.averageAccuracy = (stats.totalCorrect / stats.totalReviews) * 100;
		}

		// カテゴリ別カウント
		cards.forEach((card) => {
			stats.categoryCounts[card.category] =
				(stats.categoryCounts[card.category] || 0) + 1;
		});

		return stats;
	} catch (error) {
		console.error("統計情報取得エラー:", error);
		throw error;
	}
}

module.exports = {
	add,
	remove,
	get,
	getRandom,
	edit,
	clear,
	updateReview,
	getCategories,
	getStats,
	ensureUserFlashcardsExist,
};
