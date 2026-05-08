export function numberToWords(num: number, currency: string = 'INR'): string {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    const formatNumber = (n: number) => {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + a[n % 10] : '');
        if (n < 1000) return a[Math.floor(n / 100)] + ' hundred' + (n % 100 !== 0 ? ' and ' + formatNumber(n % 100) : '');
        return '';
    };

    const n = Math.floor(num);
    if (n === 0) return 'Zero';

    let result = '';
    
    if (currency === 'INR') {
        const crores = Math.floor(n / 10000000);
        const lakhs = Math.floor((n % 10000000) / 100000);
        const thousands = Math.floor((n % 100000) / 1000);
        const remaining = n % 1000;

        if (crores) result += formatNumber(crores) + ' crore ';
        if (lakhs) result += formatNumber(lakhs) + ' lakh ';
        if (thousands) result += formatNumber(thousands) + ' thousand ';
        if (remaining) result += formatNumber(remaining);
        
        return (result + ' rupees only').toUpperCase();
    } else {
        // Standard Western format (Millions/Billions)
        const billions = Math.floor(n / 1000000000);
        const millions = Math.floor((n % 1000000000) / 1000000);
        const thousands = Math.floor((n % 1000000) / 1000);
        const remaining = n % 1000;

        if (billions) result += formatNumber(billions) + ' billion ';
        if (millions) result += formatNumber(millions) + ' million ';
        if (thousands) result += formatNumber(thousands) + ' thousand ';
        if (remaining) result += formatNumber(remaining);

        const currencyName = currency === 'USD' ? 'dollars' : currency;
        return (result + currencyName + ' only').toUpperCase();
    }
}
