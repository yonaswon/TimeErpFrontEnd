import * as XLSX from 'xlsx';

export interface ReportRelease {
  date: string;
  reason: string;
  reason_display: string;
  amount: number;
  // ORDER
  order_code?: number;
  order_name?: string | null;
  additional_amount?: number; // ADD release linked to same order
  // SALE
  sale_id?: number;
  customer_name?: string | null;
  // divider record
  isDivider?: boolean;
  dividerLabel?: string;
}

export interface ReportRecord {
  id: number;
  first_amount: number;
  current_amount: number;
  price: number;
  created_at: string;
  created_by: string | null;
  source: string;
  purchase_id?: number | null;
  inventory_name: string;
}

export interface ExcelReportOptions {
  materialName: string;
  materialType: string; // 'L' | 'P'
  recordedBy: string | null;
  fromRecord: ReportRecord;
  rows: ReportRelease[];
  generatedAt: string;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function fmtAmt(n: number, type: string): string {
  return type === 'L' ? `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })} m` : `${n.toLocaleString('en-US', { maximumFractionDigits: 0 })} pcs`;
}

export function generateMaterialUsageExcel(opts: ExcelReportOptions): Blob {
  const { materialName, materialType, recordedBy, fromRecord, rows, generatedAt } = opts;
  const wb = XLSX.utils.book_new();

  // ── Sheet data ──────────────────────────────────────────────────────────────
  const sheetData: any[][] = [];

  // Header info rows
  sheetData.push(['Material Usage Report']);
  sheetData.push(['Material:', materialName]);
  sheetData.push(['Type:', materialType === 'L' ? 'Length' : 'Piece']);
  sheetData.push(['Recorded By:', recordedBy ? `@${recordedBy}` : 'Unknown']);
  sheetData.push(['Record Date:', fmtDate(fromRecord.created_at)]);
  sheetData.push(['Initial Amount:', fmtAmt(fromRecord.first_amount, materialType)]);
  sheetData.push(['Report Generated:', fmtDate(generatedAt)]);
  sheetData.push([]); // blank row

  // Table header
  sheetData.push([
    'Date',
    'Type',
    'Order / Sale ID',
    'Name / Client',
    'Amount Used',
    'Additional',
    'Notes',
  ]);

  let totalAmount = 0;
  let totalAdditional = 0;

  for (const row of rows) {
    if (row.isDivider) {
      sheetData.push([`── ${row.dividerLabel} ──`, '', '', '', '', '', '']);
      continue;
    }

    let typeLabel = row.reason_display;
    let idCol = '';
    let nameCol = '';
    let additionalCol = '';
    let notesCol = '';

    if (row.reason === 'ORDER') {
      idCol = row.order_code ? `ORD-${row.order_code}` : '';
      nameCol = row.order_name || '';
      additionalCol = row.additional_amount ? fmtAmt(row.additional_amount, materialType) : '';
      if (row.additional_amount) totalAdditional += row.additional_amount;
    } else if (row.reason === 'ADD') {
      idCol = row.order_code ? `ORD-${row.order_code}` : '';
      nameCol = row.order_name || '';
      typeLabel = 'Additional';
    } else if (row.reason === 'SALE') {
      idCol = row.sale_id ? `SALE-${row.sale_id}` : '';
      nameCol = row.customer_name || '';
    } else if (row.reason === 'MAINTENANCE') {
      notesCol = 'Maintenance';
    } else if (row.reason === 'WAST') {
      notesCol = 'Wastage';
    } else if (row.reason === 'ADJ') {
      notesCol = 'Adjustment';
    }

    totalAmount += row.amount;

    sheetData.push([
      fmtDate(row.date),
      typeLabel,
      idCol,
      nameCol,
      fmtAmt(row.amount, materialType),
      additionalCol,
      notesCol,
    ]);
  }

  // Totals row
  sheetData.push([]);
  sheetData.push([
    'TOTAL',
    '',
    '',
    '',
    fmtAmt(totalAmount, materialType),
    totalAdditional > 0 ? fmtAmt(totalAdditional, materialType) : '',
    '',
  ]);

  // ── Build worksheet ─────────────────────────────────────────────────────────
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Column widths
  ws['!cols'] = [
    { wch: 16 }, // Date
    { wch: 18 }, // Type
    { wch: 18 }, // Order/Sale ID
    { wch: 28 }, // Name/Client
    { wch: 16 }, // Amount
    { wch: 16 }, // Additional
    { wch: 20 }, // Notes
  ];

  // ── Styling via cell properties ──────────────────────────────────────────────
  // Title row
  const titleCell = ws['A1'];
  if (titleCell) {
    titleCell.s = {
      font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1E3A5F' } },
      alignment: { horizontal: 'center' },
    };
  }

  // Merge title across columns
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Title
  ];

  // Table header row (row index 8 = index 8 in 0-based)
  const headerRowIdx = 8;
  const headerCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const headerColors: Record<string, string> = {
    A: '2563EB', B: '2563EB', C: '2563EB', D: '2563EB',
    E: '16A34A', F: '9333EA', G: '6B7280',
  };
  headerCols.forEach((col, i) => {
    const cellRef = `${col}${headerRowIdx + 1}`;
    if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
    ws[cellRef].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
      fill: { fgColor: { rgb: headerColors[col] } },
      alignment: { horizontal: 'center', wrapText: true },
      border: {
        bottom: { style: 'medium', color: { rgb: 'FFFFFF' } },
      },
    };
  });

  // Data rows styling (alternating)
  const dataStartRow = headerRowIdx + 1; // 0-based
  let dataRowCount = 0;
  for (let r = dataStartRow; r < sheetData.length - 2; r++) {
    const rowData = sheetData[r];
    if (!rowData || rowData.length === 0) continue;
    const isDivider = typeof rowData[0] === 'string' && rowData[0].startsWith('──');
    const isEven = dataRowCount % 2 === 0;
    dataRowCount++;

    headerCols.forEach((col) => {
      const cellRef = `${col}${r + 1}`;
      if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
      if (isDivider) {
        ws[cellRef].s = {
          font: { bold: true, italic: true, color: { rgb: '374151' } },
          fill: { fgColor: { rgb: 'E5E7EB' } },
          alignment: { horizontal: 'left' },
        };
      } else {
        ws[cellRef].s = {
          fill: { fgColor: { rgb: isEven ? 'EFF6FF' : 'FFFFFF' } },
          alignment: { horizontal: col === 'E' || col === 'F' ? 'center' : 'left' },
          border: {
            bottom: { style: 'thin', color: { rgb: 'DBEAFE' } },
          },
        };
      }
    });
  }

  // Totals row
  const totalsRowIdx = sheetData.length - 1;
  headerCols.forEach((col) => {
    const cellRef = `${col}${totalsRowIdx + 1}`;
    if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
    ws[cellRef].s = {
      font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1E3A5F' } },
      alignment: { horizontal: col === 'E' || col === 'F' ? 'center' : 'left' },
    };
  });

  XLSX.utils.book_append_sheet(wb, ws, 'Material Usage');

  // ── Return as Blob ──────────────────────────────────────────────────────────
  const wbArray = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbArray], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// Helper to trigger download in Telegram Mini App
export function downloadExcelInTelegram(blob: Blob, fileName: string) {
  // Convert blob to base64 for Telegram
  const reader = new FileReader();
  reader.onloadend = () => {
    const base64 = (reader.result as string).split(',')[1];
    const dataUri = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      // Telegram Mini App: open in external browser
      window.Telegram.WebApp.openLink(dataUri);
    } else {
      // Fallback: standard download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    }
  };
  reader.readAsDataURL(blob);
}
