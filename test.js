const stemWord = (word) => {
    if (word.length > 3 && word.endsWith('S')) {
        if (word.endsWith('ES') && !word.endsWith('RES') && !word.endsWith('TES')) return word.slice(0, -2);
        return word.slice(0, -1);
    }
    return word;
};
const phonetic = (word) => {
    return word.toUpperCase()
        .replace(/H/g, '')
        .replace(/[ZV]/g, 'B')
        .replace(/[CSZ]/g, 'S')
        .replace(/LL/g, 'Y')
        .replace(/QU/g, 'K')
        .replace(/C[EI]/g, 'S')
        .replace(/C/g, 'K')
        .replace(/G[EI]/g, 'J')
        .replace(/(.)\1+/g, '$1'); 
};
const getWords = (name) => {
    const stopwords = new Set(['DE', 'LA', 'EL', 'LOS', 'LAS', 'CON', 'SIN', 'SABOR', 'UN', 'UNA', 'Y', 'O', 'PARA', 'AL', 'DEL']);
    let cleaned = String(name).toUpperCase()
        .replace(/\bCHOC\b/g, 'CHOCOLATE')
        .replace(/\bDLCE\b/g, 'DULCE')
        .replace(/\bC\/\b/g, 'CON ')
        .replace(/\bP\/\b/g, 'PARA ')
        .replace(/\bGFA\b/g, 'GARRAFA')
        .replace(/[.,\/#!$%\^&\*;:{}=\-_~()]/g, ' ')
        .replace(/(\d+)\s*(LTS|LT)\b/g, '$1L')
        .replace(/(\d+)\s*(CM3|CC)\b/g, '$1ML')
        .replace(/(\d+)\s*(GRS|GR|GRAMOS)\b/g, '$1G')
        .trim();
    return cleaned.split(/\s+/)
        .filter(w => w.length > 0 && !stopwords.has(w))
        .map(w => ({ raw: stemWord(w), sound: phonetic(stemWord(w)) }));
};
const p1 = { price: 1500, idStr: "1", words: getWords('COCA COLA 500ML') };
const p2 = { price: 1500, idStr: "2", words: getWords('COCA-COLA 500 ML') };

const str1 = p1.words.map(w => w.raw).sort().join(" ");
const str2 = p2.words.map(w => w.raw).sort().join(" ");

console.log(str1 === str2 ? "✅ STRINGS MATCH!" : "❌ NO MATCH", str1, "vs", str2);
