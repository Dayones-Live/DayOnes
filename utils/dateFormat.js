export const formatDate = dateString => {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  return formatter.format(date);
};
