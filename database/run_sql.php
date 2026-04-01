<?php
/**
 * Run create_all_tables.sql against TiDB Cloud
 * Usage: php database/run_sql.php
 */

$pdo = new PDO(
    'mysql:host=gateway01.us-east-1.prod.aws.tidbcloud.com;port=4000;dbname=ewards_lms',
    'CjK9LE89HdBCPR8.root',
    'NiuId0CDogDl3iqQ',
    [
        PDO::MYSQL_ATTR_SSL_CA => 'C:/Program Files/Git/mingw64/etc/ssl/certs/ca-bundle.crt',
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]
);

$sql = file_get_contents(__DIR__ . '/create_all_tables.sql');

// Remove SQL comments
$sql = preg_replace('/--[^\n]*/', '', $sql);

// Split on semicolons that are followed by whitespace/newline
$statements = preg_split('/;\s*\n/', $sql);

$success = 0;
$errors = 0;

foreach ($statements as $stmt) {
    $stmt = trim($stmt);
    if (empty($stmt) || $stmt === '') continue;
    // Skip USE statement (already connected)
    if (stripos($stmt, 'USE ') === 0) continue;

    try {
        $pdo->exec($stmt);
        $success++;
        // Extract table name for display
        if (preg_match('/CREATE TABLE.*?`(\w+)`/i', $stmt, $m)) {
            echo "✓ Created table: {$m[1]}\n";
        } elseif (preg_match('/CREATE INDEX.*?ON\s+`(\w+)`/i', $stmt, $m)) {
            echo "✓ Created index on: {$m[1]}\n";
        } elseif (stripos($stmt, 'INSERT INTO') !== false) {
            echo "✓ Inserted migration records\n";
        } else {
            echo "✓ Executed statement\n";
        }
    } catch (PDOException $e) {
        $errors++;
        echo "✗ ERROR: " . substr($e->getMessage(), 0, 150) . "\n";
        echo "  SQL: " . substr($stmt, 0, 80) . "...\n\n";
    }
}

echo "\n=== SUMMARY ===\n";
echo "Success: $success | Errors: $errors\n\n";

$tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
echo "Tables in ewards_lms (" . count($tables) . "):\n";
foreach ($tables as $t) {
    echo "  - $t\n";
}
