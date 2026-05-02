const pool     = require('../../config/db');
const AppError = require('../../utils/AppError');

// ── POST /api/messages ─────────────────────────────────────
const sendMessage = async (req, res, next) => {
  const { receiver_id, message_text, related_task_id } = req.body;

  if (!receiver_id || !message_text) {
    return next(new AppError('Alıcı ve mesaj metni zorunludur.', 400));
  }

  if (receiver_id === req.user.id) {
    return next(new AppError('Kendinize mesaj gönderemezsiniz.', 400));
  }

  try {
    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, message_text, related_task_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, receiver_id, message_text, related_task_id || null]
    );

    res.status(201).json({ success: true, message: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/messages/:userId — Bir kullanıcıyla sohbet ────
const getConversation = async (req, res, next) => {
  const otherUserId = parseInt(req.params.userId, 10);
  const myId        = req.user.id;

  try {
    // Mesajları okundu olarak işaretle
    await pool.query(
      `UPDATE messages SET is_read = TRUE
       WHERE receiver_id = $1 AND sender_id = $2 AND is_read = FALSE`,
      [myId, otherUserId]
    );

    const result = await pool.query(
      `SELECT m.*, u.full_name AS sender_name
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2)
          OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at ASC`,
      [myId, otherUserId]
    );

    res.json({ success: true, count: result.rows.length, messages: result.rows });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/messages/inbox — Gelen kutusu ─────────────────
const getInbox = async (req, res, next) => {
  try {
    // Her kullanıcıdan gelen son mesajı listele
    const result = await pool.query(
      `SELECT DISTINCT ON (
           LEAST(m.sender_id, m.receiver_id),
           GREATEST(m.sender_id, m.receiver_id)
         )
         m.*,
         u.full_name AS other_user_name,
         (SELECT COUNT(*) FROM messages
          WHERE receiver_id = $1 AND sender_id = m.sender_id AND is_read = FALSE
         ) AS unread_count
       FROM messages m
       JOIN users u ON u.id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
       WHERE m.sender_id = $1 OR m.receiver_id = $1
       ORDER BY
         LEAST(m.sender_id, m.receiver_id),
         GREATEST(m.sender_id, m.receiver_id),
         m.created_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, conversations: result.rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendMessage, getConversation, getInbox };
