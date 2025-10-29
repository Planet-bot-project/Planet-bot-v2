const mongoose = require('mongoose');
const profileSchema = require('../../models/profileSchema');

/**
 * カテゴリーが有効かどうかをチェックする
 * @param {string} serverId - サーバーID
 * @param {string} userId - ユーザーID
 * @param {string} category - チェックするカテゴリー名
 * @returns {Promise<object>} カテゴリーが有効かどうか
 */
async function isValidCategory(serverId, userId, category) {
	try {
		// 「一般」は常に有効
		if (category === '一般') {
			return { success: true, data: true };
		}

		const server = await profileSchema.findOne({
			_id: serverId,
			'flashcards.userId': userId,
		});

		if (!server) {
			return { success: true, data: false };
		}

		const userFlashcards = server.flashcards.find((fc) => fc.userId === userId);
		if (!userFlashcards) {
			return { success: true, data: false };
		}

		return {
			success: true,
			data: userFlashcards.categories.includes(category),
		};
	} catch (error) {
		console.error('カテゴリー有効性チェックエラー:', error);
		return {
			success: false,
			error: 'カテゴリー有効性チェック中にエラーが発生しました。',
		};
	}
}

/**
 * ユーザーのフラッシュカードセクションを初期化する
 * @param {string} serverId - サーバーID
 * @param {string} userId - ユーザーID
 * @returns {Promise<object>} 処理結果
 */
async function ensureUserFlashcardsExist(serverId, userId) {
	try {
		// ユーザーのフラッシュカードセクションが存在するかチェック
		const server = await profileSchema.findOne({
			_id: serverId,
			'flashcards.userId': userId,
		});

		if (!server) {
			// ユーザーのフラッシュカードセクションが存在しない場合は作成
			await profileSchema.updateOne(
				{ _id: serverId },
				{
					$push: {
						flashcards: { userId: userId, categories: ['一般'], cards: [] },
					},
					$setOnInsert: { _id: serverId },
				},
				{ upsert: true },
			);
		}

		return { success: true };
	} catch (error) {
		console.error('ユーザーフラッシュカードセクション初期化エラー:', error);
		return {
			success: false,
			error:
				'ユーザーフラッシュカードセクションの初期化中にエラーが発生しました。',
		};
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
		// カテゴリーの有効性チェック
		const targetCategory = category || '一般';
		const isValidResult = await isValidCategory(
			serverId,
			userId,
			targetCategory,
		);
		if (!isValidResult.success) {
			return isValidResult;
		}
		if (!isValidResult.data) {
			return {
				success: false,
				error: `カテゴリー「${targetCategory}」は存在しません。先に「/flashcard category create」コマンドでカテゴリーを作成してください。`,
			};
		}

		// キーワードの重複チェック
		const existingCard = await getCard(serverId, userId, { word: word });
		if (existingCard && existingCard.success && existingCard.data) {
			existingCard.data[0].alreadyExists = true;
			return { success: true, data: existingCard.data[0] }; // 既に存在する場合はそのカードを返す
		}

		const cardId = new mongoose.Types.ObjectId().toString();
		const newCard = {
			_id: cardId,
			word: word.trim(),
			meaning: meaning.trim(),
			category: targetCategory,
			createdAt: new Date(),
			reviewCount: 0,
			correctCount: 0,
			incorrectCount: 0,
		};

		// サーバーとユーザーのフラッシュカードセクションが存在するかチェック
		const server = await profileSchema.findOne({
			_id: serverId,
			'flashcards.userId': userId,
		});

		if (server) {
			// 既存のユーザーのフラッシュカードセクションにカードを追加
			await profileSchema.updateOne(
				{ _id: serverId, 'flashcards.userId': userId },
				{ $push: { 'flashcards.$.cards': newCard } },
			);
		} else {
			// サーバーまたはユーザーのフラッシュカードセクションが存在しない場合
			await profileSchema.updateOne(
				{ _id: serverId },
				{
					$push: {
						flashcards: {
							userId: userId,
							categories: ['一般'],
							cards: [newCard],
						},
					},
					$setOnInsert: { _id: serverId },
				},
				{ upsert: true },
			);
		}

		return { success: true, data: newCard };
	} catch (error) {
		console.error('フラッシュカード追加エラー:', error);
		return {
			success: false,
			error: 'フラッシュカードの追加中にエラーが発生しました。',
		};
	}
}

/**
 * フラッシュカードを削除する
 * @param {string} serverId - サーバーID
 * @param {string} userId - ユーザーID
 * @param {string} word - 削除するキーワード
 * @returns {Promise<object>} 削除結果
 */
async function deleteCard(serverId, userId, word) {
	try {
		const result = await profileSchema.updateOne(
			{ _id: serverId, 'flashcards.userId': userId },
			{ $pull: { 'flashcards.$.cards': { word: word.trim() } } },
		);

		return {
			success: result.modifiedCount > 0,
			data: result.modifiedCount > 0,
		};
	} catch (error) {
		console.error('フラッシュカード削除エラー:', error);
		return {
			success: false,
			error: 'フラッシュカードの削除中にエラーが発生しました。',
		};
	}
}

