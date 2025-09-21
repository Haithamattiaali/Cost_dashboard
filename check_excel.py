#!/usr/bin/env python3
import pandas as pd
import sys

# Read the Excel file
df = pd.read_excel('data.xlsx')

# Print column names
print("Columns in Excel file:")
print(df.columns.tolist())
print()

# Check Year column
if 'year' in df.columns or 'Year' in df.columns or 'YEAR' in df.columns:
    year_col = 'year' if 'year' in df.columns else ('Year' if 'Year' in df.columns else 'YEAR')
    print(f"Year column: {year_col}")
    print(f"Unique years: {sorted(df[year_col].dropna().unique())}")
    print(f"Year value types: {df[year_col].dtype}")
    print(f"First 5 year values: {df[year_col].head().tolist()}")
    print(f"Any null years: {df[year_col].isnull().any()}")
    print(f"Null year count: {df[year_col].isnull().sum()}")
else:
    print("No year column found!")

print()
print(f"Total rows: {len(df)}")
print()
print("First 3 rows:")
print(df.head(3))