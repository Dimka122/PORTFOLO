import fetch from 'node-fetch';

export default async function handler(req, res) {
    // Разрешаем только POST запросы
    if (req.method !== 'POST') {
        return res.status(405).json({ status: 'error', message: 'Method not allowed' });
    }

    // Токены и Chat ID для двух ботов
    const BOT_TOKEN_1 = process.env.TELEGRAM_BOT_TOKEN_1;
    const CHAT_ID_1 = process.env.TELEGRAM_CHAT_ID_1;
    
    const BOT_TOKEN_2 = process.env.TELEGRAM_BOT_TOKEN_2;
    const CHAT_ID_2 = process.env.TELEGRAM_CHAT_ID_2;

    if (!BOT_TOKEN_1 && !BOT_TOKEN_2) {
        console.error('Missing Telegram credentials');
        return res.status(500).json({ status: 'error', message: 'Telegram credentials not configured' });
    }

    try {
        // Получаем данные из запроса
        const { name, contact, phone, email, service, message, source } = req.body;

        // Определяем тип сообщения
        const isWidgetMessage = source === 'Виджет на сайте';

        // Формируем сообщение
        let text;
        
        if (isWidgetMessage) {
            // Сообщение из виджета
            text = `
💬 <b>Сообщение из виджета на сайте</b>

👤 <b>Имя:</b> ${name || 'Не указано'}
📞 <b>Контакт:</b> ${contact || 'Не указано'}
📝 <b>Сообщение:</b> ${message || 'Нет сообщения'}

📅 <b>Дата:</b> ${new Date().toLocaleString('ru-RU')}
            `.trim();
        } else {
            // Сообщение из формы контактов
            text = `
🔔 <b>Новая заявка с сайта!</b>

👤 <b>Имя:</b> ${name || 'Не указано'}
📱 <b>Телефон:</b> ${phone || 'Не указано'}
📧 <b>Email:</b> ${email || 'Не указано'}
🛠 <b>Услуга:</b> ${service || 'Не выбрана'}
💬 <b>Сообщение:</b> ${message || 'Нет сообщения'}

📅 <b>Дата:</b> ${new Date().toLocaleString('ru-RU')}
            `.trim();
        }

        // Массив для хранения результатов отправки
        const results = [];

        // Отправляем первому боту
        if (BOT_TOKEN_1 && CHAT_ID_1) {
            try {
                const response1 = await fetch(`https://api.telegram.org/bot${BOT_TOKEN_1}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: CHAT_ID_1,
                        text: text,
                        parse_mode: 'HTML'
                    })
                });
                const result1 = await response1.json();
                results.push({ bot: 1, ok: result1.ok });
                console.log('Bot 1 result:', result1.ok ? 'Success' : result1.description);
            } catch (error) {
                console.error('Bot 1 error:', error.message);
                results.push({ bot: 1, ok: false, error: error.message });
            }
        }

        // Отправляем второму боту
        if (BOT_TOKEN_2 && CHAT_ID_2) {
            try {
                const response2 = await fetch(`https://api.telegram.org/bot${BOT_TOKEN_2}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: CHAT_ID_2,
                        text: text,
                        parse_mode: 'HTML'
                    })
                });
                const result2 = await response2.json();
                results.push({ bot: 2, ok: result2.ok });
                console.log('Bot 2 result:', result2.ok ? 'Success' : result2.description);
            } catch (error) {
                console.error('Bot 2 error:', error.message);
                results.push({ bot: 2, ok: false, error: error.message });
            }
        }

        // Проверяем, что хотя бы одна отправка успешна
        const successCount = results.filter(r => r.ok).length;
        
        if (successCount > 0) {
            return res.status(200).json({ 
                status: 'success', 
                message: isWidgetMessage 
                    ? 'Сообщение успешно отправлено!' 
                    : 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.',
                sent: successCount
            });
        } else {
            return res.status(500).json({ 
                status: 'error', 
                message: 'Ошибка отправки во все боты',
                results: results
            });
        }

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ 
            status: 'error', 
            message: 'Внутренняя ошибка сервера' 
        });
    }
}