/**
 * フラッシュカードを取得する（filterオブジェクトで条件指定可能）
 * @param {string} serverId - サーバーID
 * @param {string} userId - ユーザーID
 * @param {object} [filter] - フィルター条件（例: {word, category}）
 * @returns {Promise<object>} フラッシュカード取得結果
 */
async function getCard(serverId, userId, filter = {}) {
	try {
		const server = await profileSchema.findOne(
			{ _id: serverId },
			{ flashcards: 1 },
		);

		if (!server || !server.flashcards) {
			return { success: true, data: null };
		}

		// ユーザーのフラッシュカードセクションを探す
		const userFlashcards = server.flashcards.find((fc) => fc.userId === userId);
		if (!userFlashcards || !userFlashcards.cards) {
			return { success: true, data: null };
		}

		let filteredCards = userFlashcards.cards;

		if (filter.word) {
			filteredCards = filteredCards.filter(
				(card) => card.word.toLowerCase() === filter.word.trim().toLowerCase(),
			);
		}
		if (filter.category) {
			filteredCards = filteredCards.filter(
				(card) => card.category === filter.category,
			);
		}

		return filteredCards.length > 0
			? { success: true, data: filteredCards }
			: { success: true, data: null };
	} catch (error) {
		console.error('フラッシュカード取得エラー:', error);
		return {
			success: false,
			error: 'フラッシュカードの取得中にエラーが発生しました。',
		};
	}
}

/**
 * ユーザーのすべてのフラッシュカードを削除する
 * @param {string} serverId - サーバーID
 * @param {string} userId - ユーザーID
 * @returns {Promise<object>} 削除結果
 */
async function clearCards(serverId, userId) {
	try {
		// ユーザーのフラッシュカードセクションが存在することを確認
		const ensureResult = await ensureUserFlashcardsExist(serverId, userId);
		if (ensureResult && !ensureResult.success) {
			return ensureResult;
		}

		const result = await profileSchema.updateOne(
			{ _id: serverId, 'flashcards.userId': userId },
			{ $set: { 'flashcards.$.cards': [] } },
		);

		return {
			success: result.modifiedCount > 0,
			data: result.modifiedCount > 0,
		};
	} catch (error) {
		console.error('フラッシュカード全削除エラー:', error);
		return {
			success: false,
			error: 'フラッシュカードの全削除中にエラーが発生しました。',
		};
	}
}

/**
 * ランダムなフラッシュカードを取得する
 * @param {string} serverId - サーバーID
 * @param {string} userId - ユーザーID
 * @param {object} filters - フィルター条件（category）
 * @returns {Promise<object>} ランダムなフラッシュカード取得結果
 */
async function getRandom(serverId, userId, filters = {}) {
	try {
		const cardsResult = await getCard(serverId, userId, filters);
		if (
			!cardsResult ||
			!cardsResult.success ||
			!cardsResult.data ||
			cardsResult.data.length === 0
		) {
			return { success: true, data: null };
		}

		const cards = cardsResult.data;
		const randomIndex = Math.floor(Math.random() * cards.length);
		return { success: true, data: cards[randomIndex] };
	} catch (error) {
		console.error('ランダムフラッシュカード取得エラー:', error);
		return {
			success: false,
			error: 'ランダムフラッシュカードの取得中にエラーが発生しました。',
		};
	}
}

/**
 * フラッシュカードの復習記録を更新する
 * @param {string} serverId - サーバーID
 * @param {string} userId - ユーザーID
 * @param {string} word - キーワード
 * @param {boolean} isCorrect - 正解かどうか
 * @returns {Promise<object>} 更新結果
 */
async function updateReview(serverId, userId, word, isCorrect) {
	try {
		const updateFields = {
			'flashcards.$[user].cards.$[card].lastReviewed': new Date(),
		};

		const incFields = {
			'flashcards.$[user].cards.$[card].reviewCount': 1,
		};

		if (isCorrect) {
			incFields['flashcards.$[user].cards.$[card].correctCount'] = 1;
		} else {
			incFields['flashcards.$[user].cards.$[card].incorrectCount'] = 1;
		}

		const result = await profileSchema.updateOne(
			{ _id: serverId },
			{
				$set: updateFields,
				$inc: incFields,
			},
			{
				arrayFilters: [{ 'user.userId': userId }, { 'card.word': word.trim() }],
			},
		);

		if (result.modifiedCount > 0) {
			const updatedCard = await getCard(serverId, userId, { word: word });
			return updatedCard && updatedCard.success && updatedCard.data
				? { success: true, data: updatedCard.data[0] }
				: { success: false, error: '更新されたカードの取得に失敗しました。' };
		}

		return { success: false, error: '復習記録の更新に失敗しました。' };
	} catch (error) {
		console.error('復習記録更新エラー:', error);
		return {
			success: false,
			error: '復習記録の更新中にエラーが発生しました。',
		};
	}
}
/**
 * カテゴリを作成する
 * @param {string} serverId - サーバーID
 * @param {string} userId - ユーザーID
 * @param {string} categoryName - カテゴリー名
 * @returns {Promise<object>} 作成結果
 */
