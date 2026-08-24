import fs from "fs";

export type ColumnStat = {
  name: string;
  type: "number" | "string" | "float" | "year";
  nullCount: number;
  nullPercent: number;
  min?: number;
  max?: number;
  mean?: number;
  uniques: number;
  sampleDist: number[];
};

export type DatasetProfile = {
  filepath: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  columns: ColumnStat[];
  rows: string[][];
  yearlyTrends: { year: number; deaths: number; incidence: number }[];
  topCountriesByMortality: { country: string; deaths: number }[];
};

export class CSVProfiler {
  static parseLine(line: string): string[] {
    const values: string[] = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === "," && !inQuotes) {
        values.push(cur.trim());
        cur = "";
      } else {
        cur += c;
      }
    }
    values.push(cur.trim());
    return values;
  }

  static profile(filepath: string, maxSampleRows: number = 5000): DatasetProfile {
    const raw = fs.readFileSync(filepath, "utf8");
    const rawLines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);

    if (rawLines.length === 0) {
      throw new Error(`File is empty: ${filepath}`);
    }

    const headers = this.parseLine(rawLines[0]);
    const rowCount = rawLines.length - 1;
    const sampleRows: string[][] = [];

    for (let i = 1; i <= Math.min(rawLines.length - 1, maxSampleRows); i++) {
      sampleRows.push(this.parseLine(rawLines[i]));
    }

    // Column profiling
    const columns: ColumnStat[] = [];
    const countryMortalityMap = new Map<string, number>();
    const yearDeathsMap = new Map<number, number>();
    const yearIncidenceMap = new Map<number, number>();

    const countryIdx = headers.findIndex((h) => h.toLowerCase().includes("country or territory"));
    const yearIdx = headers.findIndex((h) => h.toLowerCase() === "year");
    const deathsIdx = headers.findIndex((h) => h.toLowerCase().includes("deaths from tb (all forms"));
    const incIdx = headers.findIndex((h) => h.toLowerCase().includes("number of incident cases"));

    for (let c = 0; c < headers.length; c++) {
      const colName = headers[c];
      let nullCount = 0;
      let numericCount = 0;
      const values: string[] = [];
      const numValues: number[] = [];
      const uniqueSet = new Set<string>();

      for (let r = 0; r < sampleRows.length; r++) {
        const val = sampleRows[r][c] ?? "";
        if (val === "" || val === "NA" || val === "null") {
          nullCount++;
        } else {
          values.push(val);
          uniqueSet.add(val);
          const num = Number(val);
          if (!isNaN(num) && isFinite(num)) {
            numericCount++;
            numValues.push(num);
          }
        }
      }

      const isNumeric = numericCount > values.length * 0.7 && numValues.length > 0;
      const colType: ColumnStat["type"] = colName.toLowerCase() === "year" ? "year" : isNumeric ? "number" : "string";

      let min = undefined;
      let max = undefined;
      let mean = undefined;
      const sampleDist: number[] = [];

      if (isNumeric && numValues.length > 0) {
        min = Math.min(...numValues);
        max = Math.max(...numValues);
        mean = numValues.reduce((a, b) => a + b, 0) / numValues.length;

        // 8-bucket histogram for sparklines
        const buckets = new Array(8).fill(0);
        const range = max - min || 1;
        for (const nv of numValues) {
          const bIdx = Math.min(7, Math.floor(((nv - min) / range) * 8));
          buckets[bIdx]++;
        }
        sampleDist.push(...buckets);
      }

      columns.push({
        name: colName,
        type: colType,
        nullCount,
        nullPercent: sampleRows.length > 0 ? (nullCount / sampleRows.length) * 100 : 0,
        min,
        max,
        mean,
        uniques: uniqueSet.size,
        sampleDist,
      });
    }

    // Time-series & Country Aggregations
    for (const row of sampleRows) {
      const country = countryIdx !== -1 ? row[countryIdx] : "";
      const year = yearIdx !== -1 ? parseInt(row[yearIdx]) : NaN;
      const deaths = deathsIdx !== -1 ? parseFloat(row[deathsIdx]) || 0 : 0;
      const inc = incIdx !== -1 ? parseFloat(row[incIdx]) || 0 : 0;

      if (country && deaths > 0) {
        countryMortalityMap.set(country, (countryMortalityMap.get(country) || 0) + deaths);
      }

      if (!isNaN(year)) {
        yearDeathsMap.set(year, (yearDeathsMap.get(year) || 0) + deaths);
        yearIncidenceMap.set(year, (yearIncidenceMap.get(year) || 0) + inc);
      }
    }

    // Yearly Trends sorted
    const yearlyTrends = Array.from(yearDeathsMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, deaths]) => ({
        year,
        deaths,
        incidence: yearIncidenceMap.get(year) || 0,
      }));

    // Top 10 Countries by Mortality
    const topCountriesByMortality = Array.from(countryMortalityMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([country, deaths]) => ({ country, deaths }));

    return {
      filepath,
      rowCount,
      columnCount: headers.length,
      headers,
      columns,
      rows: sampleRows,
      yearlyTrends,
      topCountriesByMortality,
    };
  }
}
