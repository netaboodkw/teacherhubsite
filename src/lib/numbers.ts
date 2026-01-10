// Convert Arabic/Persian numerals to English
export function toEnglishNumbers(str: string): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persianNumerals = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  let result = str;
  
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(arabicNumerals[i], 'g'), i.toString());
    result = result.replace(new RegExp(persianNumerals[i], 'g'), i.toString());
  }
  
  return result;
}

// Format number to always show English numerals
export function formatNumber(num: number): string {
  return num.toString();
}

// Input handler that converts Arabic numbers to English
export function handleNumericInput(value: string): string {
  return toEnglishNumbers(value);
}
