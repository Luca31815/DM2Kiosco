const parsedProducts = [
  { price: 0, id: 1 },
  { price: 0, id: 2 },
  { price: 100, id: 3 },
  { price: 100, id: 4 },
];

for (let i = 0; i < parsedProducts.length; i++) {
    const p1 = parsedProducts[i];
    for (let j = i + 1; j < parsedProducts.length; j++) {
        const p2 = parsedProducts[j];
        if (p2.price > p1.price * 1.15) {
            console.log(`Broke inner loop at p1=${p1.price}, p2=${p2.price}`);
            break;
        }
        console.log(`Matched p1=${p1.price}, p2=${p2.price}`);
    }
}