async function createCategory(serverId, userId, categoryName) {
	try {
		// カテゴリー名の妥当性チェック
		if (!categoryName || categoryName.trim().length === 0) {
			return { success: false, error: 'カテゴリー名を入力してください。' };
		}

		const trimmedCategoryName = categoryName.trim();

		// ユーザーのフラッシュカードセクションが存在することを確認
		const ensureResult = await ensureUserFlashcardsExist(serverId, userId);
		if (ensureResult && !ensureResult.success) {
			return ensureResult;
		}

		// 既存のカテゴリーをチェック
		const existingCategoriesResult = await getCategories(serverId, userId);
		if (!existingCategoriesResult.success) {
			return existingCategoriesResult;
		}
		if (existingCategoriesResult.data.includes(trimmedCategoryName)) {
			return { success: false, error: 'そのカテゴリーは既に存在します。' };
		}

		// カテゴリーを追加
		const result = await profileSchema.updateOne(
			{ _id: serverId, 'flashcards.userId': userId },
			{ $push: { 'flashcards.$.categories': trimmedCategoryName } },
		);

		if (result.modifiedCount > 0) {
			return { success: true, categoryName: trimmedCategoryName };
		} else {
			return { success: false, error: 'カテゴリーの作成に失敗しました。' };
		}
	} catch (error) {
		console.error('カテゴリー作成エラー:', error);
		return {
			success: false,
			error: 'カテゴリーの作成中にエラーが発生しました。',
		};
	}
}

/**
 * カテゴリ一覧を取得する
 * @param {string} serverId - サーバーID
 * @param {string} userId - ユーザーID
 * @returns {Promise<object>} カテゴリの配列またはエラー情報
 */
async function getCategories(serverId, userId) {
	try {
		const server = await profileSchema.findOne({
			_id: serverId,
			'flashcards.userId': userId,
		});

		if (!server) {
			return { success: true, data: ['一般'] }; // デフォルトカテゴリーを返す
		}

		const userFlashcards = server.flashcards.find((fc) => fc.userId === userId);
		if (!userFlashcards || !userFlashcards.categories) {
			return { success: true, data: ['一般'] }; // デフォルトカテゴリーを返す
		}

		return { success: true, data: userFlashcards.categories.sort() };
	} catch (error) {
		console.error('カテゴリ一覧取得エラー:', error);
		return {
			success: false,
			error: 'カテゴリ一覧の取得中にエラーが発生しました。',
		};
	}
}

/**
 * カテゴリを削除する（そのカテゴリーのカードも削除される）
 * @param {string} serverId - サーバーID
 * @param {string} userId - ユーザーID
 * @param {string} categoryName - 削除するカテゴリー名
 * @returns {Promise<object>} 削除結果
 */
async function deleteCategory(serverId, userId, categoryName) {
	try {
		// 「一般」は削除できない
		if (categoryName === '一般') {
			return { success: false, error: '「一般」カテゴリーは削除できません。' };
		}

		// カテゴリーが存在するかチェック
		const existingCategoriesResult = await getCategories(serverId, userId);
		if (!existingCategoriesResult.data.includes(categoryName)) {
			return { success: false, error: 'そのカテゴリーは存在しません。' };
		}

		// ユーザーのフラッシュカードセクションが存在することを確認
		const ensureResult = await ensureUserFlashcardsExist(serverId, userId);
		if (ensureResult && !ensureResult.success) {
			return ensureResult;
		}

		// カテゴリーを削除し、そのカテゴリーのカードも削除
		const result = await profileSchema.updateOne(
			{ _id: serverId, 'flashcards.userId': userId },
			{
				$pull: {
					'flashcards.$.categories': categoryName,
					'flashcards.$.cards': { category: categoryName },
				},
			},
		);

		if (result.modifiedCount > 0) {
			return { success: true };
		} else {
			return { success: false, error: 'カテゴリーの削除に失敗しました。' };
		}
	} catch (error) {
		console.error('カテゴリー削除エラー:', error);
		return {
			success: false,
			error: 'カテゴリーの削除中にエラーが発生しました。',
		};
	}
}

/**
 * 統計情報を取得する
 * @param {string} serverId - サーバーID
 * @param {string} userId - ユーザーID
 * @returns {Promise<object>} 統計情報またはエラー情報
 */
async function getStats(serverId, userId) {
	try {
		const cardsResult = await getCard(serverId, userId);
		const cards =
			cardsResult && cardsResult.success && cardsResult.data
				? cardsResult.data
				: [];

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

		return { success: true, data: stats };
	} catch (error) {
		console.error('統計情報取得エラー:', error);
		return {
			success: false,
			error: '統計情報の取得中にエラーが発生しました。',
		};
	}
}

module.exports = {
	add,
	deleteCard,
	getCard,
	getRandom, //未使用
	clearCards, //未使用
	updateReview, //未使用
	createCategory,
	getCategories,
	deleteCategory,
	isValidCategory,
	getStats, //未使用
	ensureUserFlashcardsExist,
};
