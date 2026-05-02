const pool     = require('../../config/db');
const AppError = require('../../utils/AppError');

// ── GET /api/contact/me ─────────────────────────────────────
const getMyContact = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_contacts WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ success: true, contact: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/contact/:userId ────────────────────────────────
// Gizlilik ayarlarına göre sadece izin verilen alanlar döner
const getPublicContact = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         CASE WHEN show_phone     THEN phone_number     ELSE NULL END AS phone_number,
         instagram_handle,
         CASE WHEN show_instagram THEN instagram_handle ELSE NULL END AS instagram_handle,
         CASE WHEN show_linkedin  THEN linkedin_url     ELSE NULL END AS linkedin_url
       FROM user_contacts
       WHERE user_id = $1`,
      [req.params.userId]
    );

    if (result.rows.length === 0) {
      return next(new AppError('Kullanıcı iletişim bilgisi bulunamadı.', 404));
    }

    res.json({ success: true, contact: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/contact/me ─────────────────────────────────────
const updateMyContact = async (req, res, next) => {
  const {
    phone_number, instagram_handle, twitter_handle, linkedin_url,
    show_phone, show_instagram, show_linkedin,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE user_contacts
       SET
         phone_number     = COALESCE($1, phone_number),
         instagram_handle = COALESCE($2, instagram_handle),
         twitter_handle   = COALESCE($3, twitter_handle),
         linkedin_url     = COALESCE($4, linkedin_url),
         show_phone       = COALESCE($5, show_phone),
         show_instagram   = COALESCE($6, show_instagram),
         show_linkedin    = COALESCE($7, show_linkedin),
         updated_at       = CURRENT_TIMESTAMP
       WHERE user_id = $8
       RETURNING *`,
      [
        phone_number, instagram_handle, twitter_handle, linkedin_url,
        show_phone, show_instagram, show_linkedin,
        req.user.id,
      ]
    );

    res.json({ success: true, contact: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyContact, getPublicContact, updateMyContact };
