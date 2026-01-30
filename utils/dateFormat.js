export const formatDate = dateString => {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  return formatter.format(date);
};

export const formatTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const differenceInSeconds = Math.floor((now - date) / 1000);

  if (differenceInSeconds < 60) {
    return `${differenceInSeconds} second${differenceInSeconds !== 1 ? 's' : ''} ago`;
  }
  if (differenceInSeconds < 3600) {
    const minutes = Math.floor(differenceInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  if (differenceInSeconds < 86400) {
    const hours = Math.floor(differenceInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  const days = Math.floor(differenceInSeconds / 86400);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
};
