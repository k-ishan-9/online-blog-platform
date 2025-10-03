import { useEffect } from 'react';

function Notification({ notification, setNotification }) {
    useEffect(() => {
        if (notification.message) {
            const timer = setTimeout(() => setNotification({ message: '', sign: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification, setNotification]);

    if (!notification.message) return null;

    const positiveStyle = "bg-green-100 text-green-700";
    const negativeStyle = "bg-red-100 text-red-700";
    const messageStyle = notification.sign === '+' ? positiveStyle : negativeStyle;
    const notificationStyle = `p-4 rounded ${messageStyle}`;
    return (
        <div className={notificationStyle}>
            {notification.message}
        </div>
    );
}

export default Notification;