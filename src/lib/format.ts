const VND_FORMATTER = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  minimumFractionDigits: 0,
});

/** 350000 -> "350.000₫". The single price format for the whole app. */
export const formatVND = (amount: number): string => VND_FORMATTER.format(amount).replace(/\s/g, '');
