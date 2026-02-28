const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const path = require('path');

// 获取记录列表（支持日期/关键词筛选）
router.get('/', async (req, res) => {
  try {
    const supabase = getDb();
    const { date, keyword } = req.query;

    let query = supabase.from('records').select('*');

    if (date) {
      // 日期筛选：匹配 YYYY-MM-DD 开头的记录
      query = query.gte('timestamp', `${date}T00:00:00`).lt('timestamp', `${date}T23:59:59`);
    }

    if (keyword) {
      // 分词模糊搜索：把关键词拆分成多个词，记录中包含任意一个词即匹配
      const keywords = keyword.trim().split(/\s+/).filter(kw => kw);
      if (keywords.length > 0) {
        // 使用 or 查询匹配任意关键词
        const orConditions = keywords.map(kw =>
          `content.ilike.%${kw}%,description.ilike.%${kw}%`
        ).join(',');
        query = query.or(orConditions);
      }
    }

    const { data: records, error } = await query.order('timestamp', { ascending: false });

    if (error) throw error;

    // 处理图片URL
    const result = records.map(record => ({
      ...record,
      imageUrl: record.type === 'image' && record.content
        ? `/uploads/${record.content}`
        : null
    }));

    res.json({ code: 200, data: result });
  } catch (error) {
    console.error('获取记录失败:', error);
    res.json({ code: 500, message: '获取记录失败' });
  }
});

// 创建新记录
router.post('/', async (req, res) => {
  try {
    const supabase = getDb();
    const { type, content, description } = req.body;

    if (!type || !content) {
      return res.json({ code: 400, message: '缺少必要参数' });
    }

    if (type !== 'text' && type !== 'image' && type !== 'voice') {
      return res.json({ code: 400, message: '类型只能是 text、image 或 voice' });
    }

    const timestamp = new Date().toISOString();
    const { data, error } = await supabase
      .from('records')
      .insert([{ type, content, description: description || '', timestamp }])
      .select();

    if (error) throw error;

    res.json({
      code: 200,
      message: '添加成功',
      data: { id: data[0]?.id }
    });
  } catch (error) {
    console.error('创建记录失败:', error);
    res.json({ code: 500, message: '创建记录失败' });
  }
});

// 删除记录
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getDb();
    const { id } = req.params;

    // 先查询记录，获取图片路径
    const { data: record, error: fetchError } = await supabase
      .from('records')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !record) {
      return res.json({ code: 404, message: '记录不存在' });
    }

    // 删除数据库记录
    const { error: deleteError } = await supabase
      .from('records')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // 如果是图片类型，删除服务器上的图片文件
    if (record.type === 'image' && record.content) {
      const fs = require('fs');
      const imagePath = path.join(__dirname, '..', '..', 'public', 'uploads', record.content);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除记录失败:', error);
    res.json({ code: 500, message: '删除记录失败' });
  }
});

// 获取统计数据
router.get('/stats', async (req, res) => {
  try {
    const supabase = getDb();

    const { count: total, error: totalError } = await supabase
      .from('records')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    const today = new Date().toISOString().split('T')[0];
    const { count: todayCount, error: todayError } = await supabase
      .from('records')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', `${today}T00:00:00`)
      .lt('timestamp', `${today}T23:59:59`);

    if (todayError) throw todayError;

    res.json({
      code: 200,
      data: { total: total || 0, today: todayCount || 0 }
    });
  } catch (error) {
    console.error('获取统计失败:', error);
    res.json({ code: 500, message: '获取统计失败' });
  }
});

module.exports = router;
