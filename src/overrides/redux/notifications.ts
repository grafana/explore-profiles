import { displayError, displaySuccess, displayWarning } from '@shared/domain/displayStatus';

type NotificationOptions = {
  type: 'success' | 'danger' | 'info' | 'warning';
  title?: string;
  message: string;
  additionalInfo?: string[];
};

export const addNotification = ({ type, title, message, additionalInfo }: NotificationOptions) => {
  const msgs = ['Pyroscope OSS'];

  if (title) {
    msgs.push(title);
  }

  if (message) {
    msgs.push(message);
  }

  if (additionalInfo) {
    msgs.push(...additionalInfo);
  }

  switch (type) {
    case 'warning':
      return displayWarning(msgs);

    case 'danger':
      return displayError(new Error(message), msgs);

    default: // 'success' and 'info'
      return displaySuccess(msgs);
  }
};
