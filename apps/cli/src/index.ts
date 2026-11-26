import * as fs from 'fs';

function parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                currentValue += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === ',' && !inQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
            continue;
        }

        currentValue += char;
    }

    values.push(currentValue.trim());
    return values;
}

export function generateTicketId(prefix: string = 'SUP'): string {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}-${timestamp}-${randomNum}`;
}

export function convertCsvToJson(csvFilePath: string): Record<string, string>[] {
    if (!fs.existsSync(csvFilePath)) {
        throw new Error('CSV file not found');
    }

    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    const trimmedContent = fileContent.trim();

    if (!trimmedContent) {
        return [];
    }

    const lines = trimmedContent.split(/\r?\n/).filter((line) => line.trim().length > 0);

    if (lines.length === 0) {
        return [];
    }

    const headers = parseCsvLine(lines[0]).map((header) => header.trim()).filter((header) => header.length > 0);

    if (headers.length === 0) {
        return [];
    }

    return lines.slice(1).map((line) => {
        const values = parseCsvLine(line);
        const row: Record<string, string> = {};

        headers.forEach((header, index) => {
            row[header] = values[index] ?? '';
        });

        return row;
    });
}