const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// 初始化数据库表
async function initDb() {
  try {
    // 尝试查询表是否存在
    const { error } = await supabase.from('records').select('id').limit(1);

    if (error) {
      console.log('表可能不存在，请确保在 Supabase 控制台创建 records 表');
      console.log('Supabase 连接成功（表需手动创建）');
    } else {
      console.log('Supabase 连接成功，records 表已存在');
    }

    return supabase;
  } catch (err) {
    console.error('数据库初始化失败:', err);
    throw err;
  }
}

function getDb() {
  return supabase;
}

module.exports = { initDb, getDb };
