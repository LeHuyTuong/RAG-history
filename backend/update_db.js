const mysql = require('mysql2/promise');

async function update() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'history',
    password: 'history_password',
    database: 'history_rag'
  });

  try {
    const period1Emperors = JSON.stringify([
      { name: 'Kinh Dương Vương', relation: 'Thủy tổ' },
      { name: 'Lạc Long Quân', relation: '' },
      { name: 'Âu Cơ', relation: '' },
      { name: 'Hùng Vương', relation: 'Các đời vua' }
    ]);
    const period1Locations = JSON.stringify(['Đền Hùng']);
    
    await connection.execute(
      `UPDATE period SET emperors = ?, related_locations = ? WHERE period_id = 1`,
      [period1Emperors, period1Locations]
    );

    const period2Emperors = JSON.stringify([
      { name: 'An Dương Vương', relation: 'Vua' }
    ]);
    const period2Locations = JSON.stringify(['Thành Cổ Loa']);
    const period2Events = JSON.stringify(['Thục Phán lập nước Âu Lạc']);
    const period2Articles = JSON.stringify(['Cổ Loa và dấu ấn Âu Lạc']);

    await connection.execute(
      `UPDATE period SET emperors = ?, related_locations = ?, related_events = ?, related_articles = ? WHERE period_id = 2`,
      [period2Emperors, period2Locations, period2Events, period2Articles]
    );

    console.log('Update successful');
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

update();
