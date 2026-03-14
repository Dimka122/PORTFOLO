import fetch from 'node-fetch';

export default async function handler(req, res) {
    // Разрешаем только POST запросы
    if (req.method !== 'POST') {
        return res.status(405).json({ status: 'error', message: 'Method not allowed' });
    }

    // Настройки Telegram (из переменных окружения)
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
        console.error('Missing Telegram credentials');
        return res.status(500).json({ status: 'error', message: 'Telegram credentials not configured' });
    }

    try {
        // Получаем данные из запроса
        const { name, phone, email, service, message, source } = req.body;

        // Определяем тип сообщения
        const isWidgetMessage = source === 'Виджет на сайте';

        // Формируем сообщение
        let text;
        
        if (isWidgetMessage) {
            // Сообщение из виджета
            text = `
💬 <b>Сообщение из виджета на сайте</b>

👤 <b>Имя:</b> ${name || 'Не указано'}
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

        // Отправляем в Telegram
        const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        
        const response = await fetch(telegramUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: text,
                parse_mode: 'HTML'
            })
        });

        const result = await response.json();

        if (result.ok) {
            return res.status(200).json({ 
                status: 'success', 
                message: isWidgetMessage 
                    ? 'Сообщение успешно отправлено!' 
                    : 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.' 
            });
        } else {
            console.error('Telegram API error:', result);
            return res.status(500).json({ 
                status: 'error', 
                message: 'Ошибка отправки в Telegram' 
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