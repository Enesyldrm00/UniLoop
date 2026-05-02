/**
 * Trigger Servisi — Otomatik Kurye İlanı Oluşturma
 *
 * Bu servis, bir havuz dolduğunda pool.controller.js içindeki
 * aktif PostgreSQL transaction'ını devralır.
 * Kurye ilanı ya havuzla birlikte commit edilir ya da
 * havuzla birlikte rollback edilir. Atomiklik garantilenir.
 */

const SYSTEM_USER_ID = parseInt(process.env.SYSTEM_USER_ID || '1', 10);
const COURIER_REWARD_PCT = 0.10; // Havuz toplam maliyetinin %10'u

/**
 * @param {import('pg').PoolClient} client — Aktif transaction client'ı
 * @param {object} poolData — Dolu olan havuzun verisi
 */
const createCourierTask = async (client, poolData) => {
  const courierReward = Math.max(
    Math.round(poolData.total_cost * COURIER_REWARD_PCT),
    10 // Minimum 10 K-Kredi
  );

  const title = `[OTOMATİK] "${poolData.title}" Havuzu İçin Kurye`;
  const description =
    `Bu ilan "${poolData.title}" havuzu dolduğunda sistem tarafından otomatik oluşturuldu. ` +
    `Teslimat noktası: ${poolData.location || 'Belirtilmemiş'}. ` +
    `Ödül: ${courierReward} K-Kredi.`;

  await client.query(
    `INSERT INTO tasks
       (creator_id, title, description, task_type, status,
        reward_kredi, location, is_auto_generated)
     VALUES ($1, $2, $3, 'courier_request', 'open', $4, $5, TRUE)`,
    [
      SYSTEM_USER_ID,
      title,
      description,
      courierReward,
      poolData.location || null,
    ]
  );

  console.log(
    `🚚 [Trigger] Pool #${poolData.id} doldu → Kurye ilanı açıldı. Ödül: ${courierReward} K-Kredi`
  );
};

module.exports = { createCourierTask };
