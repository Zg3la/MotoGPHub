const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(path.join(__dirname, 'ca.pem')),
  },
  waitForConnections: true,
  connectionLimit: 10,
});

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function seedDatabase() {
  try {
    const existing = await query('SELECT COUNT(*) AS cnt FROM users');
    if (existing[0].cnt > 0) {
      console.log('Already seeded');
      return;
    }

    console.log('Seeding database...');

    const driverHash = await bcrypt.hash('motogp123', 10);
    const fanHash    = await bcrypt.hash('fan123', 10);
    const adminHash  = await bcrypt.hash('admin123', 10);

    const usersToInsert = [
      ['admin',                'admin@motogp.com',    adminHash,  'Administrator',         'admin',  'AD', '#7C3AED', 'MotoGP Social Hub administrator.',                       null, null,                         null],
      ['marc_marquez',         'marc@motogp.com',     driverHash, 'Marc Márquez',          'driver', 'MM', '#CC0000', '8-time World Champion. Fearless and relentless.',         93,  'Ducati Lenovo Team',         'Spanish'],
      ['francesco_bagnaia',    'pecco@motogp.com',    driverHash, 'Francesco Bagnaia',     'driver', 'FB', '#FF0000', 'MotoGP champion with precision and speed.',              63,  'Ducati Lenovo Team',         'Italian'],
      ['fabio_quartararo',     'fabio@motogp.com',    driverHash, 'Fabio Quartararo',      'driver', 'FQ', '#FFD700', 'El Diablo. Former MotoGP champion.',                      20,  'Monster Energy Yamaha',      'French'],
      ['alex_rins',            'rins@motogp.com',     driverHash, 'Álex Rins',             'driver', 'AR', '#0000FF', 'Technical rider with race-winning consistency.',          42,  'Monster Energy Yamaha',      'Spanish'],
      ['pedro_acosta',         'pedro@motogp.com',    driverHash, 'Pedro Acosta',          'driver', 'PA', '#FF6600', 'The Shark of Murcia.',                                    37,  'Red Bull KTM Factory Racing', 'Spanish'],
      ['brad_binder',          'binder@motogp.com',   driverHash, 'Brad Binder',           'driver', 'BB', '#FF8800', 'Fearless late-braking specialist.',                       33,  'Red Bull KTM Factory Racing', 'South African'],
      ['jorge_martin',         'jorge@motogp.com',    driverHash, 'Jorge Martín',          'driver', 'JM', '#0099FF', 'Sprint king and title contender.',                        89,  'Aprilia Racing',             'Spanish'],
      ['marco_bezzecchi',      'bez@motogp.com',      driverHash, 'Marco Bezzecchi',       'driver', 'MB', '#66CC00', 'Aggressive racer from VR46 Academy.',                     72,  'Aprilia Racing',             'Italian'],
      ['joan_mir',             'mir@motogp.com',      driverHash, 'Joan Mir',              'driver', 'JR', '#CC0000', 'MotoGP World Champion.',                                  36,  'Honda HRC Castrol',          'Spanish'],
      ['luca_marini',          'luca@motogp.com',     driverHash, 'Luca Marini',           'driver', 'LM', '#990000', 'Technical rider and strong developer.',                   10,  'Honda HRC Castrol',          'Italian'],
      ['fabio_di_giannantonio','diggia@motogp.com',   driverHash, 'Fabio Di Giannantonio', 'driver', 'FD', '#FFDD00', 'Italian talent with aggressive pace.',                    49,  'VR46 Racing Team',           'Italian'],
      ['franco_morbidelli',    'franco@motogp.com',   driverHash, 'Franco Morbidelli',     'driver', 'FM', '#FFFF66', 'Former title challenger.',                                21,  'VR46 Racing Team',           'Italian'],
      ['alex_marquez',         'alexm@motogp.com',    driverHash, 'Álex Márquez',          'driver', 'AM', '#00AAFF', 'Double world champion.',                                  73,  'Gresini Racing MotoGP',      'Spanish'],
      ['fermin_aldeguer',      'fermin@motogp.com',   driverHash, 'Fermín Aldeguer',       'driver', 'FA', '#00CC99', 'Young MotoGP talent.',                                    54,  'Gresini Racing MotoGP',      'Spanish'],
      ['toprak_razgatlioglu',  'toprak@motogp.com',   driverHash, 'Toprak Razgatlioglu',   'driver', 'TR', '#0033CC', 'Superbike legend making his MotoGP move.',                54,  'Prima Pramac Yamaha',        'Turkish'],
      ['jack_miller',          'jack@motogp.com',     driverHash, 'Jack Miller',           'driver', 'JK', '#0066FF', 'Aggressive overtaker.',                                   43,  'Prima Pramac Yamaha',        'Australian'],
      ['raul_fernandez',       'raul@motogp.com',     driverHash, 'Raúl Fernández',        'driver', 'RF', '#FF4444', 'Raw speed and aggression.',                               25,  'Trackhouse Racing',          'Spanish'],
      ['ai_ogura',             'ogura@motogp.com',    driverHash, 'Ai Ogura',              'driver', 'AO', '#CCCCCC', 'Smooth Japanese talent.',                                 79,  'Trackhouse Racing',          'Japanese'],
      ['maverick_vinales',     'maverick@motogp.com', driverHash, 'Maverick Vinales',      'driver', 'MV', '#6633FF', 'Naturally gifted rider.',                                 12,  'Tech3 KTM',                  'Spanish'],
      ['enea_bastianini',      'enea@motogp.com',     driverHash, 'Enea Bastianini',       'driver', 'EB', '#9900CC', 'The Beast.',                                              23,  'Tech3 KTM',                  'Italian'],
      ['johann_zarco',         'zarco@motogp.com',    driverHash, 'Johann Zarco',          'driver', 'JZ', '#00FF00', 'Experienced veteran.',                                     5,  'LCR Honda',                  'French'],
      ['diogo_moreira',        'diogo@motogp.com',    driverHash, 'Diogo Moreira',         'driver', 'DM', '#00AA00', 'Brazilian rookie talent.',                                11,  'LCR Honda',                  'Brazilian'],
      ['speedfreak99',         'alex@fans.com',        fanHash,   'Alex Turner',           'fan',    'AT', '#E63946', 'Lifelong MotoGP fan.',                                   null, null,                         null],
      ['yamaha_girl',          'sofia@fans.com',       fanHash,   'Sofia Rossi',           'fan',    'SR', '#2A9D8F', 'Italian MotoGP fan.',                                    null, null,                         null],
      ['ktm_fan_31',           'marco@fans.com',       fanHash,   'Marco Diaz',            'fan',    'MD', '#F4A261', 'Pedro Acosta fan.',                                      null, null,                         null],
    ];

    for (const u of usersToInsert) {
      await query(
        `INSERT INTO users (username,email,password,name,role,avatar,avatar_color,bio,number,team,nationality)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`, u
      );
    }

    const getUser = async (uname) => {
      const rows = await query('SELECT * FROM users WHERE username = ?', [uname]);
      return rows[0];
    };

    const fabioU = await getUser('fabio_quartararo');
    const pedroU = await getUser('pedro_acosta');
    const marcU  = await getUser('marc_marquez');
    const alexU  = await getUser('speedfreak99');
    const sofiaU = await getUser('yamaha_girl');
    const marcoU = await getUser('ktm_fan_31');

    const now = new Date();
    const hrs = h => new Date(now - h * 3600000).toISOString().slice(0, 19).replace('T', ' ');

    const insertPost = async (user, content, status, ts) => {
      const res = await query(
        `INSERT INTO posts (user_id,username,author_name,author_avatar,author_avatar_color,author_role,content,status,created_at)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [user.id, user.username, user.name, user.avatar, user.avatar_color, user.role, content, status, ts]
      );
      return res.insertId;
    };

    const p1 = await insertPost(fabioU, '🏁 Perfect qualifying lap today. Yamaha feels amazing.', 'approved', hrs(1));
    const p2 = await insertPost(pedroU, '🦈 Learning every session. KTM is improving fast.',      'approved', hrs(3));
    await insertPost(marcU,  '💪 Every race is a new battle. Never give up.',                     'approved', hrs(5));
    await insertPost(alexU,  'Fabio can still fight for titles with the right bike.',             'pending',  hrs(0.5));

    const insertComment = async (user, postId, content, ts) => {
      await query(
        `INSERT INTO comments (post_id,user_id,username,author_name,author_avatar,author_avatar_color,content,created_at)
         VALUES (?,?,?,?,?,?,?,?)`,
        [postId, user.id, user.username, user.name, user.avatar, user.avatar_color, content, ts]
      );
      await query('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?', [postId]);
    };

    await insertComment(alexU,  p1, 'Insane lap 🔥',        hrs(0.5));
    await insertComment(sofiaU, p1, 'El Diablo is back 💛', hrs(0.4));
    await insertComment(marcoU, p2, 'Pedro is unreal 🦈',   hrs(2));

    await query('INSERT INTO likes (post_id,user_id,type) VALUES (?,?,?)', [p1, alexU.id,  'like']);
    await query('INSERT INTO likes (post_id,user_id,type) VALUES (?,?,?)', [p1, sofiaU.id, 'like']);
    await query('INSERT INTO likes (post_id,user_id,type) VALUES (?,?,?)', [p2, marcoU.id, 'like']);
    await query('UPDATE posts SET likes = 2 WHERE id = ?', [p1]);
    await query('UPDATE posts SET likes = 1 WHERE id = ?', [p2]);

    await query('INSERT INTO follows (follower_id,following_id) VALUES (?,?)', [alexU.id,  fabioU.id]);
    await query('INSERT INTO follows (follower_id,following_id) VALUES (?,?)', [sofiaU.id, fabioU.id]);
    await query('INSERT INTO follows (follower_id,following_id) VALUES (?,?)', [marcoU.id, pedroU.id]);
    await query('INSERT INTO follows (follower_id,following_id) VALUES (?,?)', [alexU.id,  marcU.id]);
    await query('UPDATE users SET followers = 2 WHERE id = ?', [fabioU.id]);
    await query('UPDATE users SET followers = 1 WHERE id = ?', [pedroU.id]);
    await query('UPDATE users SET followers = 1 WHERE id = ?', [marcU.id]);

    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Seed error:', err.message);
  }
}

seedDatabase();

module.exports = { query, pool };