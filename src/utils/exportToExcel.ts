export const exportToStyledExcel = (filename: string, headers: string[], data: any[][], title?: string) => {
  // إنشاء جدول HTML متوافق مع Excel - بدون رسالة تحذير
  const tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Sheet1</x:Name>
              <x:WorksheetOptions>
                <x:DisplayRightToLeft/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; width: 100%; direction: rtl; font-family: 'Segoe UI', Arial, sans-serif; }
        th { background-color: #4f46e5; color: white; font-weight: bold; padding: 12px; border: 1px solid #c7d2fe; text-align: center; font-size: 12pt; }
        td { padding: 10px; border: 1px solid #e2e8f0; text-align: center; color: #334155; font-size: 11pt; }
        .title { font-size: 20px; font-weight: bold; color: #1e293b; text-align: center; padding: 15px; background-color: #f8fafc; border: 1px solid #e2e8f0; }
        .alt-row { background-color: #f8fafc; }
      </style>
    </head>
    <body>
      <table>
        ${title ? `<tr><td colspan="${headers.length}" class="title">${title}</td></tr>` : ''}
        <tr>
          ${headers.map(h => `<th>${h}</th>`).join('')}
        </tr>
        ${data.map((row, index) => `
          <tr class="${index % 2 !== 0 ? 'alt-row' : ''}">
            ${row.map(cell => `<td>${cell ?? '-'}</td>`).join('')}
          </tr>
        `).join('')}
      </table>
    </body>
    </html>
  `;

  // استخدام application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  // لتجنب رسالة التحذير عند فتح Excel
  const bom = "\uFEFF";
  const blob = new Blob([bom + tableHtml], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};