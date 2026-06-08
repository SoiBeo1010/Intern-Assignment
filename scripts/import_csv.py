"""
Simple CSV preview script.
Run: `python scripts/import_csv.py dataset/diem_thi_thpt_2024.csv`
"""
import csv
import sys

def preview(path, n=10):
    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.reader(f)
        for i, row in enumerate(reader):
            print(row)
            if i+1 >= n:
                break

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python scripts/import_csv.py <csv_path>')
    else:
        preview(sys.argv[1])
