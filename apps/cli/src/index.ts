import * as fs from 'fs';
import * as path from 'path';

// 1. Ticket ID Generator Function
export function generateTicketId(prefix: string = 'SUP'): string {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}-${timestamp}-${randomNum}`;
}

// 2. CSV to JSON Converter Function
export function convertCsvToJson(csvFilePath: string): any[] {
    if (!fs.existsSync(csvFilePath)) {
        throw new Error(`CSV file not found at: ${csvFilePath}`);
    }

    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = fileContent.trim().split('\n');
    
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const result: any[] = [];

    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].split(',').map(val => val.trim());
        const obj: any = {};
        headers.forEach((header, index) => {
            obj[header] = currentLine[index] || '';
        });
        result.push(obj);
    }

    return result;
}