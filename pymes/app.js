const parts = [
  "app.part0.js",
  "app.part1.js",
  "app.part2.js",
  "app.part3.js",
  "app.part4.js",
  "app.part5.js"
];

const source = await Promise.all(parts.map(async (part) => {
  const response = await fetch(part);
  if (!response.ok) throw new Error(`No se pudo cargar ${part}`);
  return response.text();
}));

(0, eval)(source.join("\n"));
