<?php
// Nastaví typ odpovědi na JSON a UTF-8 kvůli češtině
header('Content-Type: application/json; charset=utf-8');

// Povolení komunikace z jiných domén/webů
header('Access-Control-Allow-Origin: *');

// Povolené metody požadavků
header('Access-Control-Allow-Methods: POST, OPTIONS');

// Povolené hlavičky
header('Access-Control-Allow-Headers: Content-Type');
// Browser někdy pošle testovací OPTIONS request
// Tohle ho ukončí bez chyby
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}
// Kontrola že je použitá metoda POST
// Pokud ne, vrátí chybu 405
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Povolena je pouze metoda POST.']);
    exit;
}
// Načte JSON data poslaná z JavaScriptu
$input = json_decode(file_get_contents('php://input'), true);
// Kontrola jestli data existují
if (!$input) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'Neplatná data.']);
    exit;
}
// Povinná pole formuláře
$required = ['id', 'name', 'email', 'date', 'time', 'type', 'quantity', 'price', 'total'];
foreach ($required as $field) {
    if (!isset($input[$field]) || $input[$field] === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'Chybí pole: ' . $field]);
        exit;
    }
}
// Kontrola že žádné pole nechybí
if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {    // Kontrola správného emailu
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'Neplatný e-mail.']);
    exit;
}
// Vyčištění a zabezpečení dat
$ticket = [
    // Odstraní nebezpečné znaky z ID
    'id' => preg_replace('/[^A-Za-z0-9\-]/', '', $input['id']),
    // Ochrana proti HTML/JS kódu
    'name' => htmlspecialchars(trim($input['name']), ENT_QUOTES, 'UTF-8'),
    // Vyčištění emailu
    'email' => filter_var($input['email'], FILTER_SANITIZE_EMAIL),
   // Vyčištění dalších textů
    'date' => htmlspecialchars(trim($input['date']), ENT_QUOTES, 'UTF-8'),
    'time' => htmlspecialchars(trim($input['time']), ENT_QUOTES, 'UTF-8'),
    'type' => htmlspecialchars(trim($input['type']), ENT_QUOTES, 'UTF-8'),
    // Povolený počet lístků 1–10
    'quantity' => max(1, min(10, (int)$input['quantity'])),
    // Převod ceny na číslo
    'price' => (int)$input['price'],
    'total' => (int)$input['total'],
   // Datum vytvoření objednávky
    'createdAt' => date('c')
];
// Cesta ke složce data
$dataDir = __DIR__ . '/../data';
// Cesta k souboru tickets.json
$file = $dataDir . '/tickets.json';

// Pokud složka data neexistuje, vytvoří ji
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0775, true);
}

// Pole pro všechny objednávky
$tickets = [];
if (file_exists($file)) {   // Pokud soubor existuje, načtou se staré objednávky
    $tickets = json_decode(file_get_contents($file), true);
    if (!is_array($tickets)) {  // Pokud je soubor poškozený, vytvoří prázdné pole
        $tickets = [];
    }
}

// Přidání nové objednávky
$tickets[] = $ticket;

 // Uložení všech objednávek do JSON souboru
if (file_put_contents($file, json_encode($tickets, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX) === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Soubor tickets.json nejde uložit.']);
    exit;
}

// Úspěšná odpověď zpět do JavaScriptu
echo json_encode([
    'ok' => true,
    'message' => 'Objednávka byla uložena.',
    'ticket' => $ticket
], JSON_UNESCAPED_UNICODE);
