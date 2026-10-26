import { generateTicketId, convertCsvToJson } from './index';
import * as fs from 'fs';
import * as path from 'path';

describe('SupportDesk CLI Utilities', () => {

    // Test 1: Ticket ID generation format check
    test('1. should generate ticket ID with default prefix', () => {
        const ticketId = generateTicketId();
        expect(ticketId.startsWith('SUP-')).toBe(true);
    });

    // Test 2: Ticket ID custom prefix check
    test('2. should generate ticket ID with custom prefix', () => {
        const ticketId = generateTicketId('BUG');
        expect(ticketId.startsWith('BUG-')).toBe(true);
    });

    // Test 3: Ticket ID uniqueness check
    test('3. should generate unique ticket IDs', () => {
        const id1 = generateTicketId();
        const id2 = generateTicketId();
        expect(id1).not.toEqual(id2);
    });

    // Test 4: Ticket ID length/structure check
    test('4. should contain correct hyphen separation', () => {
        const ticketId = generateTicketId('TICK');
        const parts = ticketId.split('-');
        expect(parts.length).toBe(3);
        expect(parts[0]).toBe('TICK');
    });

    // Test 5: CSV to JSON conversion - valid file handling
    test('5. should correctly convert CSV data to JSON objects', () => {
        const mockCsvPath = path.join(__dirname, 'test.csv');
        fs.writeFileSync(mockCsvPath, 'id,title,status\n1,Login Issue,Open\n2,Crash,Closed');
        
        const jsonResult = convertCsvToJson(mockCsvPath);
        expect(jsonResult.length).toBe(2);
        expect(jsonResult[0]).toEqual({ id: '1', title: 'Login Issue', status: 'Open' });
        expect(jsonResult[1]).toEqual({ id: '2', title: 'Crash', status: 'Closed' });

        // Cleanup
        fs.unlinkSync(mockCsvPath);
    });

    // Test 6: CSV to JSON conversion - empty or missing headers
    test('6. should handle empty file or headers correctly', () => {
        const mockCsvPath = path.join(__dirname, 'empty.csv');
        fs.writeFileSync(mockCsvPath, '');
        
        const jsonResult = convertCsvToJson(mockCsvPath);
        expect(jsonResult).toEqual([]);

        // Cleanup
        fs.unlinkSync(mockCsvPath);
    });

    // Test 7: CSV to JSON conversion - non-existent file error
    test('7. should throw error if CSV file does not exist', () => {
        expect(() => {
            convertCsvToJson('non-existent-file.csv');
        }).toThrow('CSV file not found');
    });

    // Test 8: CSV to JSON conversion - trailing/extra field trimming
    test('8. should trim whitespace from CSV values', () => {
        const mockCsvPath = path.join(__dirname, 'spaced.csv');
        fs.writeFileSync(mockCsvPath, 'name , priority \n auth , high ');
        
        const jsonResult = convertCsvToJson(mockCsvPath);
        expect(jsonResult[0]).toEqual({ name: 'auth', priority: 'high' });

        // Cleanup
        fs.unlinkSync(mockCsvPath);
    });

});